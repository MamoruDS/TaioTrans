import { EventEmitter } from 'events'

import * as constant from './constant'
import * as utils from './utils'
import * as Taio from './taio'
import * as builtInJS from './builtIn'
import * as beautify from 'js-beautify'

export const SESSION_PREFIX =
    (Date.now() * 5).toString(36).toLocaleUpperCase() +
    '-' +
    utils.genRandomStr(4)

export type AltParam = string | FlowVariable

const SIGNED_VARS = [
    '(?<user>([\\w|_|-])+)',
    '@input',
    '@clipboard.text',
    '@date.style\\(\\d,\\d\\)',
    '@date.format\\([^)|\\r|\\n]+\\)',
    '@editor.file-name',
    '@editor.file-extension',
    '@editor.full-text',
    '@editor.selection-text',
    '@editor.selection-location',
    '@editor.selection-length',
].map((item) => {
    return `{${item}}`
})

const getRawStrFromParma = (param?: AltParam): string => {
    param =
        typeof param === 'string' ? param : param || new FlowVariable('@input')
    return param + ''
}

const genTaioFlowVal = (value: string): Taio.TaioFlowVal => {
    const re = new RegExp(
        `(${SESSION_PREFIX}-(?<mat>${SIGNED_VARS.map((preset) => {
            return '(' + preset + ')'
        }).join('|')}))+`,
        'gm'
    )
    const matches = [] as { start: number; len: number; VID: string }[]
    const flowVal = {
        value: undefined,
        tokens: [],
    } as Taio.TaioFlowVal
    while (true) {
        const match = re.exec(value)
        if (match == null) break
        matches.push({
            start: match.index,
            len: +match[0].length,
            VID: match.groups['user'] || match.groups['mat'].slice(1, -1),
        })
    }
    const valarr: string[] = value.split('')
    while (true) {
        const match = matches.pop()
        if (typeof match == 'undefined') break
        valarr.splice(match.start, match.len, '$')
        flowVal.tokens.push({
            location: match.start,
            value: match.VID,
        })
    }
    flowVal.value = valarr.join('')
    if (flowVal.tokens.length == 0) delete flowVal.tokens
    return flowVal
}

const getTaioFlowValFromParam = (param?: AltParam): Taio.TaioFlowVal => {
    return genTaioFlowVal(getRawStrFromParma(param))
}

class FlowVariable {
    private _action: TaioAction
    private _VID: string
    constructor(presetID?: string, action?: TaioAction) {
        this._action = action
        this._VID = presetID || `${utils.genRandomStr(6)}`
    }
    get VID(): string {
        return this._VID
    }
    private _varStringify(): string {
        return SESSION_PREFIX + '-{' + this._VID + '}'
    }
    public toString(): string {
        return this._varStringify()
    }
    public toJSON(): string {
        return this._varStringify()
    }
    public assign(value?: AltParam): void {
        this._action.setVariable(value, this._VID)
    }
}

type TaioFlowCondition = {
    leftHandSide?: AltParam
    rightHandSide?: AltParam
    condition: keyof typeof Taio.TaioFlowCondition
}

type TaioFlowScopeType = 'root' | 'condition' | 'repeat'

export class TaioAction {
    private _actions: Taio.TaioFlowActionExt[]
    private _buildVersion: number
    private _clientVersion: number
    private _scopes?: {
        BID: string
        type: TaioFlowScopeType
    }[]
    private _verifyBID: string[]
    public name: string
    public summary: string
    public iconGlyph: string
    public iconColor: Taio.HEX
    constructor() {
        this._actions = []
        this.name = 'untitled'
        this.summary = ''
        this.iconGlyph = constant.DEFAULT_ICON
        this.iconColor = constant.DEFAULT_ICON_COLOR
        this._buildVersion = constant.BUILD_VERSION
        this._clientVersion = constant.CLIENT_VERSION
        const BID = Taio.genBID()
        this._scopes = [
            {
                type: 'root',
                BID: BID,
            },
        ]
        this._verifyBID = [BID]
    }
    public builtInVars(
        name:
            | 'Last Result'
            | 'Clipboard'
            | 'File Name'
            | 'File Extension'
            | 'Full Text'
            | 'Selected Text'
            | 'Selected Location'
            | 'Selected Length'
    ): FlowVariable
    public builtInVars(name: 'Last Result'): FlowVariable
    public builtInVars(
        name: 'Current Date',
        style: {
            dateStyle?: keyof typeof Taio.DATE_STYLE
            timeStyle?: keyof typeof Taio.TIME_STYLE
        }
    ): FlowVariable
    public builtInVars(
        name: 'Current Date',
        customFormat?: string
    ): FlowVariable
    public builtInVars(name: string, ...P: any[]): FlowVariable {
        if (name == 'Current Date') {
            // if(typeof P[0] ===)
            const style = {
                dateStyle: 2,
                timeStyle: 0,
            }
            if (P.length == 0) {
                return new FlowVariable(
                    `@date.style(${style.dateStyle},${style.timeStyle})`,
                    this
                )
            }
            if (typeof P[0] == 'string') {
                return new FlowVariable(`@date.format(${P[0]})`, this)
            } else {
                try {
                    style.dateStyle =
                        Taio.DATE_STYLE[P[0]['dateStyle']] || style.dateStyle
                } catch (e) {}
                try {
                    style.timeStyle =
                        Taio.TIME_STYLE[P[0]['timeStyle']] || style.timeStyle
                } catch (e) {}
                return new FlowVariable(
                    `@date.style(${style.dateStyle},${style.timeStyle})`,
                    this
                )
            }
        }
        const preset: {
            [key: string]: FlowVariable
        } = {
            'Last Result': new FlowVariable('@input', this),
            Clipboard: new FlowVariable('@clipboard.text', this),
            'File Name': new FlowVariable('@editor.file-name', this),
            'File Extension': new FlowVariable('@editor.file-extension', this),
            'Full Text': new FlowVariable('@editor.full-text', this),
            'Selected Text': new FlowVariable('@editor.selection-text', this),
            'Selected Location': new FlowVariable(
                '@editor.selection-location',
                this
            ),
            'Selected Length': new FlowVariable(
                '@editor.selection-length',
                this
            ),
        }
        return preset[name]
    }

