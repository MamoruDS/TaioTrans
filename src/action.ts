import { EventEmitter } from 'events'

import * as beautify from 'js-beautify'

import * as constant from './constant'
import * as utils from './utils'
import * as Taio from './taio'
import { options as OPT } from './main'

export const SESSION_PREFIX =
    (Date.now() * 5).toString(36).toLocaleUpperCase() +
    '-' +
    utils.genRandomStr(4)

export type AltParam = string | object | boolean | FlowVariable

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
    if (!(param instanceof FlowVariable)) {
        if (typeof param == 'object' && param != null) {
            if (Array.isArray(param)) {
                param = param
                    .map((i) => {
                        return JSON.stringify(i)
                    })
                    .join('\n')
            } else {
                param = JSON.stringify(param, null, OPT.indentLength)
            }
        } else if (typeof param == 'string') {
            //
        } else {
            param = JSON.stringify(param) || new FlowVariable('@input')
        }
    }
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

export class FlowVariable {
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
        this._action.setVariable(this._VID, value)
    }
}

type TaioFlowCondition = {
    leftHandSide: AltParam
    rightHandSide: AltParam
    condition: keyof typeof Taio.TaioFlowCondition
}

type TaioFlowScopeType = 'root' | 'condition' | 'repeat' | 'forEach'

export class TaioAction implements Taio.Actions {
    private _actions: Taio.TaioFlowActionExt[]
    private _buildVersion: number
    private _clientVersion: number
    private _scopes?: {
        BID: string
        type: TaioFlowScopeType
    }[]
    private _verifyBID: string[]
    private _name: string
    private _summary: string
    private _iconGlyph: string
    private _iconColor: Taio.HEX

