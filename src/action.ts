import * as constant from './constant'
import * as utils from './utils'
import * as flow from './flow'
import * as builtInJS from './builtIn'
import * as beautify from 'js-beautify'

export const SESSION_PREFIX =
    (Date.now() * 5).toString(36).toLocaleUpperCase() +
    '-' +
    utils.genRandomStr(4)

type AltParam = string | FlowVariable

const getRawStrFromParma = (param?: AltParam): string => {
    param = param || new FlowVariable('@input')
    return param + ''
}

class FlowVariable {
    private _actionStack: CustomStack
    private _VID: string
    constructor(presetID?: string, stack?: CustomStack) {
        this._actionStack = stack
        this._VID = presetID || `V-${utils.genRandomStr(6)}`
    }
    get VID(): string {
        return this._VID
    }
    public toString(): string {
        return SESSION_PREFIX + '-' + this._VID
    }
    public toJSON(): string {
        return SESSION_PREFIX + '-' + this._VID
    }
    public assign(value?: AltParam): void {
        const action = this._actionStack[0]['item'] as TaioAction
        action.setVariable(value, this._VID)
    }
}

type CustomStack = {
    id: string
    item: CustomStackItem
}[]

class CustomStackItem {
    protected _stack: CustomStack
    protected _ID: string
    constructor(stack: CustomStack = []) {
        this._ID = utils.genRandomHex(6)
        this._stack = stack
        stack.unshift({
            id: this._ID,
            item: this,
        })
    }
    protected _pop(): void {
        if (this._stack[0]['id'] == this._ID) {
            this._stack.shift()
        } else {
            throw new Error(
                `Invalid operation in <CustomStackItem>\n\ton destory("${this._ID}")`
            )
        }
    }
    protected _print(): void {
        console.log(
            this._stack.map((item) => {
                return item.id
            })
        )
    }
}

type TaioFlowCondition = {
    leftHandSide?: AltParam
    rightHandSide?: AltParam
    condition: keyof typeof flow.TaioFlowCondition
}