    private _addAction(
        item: Taio.TaioFlowActionExt,
        targetBlockId?: string
    ): void {
        this.appendItem(item)
    }

    // # Action Library
    // ## General
    public comment(text: string = ''): void {
        const _: Taio.TaioFlowComment = {
            type: '@comment',
            clientMinVersion: 1,
            parameters: {
                text: {
                    value: text,
                },
            },
        }
        this._addAction(_)
    }
    // ## Text
    public createText(text?: AltParam): void {
        const _: Taio.TaioFlowText = {
            type: '@text',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public textCase(
        text?: AltParam,
        mode: keyof typeof Taio.optionTextCase = 'Upper Case'
    ): void {
        const _: Taio.TaioFlowTextCase = {
            type: '@text.case',
            clientMinVersion: 1,
            parameters: {
                mode: Taio.optionTextCase[mode],
                text: getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public encodeText(
        text?: AltParam,
        decode?: boolean,
        mode: keyof typeof Taio.optionTextEncode = 'URL Encode'
    ): void {
        const _: Taio.TaioFlowTextEncode = {
            type: '@text.encode',
            clientMinVersion: 1,
            parameters: {
                mode: Taio.optionTextEncode[mode],
                decode: decode ? true : false,
                text: getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public count(
        text?: AltParam,
        mode: keyof typeof Taio.optionTextCount = 'By Line'
    ): void {
        const _: Taio.TaioFlowTextCount = {
            type: '@text.count',
            clientMinVersion: 1,
            parameters: {
                mode: Taio.optionTextCount[mode],
                text: getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public textInRange(
        text?: AltParam,
        localtion: number = 0,
        length: number = 1
    ): void {
        const _: Taio.TaioFlowTextRange = {
            type: '@text.extract-range',
            clientMinVersion: 1,
            parameters: {
                location: localtion,
                length: length,
                text: getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public textFilter(
        text?: AltParam,
        pattern?: AltParam,
        mode: keyof typeof Taio.optionTextFilter = 'Phone Number'
    ): void {
        const _: Taio.TaioFlowTextFilter = {
            type: '@text.filter',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionTextFilter[mode],
                pattern: getTaioFlowValFromParam(pattern),
            },
        }
        this._addAction(_)
    }
    public textTokenization(text?: AltParam): void {
        const _: Taio.TaioFlowTextTokenize = {
            type: '@text.tokenize',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
            },
        }
    }
    public findAndReplace(
        text?: AltParam,
        pattern?: AltParam,
        replacement?: AltParam,
        mode: keyof typeof Taio.optionTextReplace = 'Case Insensitive'
    ): void {
        const _: Taio.TaioFlowTextReplace = {
            type: '@text.replace',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                pattern: getTaioFlowValFromParam(pattern),
                replacement: getTaioFlowValFromParam(replacement),
                mode: Taio.optionTextReplace[mode],
            },
        }
    }
    public trimText(
        text?: AltParam,
        mode: keyof typeof Taio.optionTextTrim = 'Empty Characters'
    ): void {
        const _: Taio.TaioFlowTextTrim = {
            type: '@text.trim',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionTextTrim[mode],
            },
        }
        this._addAction(_)
    }
    // ## User Interface
    // public textInput(): void {}
    public selectFromMenu(
        items: AltParam,
        title: AltParam,
        multiSelect: boolean = false
    ): void {
        const _: Taio.TaioFlowMenu = {
            type: '@ui.menu',
            clientMinVersion: 1,
            parameters: {
                lines: getTaioFlowValFromParam(items),
                prompt: getTaioFlowValFromParam(title),
                multiValue: multiSelect,
            },
        }
        this._addAction(_)
    }
    // public showAlert(): void {}
    // public showConfirmDialog(): void {}
    // public showToast(): void {}
    public showText(text: AltParam): void {
        const _: Taio.TaioFlowText = {
            type: '@text',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    // public showHTML(): void {}
    // public compareDiff(): void {}
    // ## List
    // public filterLines(): void {}
    // public deduplicateLines(): void {}
    // public reverseText(): void {}
    // public sortLines(): void {}
    // public splitText(): void {}
    // public mergeText(): void {}
    // public truncateLines(): void {}
    // ## Editor
    // public newDocument(): void {}
    // public openDocument(): void {}
    // public getFileName(): void {}
    // public getText(): void {}
    // public setText(): void {}
    // public extendSelection(): void {}
    // public getSelectedText(): void {}
    // public moveCursor(): void {}
    // public replaceSelectedText(): void {}
    // public selectRange(): void {}
    // ## Clips
    // public insertClipping(): void {}
    // public deleteClipping(): void {}
    // public replaceClipping(): void {}
    // public pinClipping(): void {}
    // public getClipping(): void {}
    // public setClippingText(): void {}
    // ## Scripting
    public If(condition: TaioFlowCondition, scope: () => void) {
        const taioIf = new TaioFlowIf(this, condition, scope)
        taioIf._event.addListener('exit', (scopeIf, scopeElse) => {
            this.spawnChildScope('condition', (BID) => {
                scopeIf(BID)
                scopeElse(BID)
            })
        })
        return taioIf
    }
    public afterDelay(interval: number = 1): void {
        const _: Taio.TaioFlowDelay = {
            type: '@flow.delay',
            clientMinVersion: 1,
            parameters: {
                interval: interval,
            },
        }
        this._addAction(_)
    }
    public finishRunning(): void {
        const _: Taio.TaioFlowFinish = {
            type: '@flow.finish',
            clientMinVersion: 1,
        }
        this._addAction(_)
    }
    public setVariable(value: AltParam, name?: string): FlowVariable {
        if (typeof name == 'string') {
            if (/^[\w|_|-]+$/g.exec(name) == null) {
                throw new Error(
                    `Invalid operation in <TaioAction>\n\ton allocate new variable with invalid name "${name}"`
                )
            }
        }
        const v = new FlowVariable(name, this)
        const _: Taio.TaioFlowVarSet = {
            type: '@flow.set-variable',
            clientMinVersion: 1,
            parameters: {
                name: {
                    value: v.VID,
                },
                value: getTaioFlowValFromParam(value),
            },
        }
        this._addAction(_)
        return v
    }
    public getVariable(
        name: AltParam,
        fallback: keyof typeof Taio.optionGlobalTaioFallback = 'Return Empty Text'
    ): void {
        const _: Taio.TaioFlowVarGet = {
            type: '@flow.get-variable',
            clientMinVersion: 1,
            parameters: {
                fallback: Taio.optionGlobalTaioFallback[fallback],
                name: getTaioFlowValFromParam(name),
            },
        }
        this._addAction(_)
    }
    public repeatBlock(count: number, repeatScope: () => void): void {
        this.spawnChildScope('repeat', (BID) => {
            const repeatHead: Taio.TaioFlowRepeat = {
                type: '@flow.repeat-begin',
                clientMinVersion: 1,
                parameters: {
                    blockIdentifier: BID,
                    count: count,
                },
            }
            this.appendItem(repeatHead)
            repeatScope()
        })
    }
    // public forEach(): void {}
    public runJavaScript(fn: builtInJS.runJS): void {
        const indentLen = 4
        const code: string[] = beautify('' + fn, {
            indent_size: indentLen,
        })
            .split('\n')
            .slice(1, -1)
        for (const _i in code) {
            code[_i] = code[_i].slice(indentLen)
        }
        const _: Taio.TaioFlowJS = {
            type: '@flow.javascript',
            clientMinVersion: 1,
            parameters: {
                script: {
                    value: code.join('\n'),
                },
            },
        }
        this._addAction(_)
    }
    // ## Utilities
    // public showDictionaryDefinition(): void {}
    // public getClipboard(): void {}
    // public setClipboard(): void {}
    // public math(): void {}
    // public speakText(): void {}
    // public openURL(): void {}
    // public webSearch(): void {}
    public HTTPRequest(
        url: AltParam,
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
        headers: {
            [key: string]: AltParam
        } = {},
        body: {
            [key: string]: AltParam
        } = {}
    ): void {
        let methodNr: number = 0
        const methods: string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        for (const i in methods) {
            if (methods[i] == method) {
                methodNr = parseInt(i)
                break
            }
        }
        const _: Taio.TaioFlowRequest = {
            type: '@util.request',
            clientMinVersion: 1,
            parameters: {
                url: getTaioFlowValFromParam(url),
                method: methodNr,
                body: genTaioFlowVal(JSON.stringify(body)),
                headers: genTaioFlowVal(JSON.stringify(headers)),
            },
        }
        this._addAction(_)
    }
    // public markdown2HTML(): void {}
    // ## Sharing
    // public shareSheet(): void {}
    // public composeEmail(): void {}
    // public composeTextMessage(): void {}

    get flowBuildVersion(): number {
        return this._buildVersion
    }
    // get flowClientMinVersion(): number {}
    get flowClientVersion(): number {
        return this._clientVersion
    }
    public spawnChildScope(
        type: TaioFlowScopeType,
        scope: (BID: string) => void
    ): void {
        const BID = Taio.genBID()
        this._verifyBID.unshift(BID)
        this._scopes.unshift({
            BID,
            type,
        })
        scope(BID)
        if (BID != this._verifyBID.shift()) {
            // TODO: Err
        }
        return
    }
    public autoCompleteChildScope(): void {
        const curScope = this._scopes[0]
        const verifyBID = this._verifyBID[0]
        if (curScope['BID'] == verifyBID) {
            return
        } else {
            let item: Taio.TaioFlowActionExt
            switch (curScope['type']) {
                case 'root': {
                    item = {
                        clientMinVersion: 0,
                        type: '@flow.root',
                        parameters: {
                            blockIdentifier: curScope['BID'],
                        },
                    }
                    break
                }
                case 'condition': {
                    item = {
                        type: '@flow.endif',
                        clientMinVersion: 1,
                        parameters: {
                            blockIdentifier: curScope['BID'],
                        },
                    } as Taio.TaioFlowConditionControl
                    break
                }
                case 'repeat': {
                    item = {
                        clientMinVersion: 1,
                        type: '@flow.repeat-end',
                        parameters: {
                            blockIdentifier: curScope['BID'],
                        },
                    } as Taio.TaioFlowRepeat
                    break
                }
            }
            this._scopes.shift()
            this.appendItem(item, true)
            this.autoCompleteChildScope()
        }
        return
    }
    public appendItem(
        item: Taio.TaioFlowActionExt,
        ignoreVerify?: boolean
    ): void {
        if (!ignoreVerify) {
            this.autoCompleteChildScope()
        }
        this._actions.push(item)
        return
    }
    public flowParse(): Taio.TaioFlowInfo {
        this.autoCompleteChildScope()
        const actions = [] as Taio.TaioFlowAction[]
        let clientMinVersion: number = 1
        this._actions.forEach((a) => {
            actions.push({
                type: a.type,
                parameters: a.parameters,
            })
            clientMinVersion =
                a.clientMinVersion > clientMinVersion
                    ? a.clientMinVersion
                    : clientMinVersion
        })
        return {
            name: this.name,
            summary: this.summary,
            buildVersion: this._buildVersion,
            clientVersion: this._clientVersion,
            clientMinVersion: clientMinVersion,
            icon: {
                glyph: this.iconGlyph,
                color: this.iconColor,
            },
            actions: actions,
        }
    }
}

class TaioFlowIf {
    private _action: TaioAction
    private _scopeIf: (BID: string) => void
    private _scopeElse: (BID: string) => void
    public _event: EventEmitter
    constructor(
        action: TaioAction,
        condition: TaioFlowCondition,
        scope: () => void
    ) {
        this._action = action
        this._event = new EventEmitter()
        this._event.emit('init')

        this._scopeIf = (BID) => {
            const conditionIf: Taio.TaioFlowConditionControl = {
                type: '@flow.if',
                clientMinVersion: 1,
                parameters: {
                    blockIdentifier: BID,
                    condition: Taio.TaioFlowCondition[condition.condition || 0],
                    lhs: getTaioFlowValFromParam(condition.leftHandSide),
                    rhs: getTaioFlowValFromParam(condition.rightHandSide),
                },
            }
            this._action.appendItem(conditionIf)
            scope()
            const conditionElse: Taio.TaioFlowConditionControl = {
                type: '@flow.else',
                clientMinVersion: 1,
                parameters: {
                    blockIdentifier: BID,
                },
            }
            this._action.appendItem(conditionElse)
        }
    }
    public ElseIf(condition: TaioFlowCondition, scope: () => void): TaioFlowIf {
        this.Else()
        return this._action.If(condition, scope)
    }
    public Else(scope?: () => void): void {
        scope = scope ? scope : () => {}
        this._scopeElse = scope
        this._event.emit('exit', this._scopeIf, this._scopeElse)
    }
}