    constructor() {
        this._actions = []
        this._name = 'untitled'
        this._summary = ''
        this._iconGlyph = OPT.defaultIcon
        this._iconColor = OPT.defaultIconColor
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

    get name(): string {
        return this._name
    }
    set name(input: string) {
        this._name = input
    }
    get summary(): string {
        return this._summary
    }
    set summary(input: string) {
        this._summary = input
    }
    get icon(): string {
        return this._iconGlyph
    }
    set icon(input: string) {
        this._iconGlyph = input
    }
    get iconColor(): string {
        return this._iconColor
    }
    set iconColor(input: string) {
        this._iconColor = input
    }

    public builtInVars(name: string, ...P: any[]): FlowVariable {
        if (name == 'Current Date') {
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
        this.appendItem(_)
        return
    }
    // ## Text
    public createText(input?: AltParam): void {
        const _: Taio.TaioFlowText = {
            type: '@text',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public textCase(
        text?: AltParam,
        convertTo: keyof typeof Taio.optionTextCase = 'Upper Case'
    ): void {
        const _: Taio.TaioFlowTextCase = {
            type: '@text.case',
            clientMinVersion: 1,
            parameters: {
                mode: Taio.optionTextCase[convertTo],
                text: getTaioFlowValFromParam(text),
            },
        }
        this.appendItem(_)
        return
    }
    public encodeDecodeText(
        text?: AltParam,
        encodeMode: keyof typeof Taio.optionTextEncode = 'URL Encode',
        decode: boolean = false
    ): void {
        const _: Taio.TaioFlowTextEncode = {
            type: '@text.encode',
            clientMinVersion: 84,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionTextEncode[encodeMode],
                decode,
            },
        }
        this.appendItem(_)
        return
    }
    public count(
        text?: AltParam,
        countMode: keyof typeof Taio.optionTextCount = 'By Line'
    ): void {
        const _: Taio.TaioFlowTextCount = {
            type: '@text.count',
            clientMinVersion: 1,
            parameters: {
                mode: Taio.optionTextCount[countMode],
                text: getTaioFlowValFromParam(text),
            },
        }
        this.appendItem(_)
        return
    }
    public textInRange(
        text?: AltParam,
        location: number = 0,
        length: number = 1
    ): void {
        const _: Taio.TaioFlowTextRange = {
            type: '@text.extract-range',
            clientMinVersion: 1,
            parameters: {
                location,
                length,
                text: getTaioFlowValFromParam(text),
            },
        }
        this.appendItem(_)
        return
    }
    public textFilter(
        text?: AltParam,
        matchMode: keyof typeof Taio.optionTextFilter = 'Phone Number',
        pattern: AltParam = ''
    ): void {
        const _: Taio.TaioFlowTextFilter = {
            type: '@text.filter',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionTextFilter[matchMode],
                pattern: getTaioFlowValFromParam(pattern),
            },
        }
        this.appendItem(_)
        return
    }
    public textTokenization(input?: AltParam): void {
        const _: Taio.TaioFlowTextTokenize = {
            type: '@text.tokenize',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public findAndReplace(
        text?: AltParam,
        search: AltParam = '',
        replaceWith: AltParam = '',
        matchMode: keyof typeof Taio.optionTextReplace = 'Case Insensitive'
    ): void {
        const _: Taio.TaioFlowTextReplace = {
            type: '@text.replace',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                pattern: getTaioFlowValFromParam(search),
                replacement: getTaioFlowValFromParam(replaceWith),
                mode: Taio.optionTextReplace[matchMode],
            },
        }
        this.appendItem(_)
        return
    }
    public trimText(
        text?: AltParam,
        trimmingMode: keyof typeof Taio.optionTextTrim = 'Empty Characters'
    ): void {
        const _: Taio.TaioFlowTextTrim = {
            type: '@text.trim',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionTextTrim[trimmingMode],
            },
        }
        this.appendItem(_)
        return
    }
    // ## User Interface
    public textInput(
        prompt: AltParam = '',
        initialText: AltParam = '',
        keyboardType: keyof typeof Taio.optionTextInput = 'Default'
    ): void {
        const _: Taio.TaioFlowTextInput = {
            type: '@ui.text-input',
            clientMinVersion: 1,
            parameters: {
                prompt: getTaioFlowValFromParam(prompt),
                initialText: getTaioFlowValFromParam(initialText),
                keyboardType: Taio.optionTextInput[keyboardType],
            },
        }
        this.appendItem(_)
        return
    }
    public selectFromMenu(
        items?: AltParam,
        title: AltParam = '',
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
        this.appendItem(_)
        return
    }
    public showAlert(
        title?: AltParam,
        message: AltParam = '',
        configureButtons: {
            title: AltParam
            value: AltParam
        }[] = [
            {
                title: '',
                value: '0',
            },
            {
                title: '',
                value: '1',
            },
            {
                title: '',
                value: '2',
            },
            {
                title: '',
                value: '3',
            },
        ],
        showCancelButton: boolean = true
    ): void {
        if (configureButtons.length > 4) {
            // TODO: Err
        }
        while (configureButtons.length < 4) {
            configureButtons.push({
                title: '',
                value: configureButtons.length.toString(),
            })
        }
        const _: Taio.TaioFlowAlert = {
            type: '@ui.alert',
            clientMinVersion: 1,
            parameters: {
                title: getTaioFlowValFromParam(title),
                message: getTaioFlowValFromParam(message),
                actions: configureButtons.map((btn) => {
                    return {
                        title: getTaioFlowValFromParam(btn['title']),
                        value: getTaioFlowValFromParam(btn['value']),
                    }
                }) as [
                    Taio.TaioFlowAlertButtons,
                    Taio.TaioFlowAlertButtons,
                    Taio.TaioFlowAlertButtons,
                    Taio.TaioFlowAlertButtons
                ],
                showCancelButton,
            },
        }
        this.appendItem(_)
        return
    }
    public showConfirmDialog(input?: AltParam): void {
        const _: Taio.TaioFlowDialog = {
            type: '@ui.confirm',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public showToast(
        title?: AltParam,
        toastStyle: keyof typeof Taio.optionToastStyle = 'Text Only',
        waitUntilDone: boolean = false
    ): void {
        const _: Taio.TaioFlowToast = {
            type: '@ui.toast',
            clientMinVersion: 1,
            parameters: {
                title: getTaioFlowValFromParam(title),
                style: Taio.optionToastStyle[toastStyle],
                waitUntilDone,
            },
        }
        this.appendItem(_)
        return
    }
    public showText(input?: AltParam, title: AltParam = ''): void {
        const _: Taio.TaioFlowRender = {
            type: '@ui.render-text',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
                title: getTaioFlowValFromParam(title),
            },
        }
        this.appendItem(_)
        return
    }
    public showHTML(
        code: AltParam = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";'>\n  ${this.builtInVars(
            'Last Result'
        )}\n</body>\n</html>`,
        title: AltParam = '',
        showsProgress: boolean = false,
        opaqueBackground: boolean = true
    ): void {
        const _: Taio.TaioFlowRenderHTML = {
            type: '@ui.render-html',
            clientMinVersion: 1,
            parameters: {
                html: getTaioFlowValFromParam(code),
                title: getTaioFlowValFromParam(title),
                showProgress: showsProgress,
                opaque: opaqueBackground,
            },
        }
        this.appendItem(_)
        return
    }
    public compareDiff(text1: AltParam = '', text2?: AltParam): void {
        const _: Taio.TaioFlowRenderDiff = {
            type: '@ui.render-diff',
            clientMinVersion: 1,
            parameters: {
                lhs: getTaioFlowValFromParam(text1),
                rhs: getTaioFlowValFromParam(text2),
            },
        }
        this.appendItem(_)
        return
    }
    // ## List
    public filterLines(
        text?: AltParam,
        matchMode: keyof typeof Taio.optionListFilterMatchMode = 'Contains',
        pattern: AltParam = ''
    ): void {
        const _: Taio.TaioFlowListFilter = {
            type: '@text.filter-lines',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionListFilterMatchMode[matchMode],
                pattern: getTaioFlowValFromParam(pattern),
            },
        }
        this.appendItem(_)
        return
    }
    public deduplicateLines(input?: AltParam): void {
        const _: Taio.TaioFlowListDeduplicate = {
            type: '@text.dedupe',
            clientMinVersion: 1,
            parameters: {
                lines: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public reverseText(
        text?: AltParam,
        revertMode: keyof typeof Taio.optionListReverseMode = 'By Line'
    ): void {
        const _: Taio.TaioFlowListReverse = {
            type: '@text.reverse',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionListReverseMode[revertMode],
            },
        }
        this.appendItem(_)
        return
    }
    public sortLines(
        lines?: AltParam,
        sortMode: keyof typeof Taio.optionListSortMode = 'Ascending'
    ): void {
        const _: Taio.TaioFlowListSort = {
            type: '@text.sort',
            clientMinVersion: 1,
            parameters: {
                lines: getTaioFlowValFromParam(lines),
                mode: Taio.optionListSortMode[sortMode],
            },
        }
        this.appendItem(_)
        return
    }
    public splitText(text?: AltParam, separator: AltParam = ''): void {
        const _: Taio.TaioFlowListSplit = {
            type: '@text.split',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                separator: getTaioFlowValFromParam(separator),
            },
        }
        this.appendItem(_)
        return
    }

    public mergeText(lines?: AltParam, jointer: AltParam = ''): void {
        const _: Taio.TaioFlowListMerge = {
            type: '@text.join',
            clientMinVersion: 1,
            parameters: {
                lines: getTaioFlowValFromParam(lines),
                joiner: getTaioFlowValFromParam(jointer),
            },
        }
        this.appendItem(_)
        return
    }
    public truncateLines(
        lines?: AltParam,
        length: number = 1,
        truncateMode: keyof typeof Taio.optionListTruncateMode = 'Prefix'
    ): void {
        const _: Taio.TaioFlowListTruncate = {
            type: '@text.truncate',
            clientMinVersion: 1,
            parameters: {
                lines: getTaioFlowValFromParam(lines),
                length,
                mode: Taio.optionListTruncateMode[truncateMode],
            },
        }
        this.appendItem(_)
        return
    }
    // ## Editor
    public newDocument(
        text?: AltParam,
        fileName: AltParam = this.builtInVars('File Name'),
        location: keyof typeof Taio.optionGlobalTaioEditorLocation = 'Device',
        openInEditor: boolean = false
    ): void {
        const _: Taio.TaioFlowEditorNew = {
            type: '@editor.new',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                filename: getTaioFlowValFromParam(fileName),
                location: Taio.optionGlobalTaioEditorLocation[location],
                openInEditor,
            },
        }
        this.appendItem(_)
        return
    }
    public openDocument(
        fileName: AltParam = this.builtInVars('File Name'),
        location: keyof typeof Taio.optionGlobalTaioEditorLocation = 'Device'
    ): void {
        const _: Taio.TaioFlowEditorOpen = {
            type: '@editor.open',
            clientMinVersion: 1,
            parameters: {
                filename: getTaioFlowValFromParam(fileName),
                location: Taio.optionGlobalTaioEditorLocation[location],
            },
        }
        this.appendItem(_)
        return
    }
    public getFileName(
        style: keyof typeof Taio.optionEditorFileNameStyle = 'Include Folder',
        includeExtension: boolean = true
    ): void {
        const _: Taio.TaioFlowEditorGetFilename = {
            type: '@editor.filename',
            clientMinVersion: 52,
            parameters: {
                mode: Taio.optionEditorFileNameStyle[style],
                includeExtension,
            },
        }
        this.appendItem(_)
        return
    }
    public getText(
        fileName: AltParam = this.builtInVars('File Name'),
        location: keyof typeof Taio.optionGlobalTaioEditorLocation = 'Device',
        whenNotExists: keyof typeof Taio.optionGlobalTaioFallback = 'Return Empty Text'
    ): void {
        const _: Taio.TaioFlowEditorGetText = {
            type: '@editor.get-text',
            clientMinVersion: 1,
            parameters: {
                filename: getTaioFlowValFromParam(fileName),
                location: Taio.optionGlobalTaioEditorLocation[location],
                fallback: Taio.optionGlobalTaioFallback[whenNotExists],
            },
        }
        this.appendItem(_)
        return
    }
    public setText(
        text?: AltParam,
        fileName: AltParam = this.builtInVars('File Name'),
        location: keyof typeof Taio.optionGlobalTaioEditorLocation = 'Device',
        createIfNotExists?: boolean
    ): void {
        const _: Taio.TaioFlowEditorSetText = {
            type: '@editor.set-text',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                filename: getTaioFlowValFromParam(fileName),
                location: Taio.optionGlobalTaioEditorLocation[location],
                createIfNotExists,
            },
        }
        this.appendItem(_)
        return
    }
    public smartSelect(
        matchMode: keyof typeof Taio.optionEditorMatchMode
    ): void {
        const _: Taio.TaioFlowEditorSmartSelect = {
            type: '@editor.smart-select',
            clientMinVersion: 42,
            parameters: {
                mode: Taio.optionEditorMatchMode[matchMode],
            },
        }
        this.appendItem(_)
        return
    }
    public extendSelection(
        selectionDirection: keyof typeof Taio.optionEditorSelectionDirection = 'Both',
        selectionUnit: keyof typeof Taio.optionEditorSelectionUnit = 'By Line',
        numberOfCharacters?: number
    ): void {
        const _: Taio.TaioFlowEditorExtendSelection = {
            type: '@editor.extend-selection',
            clientMinVersion: 1,
            parameters: {
                direction:
                    Taio.optionEditorSelectionDirection[selectionDirection],
                unit: Taio.optionEditorSelectionUnit[selectionUnit],
                numberOfChars: numberOfCharacters,
            },
        }
        this.appendItem(_)
        return
    }
    public getSelectedText(
        whenNotExists: keyof typeof Taio.optionGlobalTaioFallback = 'Return Empty Text'
    ): void {
        const _: Taio.TaioFlowEditorGetSelectedText = {
            type: '@editor.selected-text',
            clientMinVersion: 1,
            parameters: {
                fallback: Taio.optionGlobalTaioFallback[whenNotExists],
            },
        }
        this.appendItem(_)
        return
    }
    public moveCursor(
        selectionDirection: keyof typeof Taio.optionEditorSelectionDirection = 'Both',
        selectionUnit: keyof typeof Taio.optionEditorSelectionUnit = 'By Line',
        numberOfCharacters: number = 0
    ): void {
        const _: Taio.TaioFlowEditorMoveCursor = {
            type: '@editor.move-cursor',
            clientMinVersion: 1,
            parameters: {
                direction:
                    Taio.optionEditorSelectionDirection[selectionDirection],
                unit: Taio.optionEditorSelectionUnit[selectionUnit],
                numberOfChars: numberOfCharacters,
            },
        }
        this.appendItem(_)
        return
    }
    public replaceSelectedText(input?: AltParam): void {
        const _: Taio.TaioFlowEditorReplaceSelectedText = {
            type: '@editor.replace-selected',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public selectRange(location: number = 0, length: number = 1): void {
        const _: Taio.TaioFlowEditorSelectRange = {
            type: '@editor.select-range',
            clientMinVersion: 1,
            parameters: {
                location,
                length,
            },
        }
        this.appendItem(_)
        return
    }
    // ## Clips
    public insertClipping(input?: AltParam): void {
        const _: Taio.TaioFlowClipInsert = {
            type: '@clips.insert',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public deleteClipping(input?: AltParam): void {
        const _: Taio.TaioFlowClipDelete = {
            type: '@clips.delete',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public replaceClipping(
        search?: AltParam,
        replaceWith: AltParam = ''
    ): void {
        const _: Taio.TaioFlowClipReplace = {
            type: '@clips.replace',
            clientMinVersion: 1,
            parameters: {
                value1: getTaioFlowValFromParam(search),
                value2: getTaioFlowValFromParam(replaceWith),
            },
        }
        this.appendItem(_)
        return
    }
    public pinClipping(input?: AltParam): void {
        const _: Taio.TaioFlowClipPin = {
            type: '@clips.pin',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public getClipping(
        contentType: keyof typeof Taio.optionClipContentType = 'Latest Content'
    ): void {
        const _: Taio.TaioFlowClipGet = {
            type: '@clips.get-text',
            clientMinVersion: 1,
            parameters: {
                mode: Taio.optionClipContentType[contentType],
            },
        }
        this.appendItem(_)
        return
    }
    public setClippingText(input?: AltParam): void {
        const _: Taio.TaioFlowClipSet = {
            type: '@clips.set-text',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    // ## Scripting
    public If(condition: TaioFlowCondition, scope: () => void): TaioFlowIf {
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
                interval,
            },
        }
        this.appendItem(_)
        return
    }
    public finishRunning(): void {
        const _: Taio.TaioFlowFinish = {
            type: '@flow.finish',
            clientMinVersion: 1,
        }
        this.appendItem(_)
        return
    }
    public setVariable(name: string = '', value?: AltParam): FlowVariable {
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
        this.appendItem(_)
        return v
    }
    public getVariable(
        name?: AltParam,
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
        this.appendItem(_)
        return
    }
    public repeatBlock(count: number = 1, scope: () => void): void {
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
            scope()
        })
        return
    }
    public forEach(
        text: AltParam,
        scope: () => void,
        forEachMode: keyof typeof Taio.optionForEachMode = 'Each Line',
        pattern: AltParam = '',
        matchGroup: number = 0,
        reverse: boolean = false
    ): void {
        this.spawnChildScope('forEach', (BID) => {
            const forEachHead: Taio.TaioFlowForEach = {
                type: '@flow.foreach-begin',
                clientMinVersion: 1,
                parameters: {
                    blockIdentifier: BID,
                    text: getTaioFlowValFromParam(text),
                    mode: Taio.optionForEachMode[forEachMode],
                    pattern: getTaioFlowValFromParam(pattern),
                    group: matchGroup,
                    reverse,
                },
            }
            this.appendItem(forEachHead)
            scope()
        })
        return
    }
    public runJavaScript(code: string | Taio.JSFunc): void {
        if (typeof code == 'function') {
            const indentLen = OPT.indentLength
            const lines: string[] = beautify('' + code, {
                indent_size: indentLen,
            })
                .split('\n')
                .slice(1, -1)
            for (const _i in lines) {
                lines[_i] = lines[_i].slice(indentLen)
            }
            code = lines.join('\n')
        }

        const _: Taio.TaioFlowJS = {
            type: '@flow.javascript',
            clientMinVersion: 1,
            parameters: {
                script: {
                    value: code,
                },
            },
        }
        this.appendItem(_)
    }
    // ## Utilities
    public showDictionaryDefinition(input?: AltParam): void {
        const _: Taio.TaioFlowDict = {
            type: '@util.dict',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public getClipboard(): void {
        const _: Taio.TaioFlowGetClipboard = {
            type: '@util.get-clipboard',
            clientMinVersion: 1,
            parameters: {},
        }
        this.appendItem(_)
        return
    }
    public setClipboard(
        text?: AltParam,
        localOnly: boolean = false,
        expireAfterSeconds: number = 0
    ): void {
        const _: Taio.TaioFlowSetClipboard = {
            type: '@util.set-clipboard',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                localOnly,
                expireAfter: expireAfterSeconds,
            },
        }
        this.appendItem(_)
        return
    }
    public math(input: AltParam = 'sin(PI * 0.5)'): void {
        const _: Taio.TaioFlowMath = {
            type: '@util.math',
            clientMinVersion: 1,
            parameters: {
                expr: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public speakText(
        text?: AltParam,
        language: AltParam = '',
        rate: number = 0.5,
        waitUntilDone: boolean = true
    ): void {
        const _: Taio.TaioFlowSpeech = {
            type: '@util.speech',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                language: getTaioFlowValFromParam(language),
                rate,
                waitUntilDone,
            },
        }
        this.appendItem(_)
        return
    }
    public openURL(
        url?: AltParam,
        browser: keyof typeof Taio.optionBrowser = 'In-app Safari'
    ): void {
        const _: Taio.TaioFlowOpenURL = {
            type: '@util.open-url',
            clientMinVersion: 1,
            parameters: {
                url: getTaioFlowValFromParam(url),
                browser: Taio.optionBrowser[browser],
            },
        }
        this.appendItem(_)
        return
    }
    public webSearch(input?: AltParam): void {
        const _: Taio.TaioFlowWebSearch = {
            type: '@util.web-search',
            clientMinVersion: 1,
            parameters: {
                query: getTaioFlowValFromParam(input),
            },
        }
        this.appendItem(_)
        return
    }
    public httpRequest(
        url?: AltParam,
        method: keyof typeof Taio.optionRequestMethod = 'GET',
        headers: AltParam = {
            'Content-Type': 'application/json',
        },
        body: AltParam = ''
    ): void {
        const _: Taio.TaioFlowRequest = {
            type: '@util.request',
            clientMinVersion: 1,
            parameters: {
                url: getTaioFlowValFromParam(url),
                method: Taio.optionRequestMethod[method],
                body: getTaioFlowValFromParam(body),
                headers: getTaioFlowValFromParam(headers),
            },
        }
        this.appendItem(_)
        return
    }
    public markdownToHTML(
        input?: AltParam,
        includeTemplate: boolean = false
    ): void {
        const _: Taio.TaioFlowMD2HTML = {
            type: '@doc.md-html',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(input),
                includeTemplate,
            },
        }
        this.appendItem(_)
        return
    }
    // ## Sharing
    public shareSheet(
        text?: AltParam,
        shareAs: keyof typeof Taio.optionShareSheet = 'Text'
    ): void {
        const _: Taio.TaioFlowShareSheet = {
            type: '@share.sheet',
            clientMinVersion: 1,
            parameters: {
                text: getTaioFlowValFromParam(text),
                mode: Taio.optionShareSheet[shareAs],
            },
        }
        this.appendItem(_)
        return
    }
    public composeEmail(
        recipients: AltParam = '',
        subject: AltParam = '',
        messageBody?: AltParam,
        isHTML: boolean = false
    ): void {
        const _: Taio.TaioFlowComposeEmail = {
            type: '@share.compose-email',
            clientMinVersion: 1,
            parameters: {
                recipients: getTaioFlowValFromParam(recipients),
                subject: getTaioFlowValFromParam(subject),
                body: getTaioFlowValFromParam(messageBody),
                isHTML,
            },
        }
        this.appendItem(_)
        return
    }
    public composeTextMessage(
        recipients: AltParam = '',
        messageBody?: AltParam
    ): void {
        const _: Taio.TaioFlowComposeTextMessage = {
            type: '@share.compose-message',
            clientMinVersion: 1,
            parameters: {
                recipients: getTaioFlowValFromParam(recipients),
                body: getTaioFlowValFromParam(messageBody),
            },
        }
        this.appendItem(_)
        return
    }

    //

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
                        type: '@flow.root',
                        clientMinVersion: 0,
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
                        type: '@flow.repeat-end',
                        clientMinVersion: 1,
                        parameters: {
                            blockIdentifier: curScope['BID'],
                        },
                    } as Taio.TaioFlowRepeat
                    break
                }
                case 'forEach': {
                    item = {
                        type: '@flow.foreach-end',
                        clientMinVersion: 1,
                        parameters: {
                            blockIdentifier: curScope['BID'],
                        },
                    } as Taio.TaioFlowForEach
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
    public export(): Taio.TaioFlowInfo {
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
            name: this._name,
            summary: this._summary,
            buildVersion: this._buildVersion,
            clientVersion: this._clientVersion,
            clientMinVersion: clientMinVersion,
            icon: {
                glyph: this._iconGlyph,
                color: this._iconColor,
            },
            actions: actions,
        }
    }
}

export class TaioFlowIf {
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