export class TaioAction extends CustomStackItem {
    private _actions: flow.TaioFlowItem[]
    private _buildVersion: number
    private _clientMinVersion: number
    private _clientVersion: number
    private _localBlock?: {
        BID: string
        type: 'root' | 'condition' | 'repeat'
    }
    public name: string
    public summary: string
    public iconGlyph: string
    public iconColor: flow.HEX
    private _signedVars: string[]
    constructor(actionStack?: CustomStack) {
        super(actionStack)
        this.name = 'untitled'
        this.summary = ''
        this.iconGlyph = constant.DEFAULT_ICON
        this.iconColor = constant.DEFAULT_ICON_COLOR
        this._actions = []
        this._buildVersion = constant.BUILD_VERSION
        this._clientMinVersion = constant.CLIENT_MIN_VERSION
        this._clientVersion = constant.CLIENT_VERSION
        this._signedVars = [
            '{(?<user>([\\w|_|-])+)}',
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
        ]
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
            dateStyle?: keyof typeof flow.DATE_STYLE
            timeStyle?: keyof typeof flow.TIME_STYLE
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
                    this._stack
                )
            }
            if (typeof P[0] == 'string') {
                return new FlowVariable(`@date.format(${P[0]})`, this._stack)
            } else {
                try {
                    style.dateStyle =
                        flow.DATE_STYLE[P[0]['dateStyle']] || style.dateStyle
                } catch (e) {}
                try {
                    style.timeStyle =
                        flow.TIME_STYLE[P[0]['timeStyle']] || style.timeStyle
                } catch (e) {}
                return new FlowVariable(
                    `@date.style(${style.dateStyle},${style.timeStyle})`,
                    this._stack
                )
            }
        }
        const preset: {
            [key: string]: FlowVariable
        } = {
            'Last Result': new FlowVariable('@input', this._stack),
            Clipboard: new FlowVariable('@clipboard.text', this._stack),
            'File Name': new FlowVariable('@editor.file-name', this._stack),
            'File Extension': new FlowVariable(
                '@editor.file-extension',
                this._stack
            ),
            'Full Text': new FlowVariable('@editor.full-text', this._stack),
            'Selected Text': new FlowVariable(
                '@editor.selection-text',
                this._stack
            ),
            'Selected Location': new FlowVariable(
                '@editor.selection-location',
                this._stack
            ),
            'Selected Length': new FlowVariable(
                '@editor.selection-length',
                this._stack
            ),
        }
        return preset[name]
    }

    private _localBlockAutoComplete(targetBlockId?: string): boolean {
        if (this._localBlock) {
            if (!targetBlockId) {
                switch (this._localBlock.type) {
                    case 'repeat': {
                        const reapeatTail: flow.TaioFlowRepeat = {
                            type: '@flow.repeat-end',
                            parameters: {
                                blockIdentifier: this._localBlock.BID,
                            },
                        }
                        delete this._localBlock
                        this._addAction(reapeatTail)
                        break
                    }
                    case 'condition': {
                        const conditionFi: flow.TaioFlowConditionControl = {
                            type: '@flow.endif',
                            parameters: {
                                blockIdentifier: this._localBlock.BID,
                            },
                        }
                        delete this._localBlock
                        this._addAction(conditionFi)
                        break
                    }
                }
                return true
            } else if (targetBlockId != this._localBlock.BID) {
                throw new Error()
            }
        }
        return false
    }
    private _addAction(item: flow.TaioFlowItem, targetBlockId?: string): void {
        this._localBlockAutoComplete(targetBlockId)
        this._actions.push(item)
    }
    private _getTaioFlowValFromParam(param?: AltParam): flow.TaioFlowVal {
        return this._genTaioFlowVal(getRawStrFromParma(param))
    }
    private _genTaioFlowVal = (value: string): flow.TaioFlowVal => {
        const re = new RegExp(
            `(${SESSION_PREFIX}-(?<mat>(?<auto>V-[\\w]{6})|${this._signedVars
                .map((name) => {
                    return '(' + name + ')'
                })
                .join('|')}))+`,
            'gm'
        )
        const matches = [] as { start: number; len: number; VID: string }[]
        const flowVal = {
            value: undefined,
            tokens: [],
        } as flow.TaioFlowVal
        while (true) {
            const match = re.exec(value)
            if (match == null) break
            matches.push({
                start: match.index,
                len: +match[0].length,
                VID:
                    match.groups['user'] ||
                    match.groups['auto'] ||
                    match.groups['mat'],
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

    // # Action Library
    // ## General
    public comment(text: string = ''): void {
        const _: flow.TaioFlowComment = {
            type: '@comment',
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
        const _: flow.TaioFlowText = {
            type: '@text',
            parameters: {
                text: this._getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public textCase(
        text?: AltParam,
        mode: keyof typeof flow.optionTextCase = 'Upper Case'
    ): void {
        const _: flow.TaioFlowTextCase = {
            type: '@text.case',
            parameters: {
                mode: flow.optionTextCase[mode],
                text: this._getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public encodeText(
        text?: AltParam,
        decode?: boolean,
        mode: keyof typeof flow.optionTextEncode = 'URL Encode'
    ): void {
        const _: flow.TaioFlowTextEncode = {
            type: '@text.encode',
            parameters: {
                mode: flow.optionTextEncode[mode],
                decode: decode ? true : false,
                text: this._getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public count(
        text?: AltParam,
        mode: keyof typeof flow.optionTextCount = 'By Line'
    ): void {
        const _: flow.TaioFlowTextCount = {
            type: '@text.count',
            parameters: {
                mode: flow.optionTextCount[mode],
                text: this._getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public textInRange(
        text?: AltParam,
        localtion: number = 0,
        length: number = 1
    ): void {
        const _: flow.TaioFlowTextRange = {
            type: '@text.extract-range',
            parameters: {
                location: localtion,
                length: length,
                text: this._getTaioFlowValFromParam(text),
            },
        }
        this._addAction(_)
    }
    public textFilter(
        text?: AltParam,
        pattern?: AltParam,
        mode: keyof typeof flow.optionTextFilter = 'Phone Number'
    ): void {
        const _: flow.TaioFlowTextFilter = {
            type: '@text.filter',
            parameters: {
                text: this._getTaioFlowValFromParam(text),
                mode: flow.optionTextFilter[mode],
                pattern: this._getTaioFlowValFromParam(pattern),
            },
        }
        this._addAction(_)
    }
    public textTokenization(text?: AltParam): void {
        const _: flow.TaioFlowTextTokenize = {
            type: '@text.tokenize',
            parameters: {
                text: this._getTaioFlowValFromParam(text),
            },
        }
    }
    public findAndReplace(
        text?: AltParam,
        pattern?: AltParam,
        replacement?: AltParam,
        mode: keyof typeof flow.optionTextReplace = 'Case Insensitive'
    ): void {
        const _: flow.TaioFlowTextReplace = {
            type: '@text.replace',
            parameters: {
                text: this._getTaioFlowValFromParam(text),
                pattern: this._getTaioFlowValFromParam(pattern),
                replacement: this._getTaioFlowValFromParam(replacement),
                mode: flow.optionTextReplace[mode],
            },
        }
    }
    public trimText(
        text?: AltParam,
        mode: keyof typeof flow.optionTextTrim = 'Empty Characters'
    ): void {
        const _: flow.TaioFlowTextTrim = {
            type: '@text.trim',
            parameters: {
                text: this._getTaioFlowValFromParam(text),
                mode: flow.optionTextTrim[mode],
            },
        }
        this._addAction(_)
    }
    // ## User Interface
    // public textInput(): void {}
    public selectMenu(
        items: AltParam[],
        multiSelect: boolean = false,
        title: AltParam
    ): void {
        const _: flow.TaioFlowMenu = {
            type: '@ui.menu',
            parameters: {
                prompt: this._getTaioFlowValFromParam(title),
                multiValue: multiSelect,
                lines: this._getTaioFlowValFromParam(
                    Array.isArray(items) ? items.join('\n') : undefined
                ),
            },
        }
        this._addAction(_)
    }
    // public showAlert(): void {}
    // public showConfirmDialog(): void {}
    // public showToast(): void {}
    // public showText(): void {}
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
    public IF(
        condition: TaioFlowCondition,
        conditionScope: (scope: TaioAction) => void
    ): {
        ELSE: (conditionScope: (scope: TaioAction) => void) => void
    } {
        const _scope = new TaioAction(this._stack)
        const _ID = flow.genBID()
        const conditionIf: flow.TaioFlowConditionControl = {
            type: '@flow.if',
            parameters: {
                blockIdentifier: _ID,
                condition: flow.TaioFlowCondition[condition.condition || 0],
                lhs: this._getTaioFlowValFromParam(condition.leftHandSide),
                rhs: this._getTaioFlowValFromParam(condition.rightHandSide),
            },
        }
        this._addAction(conditionIf)
        this._localBlock = {
            BID: _ID,
            type: 'condition',
        }
        conditionScope(_scope)
        for (const item of _scope.flowExport()) {
            this._addAction(item, _ID)
        }
        _scope._pop()
        const conditionElse: flow.TaioFlowConditionControl = {
            type: '@flow.else',
            parameters: {
                blockIdentifier: _ID,
            },
        }
        this._addAction(conditionElse, _ID)
        return {
            ELSE: this.ELSE,
        }
    }
    public ELSE(conditionScope: (scope: TaioAction) => void): void {
        // TODO: check localBlock
        const _scope = new TaioAction(this._stack)
        const _ID = this._localBlock['BID']
        conditionScope(_scope)
        for (const item of _scope.flowExport()) {
            this._addAction(item, _ID)
        }
        _scope._pop()
    }
    public afterDelay(interval: number = 1): void {
        const _: flow.TaioFlowDelay = {
            type: '@flow.delay',
            parameters: {
                interval: interval,
            },
        }
        this._addAction(_)
    }
    public finishRunning(): void {
        const _: flow.TaioFlowFinish = {
            type: '@flow.finish',
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
            name = `{${name}}`
        }
        const v = new FlowVariable(name, this._stack)
        const _: flow.TaioFlowVarSet = {
            type: '@flow.set-variable',
            parameters: {
                name: {
                    value: v.VID,
                },
                value: this._getTaioFlowValFromParam(value),
            },
        }
        this._addAction(_)
        return v
    }
    public getVariable(
        variable: FlowVariable,
        allowUndefined: boolean = true
    ): void {
        const _: flow.TaioFlowVarGet = {
            type: '@flow.get-variable',
            parameters: {
                fallback: allowUndefined ? 0 : 1,
                name: {
                    value: variable.VID,
                },
            },
        }
        this._addAction(_)
    }
    public repeatBlock(
        count: number,
        repeatScope: (scope: TaioAction) => void
    ): void {
        const _scope = new TaioAction(this._stack)
        const _ID = flow.genBID()
        const reapeatHead: flow.TaioFlowRepeat = {
            type: '@flow.repeat-begin',
            parameters: {
                blockIdentifier: _ID,
                count: count,
            },
        }
        this._addAction(reapeatHead)
        this._localBlock = {
            BID: _ID,
            type: 'repeat',
        }
        repeatScope(_scope)
        for (const item of _scope.flowExport()) {
            this._addAction(item, _ID)
        }
        _scope._pop()
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
        const _: flow.TaioFlowJS = {
            type: '@flow.javascript',
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
        const _: flow.TaioFlowRequest = {
            type: '@util.request',
            parameters: {
                url: this._getTaioFlowValFromParam(url),
                method: methodNr,
                body: this._genTaioFlowVal(JSON.stringify(body)),
                headers: this._genTaioFlowVal(JSON.stringify(headers)),
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
    get flowClientMinVersion(): number {
        return this._clientMinVersion
    }
    get flowClientVersion(): number {
        return this._clientVersion
    }
    public flowSpawn(): TaioAction {
        return new TaioAction(this._stack)
    }
    public flowExport(): flow.TaioFlowItem[] {
        return this._actions
    }
    public flowImport(item: flow.TaioFlowItem): void {
        this._actions.push(item)
    }
    public flowParse(): flow.TaioFlowInfo {
        this._localBlockAutoComplete()
        return {
            name: this.name,
            summary: this.summary,
            buildVersion: this._buildVersion,
            clientVersion: this._clientVersion,
            clientMinVersion: this._clientMinVersion,
            icon: {
                glyph: this.iconGlyph,
                color: this.iconColor,
            },
            actions: this._actions,
        }
    }
}
