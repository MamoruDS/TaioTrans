import * as constant from './constant'
import * as utils from './utils'
import * as flow from './flow'
import * as builtInJS from './builtIn'
import * as beautify from 'js-beautify'

export const SESSION_PREFIX =
    (Date.now() * 5).toString(36).toLocaleUpperCase() +
    '-' +
    utils.genRandomStr(4)

class FlowVariable {
    private _VID: string
    constructor(presetID?: string) {
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
}

export class TaioAction {
    private _actions: flow.TaioFlowItem[]
    private _buildVersion: number
    private _clientMinVersion: number
    private _clientVersion: number
    public name: string
    public summary: string
    public iconGlyph: string
    public iconColor: flow.HEX
    private _signedVars: string[]
    constructor(name?: string) {
        this.name = name || 'untitled'
        this.summary = ''
        this.iconGlyph = constant.DEFAULT_ICON
        this.iconColor = constant.DEFAULT_ICON_COLOR
        this._actions = []
        this._buildVersion = constant.BUILD_VERSION
        this._clientMinVersion = constant.CLIENT_MIN_VERSION
        this._clientVersion = constant.CLIENT_VERSION
        this._signedVars = [
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
            // '{([\\w|_|-])+}',
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
                    `@date.style(${style.dateStyle},${style.timeStyle})`
                )
            }
            if (typeof P[0] == 'string') {
                return new FlowVariable(`@date.format(${P[0]})`)
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
                    `@date.style(${style.dateStyle},${style.timeStyle})`
                )
            }
        }
        const preset: {
            [key: string]: FlowVariable
        } = {
            'Last Result': new FlowVariable('@input'),
            Clipboard: new FlowVariable('@clipboard.text'),
            'File Name': new FlowVariable('@editor.file-name'),
            'File Extension': new FlowVariable('@editor.file-extension'),
            'Full Text': new FlowVariable('@editor.full-text'),
            'Selected Text': new FlowVariable('@editor.selection-text'),
            'Selected Location': new FlowVariable('@editor.selection-location'),
            'Selected Length': new FlowVariable('@editor.selection-length'),
        }
        return preset[name]
    }

    private _push(item: flow.TaioFlowItem) {
        this._actions.push(item)
    }
    private _genTaioFlowVal = (value?: string): flow.TaioFlowVal => {
        if (typeof value == 'undefined') {
            return {
                value: '$',
                tokens: [
                    {
                        location: 0,
                        value: '@input',
                    },
                ],
            }
        }
        const re = new RegExp(
            `(${SESSION_PREFIX}-((V-[\\w]{6})|${this._signedVars
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
                VID: match[2],
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
        this._push(_)
    }
    // ## Text
    public createText(
        text: string = this.builtInVars('Last Result').toString()
    ): void {
        const _: flow.TaioFlowText = {
            type: '@text',
            parameters: {
                text: this._genTaioFlowVal(text),
            },
        }
        this._push(_)
    }
    // public textCase(): void {}
    // public encodeText(): void {}
    // public count(): void {}
    // public textInRange(): void {}
    // public textFilter(): void {}
    // public textTokenization(): void {}
    // public findAndReplace(): void {}
    // public trimText(): void {}
    // ## User Interface
    // public textInput(): void {}
    public selectMenu(
        items: (string | FlowVariable)[] = [this.builtInVars('Last Result')],
        multiSelect: boolean = false,
        title: string = ''
    ): void {
        const _: flow.TaioFlowMenu = {
            type: '@ui.menu',
            parameters: {
                prompt: this._genTaioFlowVal(title),
                multiValue: multiSelect,
                line: this._genTaioFlowVal(items.join('\n')),
            },
        }
        this._push(_)
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
    // public if(): void {}
    // public afterDelay(): void {}
    // public finishRunning(): void {}
    public setVariable(
        value: string = this.builtInVars('Last Result').toString()
    ): FlowVariable {
        const v = new FlowVariable()
        const _: flow.TaioFlowVarSet = {
            type: '@flow.set-variable',
            parameters: {
                name: {
                    value: v.VID,
                },
                value: this._genTaioFlowVal(value),
            },
        }
        this._push(_)
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
        this._push(_)
    }
    public repeatBlock(
        count: number,
        repeatScope: (scope: TaioAction) => void
    ): flow.BID {
        const _scope = new TaioAction()
        const _ID = flow.genBID()
        const reapeatHead: flow.TaioFlowRepeat = {
            type: '@flow.repeat-begin',
            parameters: {
                blockIdentifier: _ID,
                count: count,
            },
        }
        this._push(reapeatHead)
        repeatScope(_scope)
        for (const item of _scope.flowExport()) {
            this._push(item)
        }
        const reapeatTail: flow.TaioFlowRepeat = {
            type: '@flow.repeat-end',
            parameters: {
                blockIdentifier: _ID,
            },
        }
        this._push(reapeatTail)
        return _ID
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
        this._push(_)
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
        url: string = this.builtInVars('Last Result').toString(),
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
        headers: {
            [key: string]: string | FlowVariable
        } = {},
        body: {
            [key: string]: string | FlowVariable
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
                url: this._genTaioFlowVal(url),
                method: methodNr,
                body: this._genTaioFlowVal(JSON.stringify(body)),
                headers: this._genTaioFlowVal(JSON.stringify(headers)),
            },
        }
        this._push(_)
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
    public flowExport(): flow.TaioFlowItem[] {
        return this._actions
    }
    public flowParse(): flow.TaioFlowInfo {
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
