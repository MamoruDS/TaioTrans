import * as utils from './utils'

export type HEX = string
export type BID = string

export type PresetVars =
    | 'Last Result'
    | 'Clipboard'
    | 'Current Date'
    | 'File Name'
    | 'File Extension'
    | 'Full Text'
    | 'Selected Text'
    | 'Selected Location'
    | 'Selected Length'
    | 'Tab'
    | 'Carriage Return'
    | 'Line Feed'

export const DATE_STYLE = {
    'No Style': 0,
    'Short Style': 1,
    'Medium Style': 2,
    'Long Style': 3,
    'Full Style': 4,
}
export const TIME_STYLE = {
    'No Style': 0,
    'Short Style': 1,
    'Medium Style': 2,
    'Long Style': 3,
    'Full Style': 4,
}

export const genBID = (): string => {
    return `${utils.genRandomHex(8)}-${utils.genRandomHex(
        4
    )}-${utils.genRandomHex(4)}-${utils.genRandomHex(4)}-${utils.genRandomHex(
        12
    )}`
}

export type TaioFlowInfo = {
    actions: TaioFlowAction[]
    buildVersion: number
    name: string
    clientMinVersion: number
    summary: string
    icon: {
        glyph: string
        color: HEX
    }
    clientVersion: number
}

export type TaioFlowVal = {
    value: string
    tokens?: TaioFlowToken[]
}

type TaioFlowToken = { location: number; value: '@input' | string }

export interface TaioFlowAction {
    type: string
    parameters?: {}
}

export interface TaioFlowActionExt extends TaioFlowAction {
    clientMinVersion: number
}

export const optionGlobalTaioEditorLocation = {
    Device: 0,
    'iCloud Drive': 1,
}
export const optionGlobalTaioFallback = {
    'Return Empty Text': 0,
    'Finish Running': 1,
}
// ## General
// ### Comment
export interface TaioFlowComment extends TaioFlowActionExt {
    type: '@comment'
    parameters: {
        text: TaioFlowVal
    }
}

// ## Text
// ### Create Text
export interface TaioFlowText extends TaioFlowActionExt {
    type: '@text'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Text Case
export interface TaioFlowTextCase extends TaioFlowActionExt {
    type: '@text.case'
    parameters: {
        mode: number // 0 | 1 | 2
        text: TaioFlowVal
    }
}
export const optionTextCase = {
    'Upper Case': 0,
    'Lower Case': 1,
    Capitalize: 2,
}
// ### Encode/Decode Text
export interface TaioFlowTextEncode extends TaioFlowActionExt {
    type: '@text.encode'
    parameters: {
        mode: number
        decode: boolean
        text: TaioFlowVal
        base64Options: number
    }
}
export const optionBase64Mode = {
    'No Line Endings': 0,
    '64 Characters': 1,
    '76 Characters': 2,
}
export const optionTextEncode = {
    'URL Encode': 0,
    'Base64 Encode': 1,
    'HTML Entity Encode': 2,
    'JSON Escape': 3,
    'URI Component Encode': 4,
}
// ### Count
export interface TaioFlowTextCount extends TaioFlowActionExt {
    type: '@text.count'
    parameters: {
        mode: number
        text: TaioFlowVal
    }
}
export const optionTextCount = {
    'By Line': 0,
    'By Word': 1,
    'By Character': 2,
}
// ### Text in Range
export interface TaioFlowTextRange extends TaioFlowActionExt {
    type: '@text.extract-range'
    parameters: {
        text: TaioFlowVal
        location: number
        length: number
    }
}
// ### Text Filter
export interface TaioFlowTextFilter extends TaioFlowActionExt {
    type: '@text.filter'
    parameters: {
        text: TaioFlowVal
        mode: number
        pattern: TaioFlowVal
    }
}
export const optionTextFilter = {
    'Phone Number': 0,
    Link: 1,
    'Email Address': 2,
    Date: 3,
    'Regular Expression': 4,
}
// ### Text Tokenization
export interface TaioFlowTextTokenize extends TaioFlowActionExt {
    type: '@text.tokenize'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Find & Replace
export interface TaioFlowTextReplace extends TaioFlowActionExt {
    type: '@text.replace'
    parameters: {
        text: TaioFlowVal
        replacement: TaioFlowVal
        mode: number
        pattern: TaioFlowVal
    }
}
export const optionTextReplace = {
    'Case Insensitive': 0,
    'Case Sensitive': 1,
    'Regular Expression': 2,
}
// ### Trim Text
export interface TaioFlowTextTrim extends TaioFlowActionExt {
    type: '@text.trim'
    parameters: {
        text: TaioFlowVal
        mode: number
    }
}
export const optionTextTrim = {
    'Empty Characters': 0,
    'Empty Lines': 1,
}

// ## User Interface
// ### Text Input
export interface TaioFlowTextInput extends TaioFlowActionExt {
    type: '@ui.text-input'
    parameters: {
        prompt: TaioFlowVal
        keyboardType: number
        initialText: TaioFlowVal
    }
}
export const optionTextInput = {
    Default: 0,
    ASCII: 1,
    'Number & Punctuation': 2,
    URL: 3,
    'Number Pad': 4,
    'Phone Pad': 5,
    'Name Phone Pad': 6,
    'Email Address': 7,
    'Decimal Pad': 8,
    Twitter: 9,
    'Web Search': 10,
    'ASCII Number Pad': 11,
}
// ### Select from Menu
export interface TaioFlowMenu extends TaioFlowActionExt {
    type: '@ui.menu'
    parameters: {
        prompt: TaioFlowVal
        multiValue: boolean
        lines: TaioFlowVal
    }
}
// ### Show Alert
export type TaioFlowAlertButtons = {
    title: TaioFlowVal
    value: TaioFlowVal
}
export interface TaioFlowAlert extends TaioFlowActionExt {
    type: '@ui.alert'
    parameters: {
        title: TaioFlowVal
        message: TaioFlowVal
        // TODO: Configure Buttons: 0
        actions: [
            TaioFlowAlertButtons,
            TaioFlowAlertButtons,
            TaioFlowAlertButtons,
            TaioFlowAlertButtons
        ]
        showCancelButton: boolean
    }
}
// ### Show Confirm Dialog
export interface TaioFlowDialog extends TaioFlowActionExt {
    type: '@ui.confirm'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Show Toast
export interface TaioFlowToast extends TaioFlowActionExt {
    type: '@ui.toast'
    parameters: {
        title: TaioFlowVal
        style: number
        waitUntilDone: boolean
    }
}
export const optionToastStyle = {
    'Text Only': 0,
    Success: 1,
    Error: 2,
}
// ### Show Text
export interface TaioFlowRender extends TaioFlowActionExt {
    type: '@ui.render-text'
    parameters: {
        text: TaioFlowVal
        title: TaioFlowVal
    }
}
// ### Show HTML
export interface TaioFlowRenderHTML extends TaioFlowActionExt {
    type: '@ui.render-html'
    parameters: {
        html: TaioFlowVal
        title: TaioFlowVal
        showsProgress: boolean
        fullScreen: boolean
        opaque: boolean
    }
}
// ### Compare Diff
export interface TaioFlowRenderDiff extends TaioFlowActionExt {
    type: '@ui.render-diff'
    parameters: {
        lhs: TaioFlowVal
        rhs: TaioFlowVal
    }
}
// ## List
// ### Filter Lines
export interface TaioFlowListFilter extends TaioFlowActionExt {
    type: '@text.filter-lines'
    parameters: {
        text: TaioFlowVal
        mode: number
        pattern: TaioFlowVal
    }
}
export const optionListFilterMatchMode = {
    Contains: 0,
    'Not Contain': 1,
    'Regular Expression': 2,
}
// ### Deduplicate Lines
export interface TaioFlowListDeduplicate extends TaioFlowActionExt {
    type: '@text.dedupe'
    parameters: {
        lines: TaioFlowVal
    }
}
// ### Reverse Text
export interface TaioFlowListReverse extends TaioFlowActionExt {
    type: '@text.reverse'
    parameters: {
        text: TaioFlowVal
        mode: number
    }
}
export const optionListReverseMode = {
    'By Line': 0,
    'By Character': 1,
}
// ### Sort Lines
export interface TaioFlowListSort extends TaioFlowActionExt {
    type: '@text.sort'
    parameters: {
        lines: TaioFlowVal
        mode: number
    }
}
export const optionListSortMode = {
    Ascending: 0,
    Descending: 1,
}
// ### Split Text
export interface TaioFlowListSplit extends TaioFlowActionExt {
    type: '@text.split'
    parameters: {
        text: TaioFlowVal
        separator: TaioFlowVal
        mode: number
    }
}
export const optionListSplitMatchMode = {
    'Matches String': 0,
    'Matches Regex': 1,
}
// ### Merge Text
export interface TaioFlowListMerge extends TaioFlowActionExt {
    type: '@text.join'
    parameters: {
        lines: TaioFlowVal
        joiner: TaioFlowVal
    }
}
// ### Truncate Lines
export interface TaioFlowListTruncate extends TaioFlowActionExt {
    type: '@text.truncate'
    parameters: {
        lines: TaioFlowVal
        length: number
        mode: number
    }
}
export const optionListTruncateMode = {
    Prefix: 0,
    Suffix: 1,
}

// ## Editor
// ### New Document
export interface TaioFlowEditorNew extends TaioFlowActionExt {
    type: '@editor.new'
    parameters: {
        text: TaioFlowVal
        filename: TaioFlowVal
        location: number
        openInEditor: boolean
    }
}
// ### Open Document
export interface TaioFlowEditorOpen extends TaioFlowActionExt {
    type: '@editor.open'
    parameters: {
        filename: TaioFlowVal
        location: number
    }
}
// ### Get File Name
export interface TaioFlowEditorGetFilename extends TaioFlowActionExt {
    type: '@editor.filename'
    parameters: {
        mode: number
        includeExtension: boolean
    }
}
export const optionEditorFileNameStyle = {
    'Name Only': 0,
    'Include Folder': 1,
    'Full Path': 2,
}
// ### Get Text
export interface TaioFlowEditorGetText extends TaioFlowActionExt {
    type: '@editor.get-text'
    parameters: {
        filename: TaioFlowVal
        location: number
        fallback: number
    }
}
// ### Set text
export interface TaioFlowEditorSetText extends TaioFlowActionExt {
    type: '@editor.set-text'
    parameters: {
        text: TaioFlowVal
        filename: TaioFlowVal
        location: number
        createIfNotExists: boolean
    }
}
// ### Smart Select
export interface TaioFlowEditorSmartSelect extends TaioFlowActionExt {
    type: '@editor.smart-select'
    parameters: {
        mode: number
    }
}
export const optionEditorMatchMode = {
    'Closest Word': 0,
    'Closest Sentence': 1,
    'Closest Paragraph': 2,
}
// ### Extend Selection
export const optionEditorSelectionDirection = {
    Backward: 0,
    Forward: 1,
    Both: 2, // default
}
export const optionEditorSelectionUnit = {
    'By Document': 0,
    'By Line': 1, // default
    'By Character': 2,
}
export interface TaioFlowEditorExtendSelection extends TaioFlowActionExt {
    type: '@editor.extend-selection'
    parameters: {
        direction: number
        unit: number
        numberOfChars: number // default: 0
    }
}
// ### Get Selected Text
export interface TaioFlowEditorGetSelectedText extends TaioFlowActionExt {
    type: '@editor.selected-text'
    parameters: {
        fallback: number
    }
}
// ### Move Cursor
export interface TaioFlowEditorMoveCursor extends TaioFlowActionExt {
    type: '@editor.move-cursor'
    parameters: {
        direction: number
        unit: number
        numberOfChars: number // default: 0
    }
}
// ### Replace Selected Text
export interface TaioFlowEditorReplaceSelectedText extends TaioFlowActionExt {
    type: '@editor.replace-selected'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Select Range
export interface TaioFlowEditorSelectRange extends TaioFlowActionExt {
    type: '@editor.select-range'
    parameters: {
        location: number // default: 0
        length: number // default: 1
    }
}

// ## Clips
// ### Insert Clipping
export interface TaioFlowClipInsert extends TaioFlowActionExt {
    type: '@clips.insert'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Delete Clipping
export interface TaioFlowClipDelete extends TaioFlowActionExt {
    type: '@clips.delete'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Replace Clipping
export interface TaioFlowClipReplace extends TaioFlowActionExt {
    type: '@clips.replace'
    parameters: {
        value1: TaioFlowVal //Search
        value2: TaioFlowVal // Replace with
    }
}
// ### Pin Clipping
export interface TaioFlowClipPin extends TaioFlowActionExt {
    type: '@clips.pin'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Get Clipping
export interface TaioFlowClipGet extends TaioFlowActionExt {
    type: '@clips.get-text'
    parameters: {
        mode: number
    }
}
export const optionClipContentType = {
    'Latest Content': 0,
    'All Contents': 1,
}
// ### Set Clipping Text
export interface TaioFlowClipSet extends TaioFlowActionExt {
    type: '@clips.set-text'
    parameters: {
        text: TaioFlowVal
    }
}

// ## Scripting
// ### If
export const TaioFlowCondition = {
    'Equal to': 0,
    'Not Equal to': 1,
    Contains: 2,
    'Not Contain': 3,
    'Begins with': 4,
    'Ends with': 5,
    'Matches Regex': 6,
}
export type TaioFlowElse = () => void
export interface TaioFlowConditionControl extends TaioFlowActionExt {
    type: '@flow.if' | '@flow.else' | '@flow.endif'
    parameters: {
        blockIdentifier: string
        condition?: number
        lhs?: TaioFlowVal
        rhs?: TaioFlowVal
    }
}
// ### After Delay
export interface TaioFlowDelay extends TaioFlowActionExt {
    type: '@flow.delay'
    parameters: {
        interval: number
    }
}
// ### Finish Running
export interface TaioFlowFinish extends TaioFlowActionExt {
    type: '@flow.finish'
}
// ### Set Variable
export interface TaioFlowVarSet extends TaioFlowActionExt {
    type: '@flow.set-variable'
    parameters: {
        value: TaioFlowVal
        name: TaioFlowVal
    }
}
// ### Get Variable
export interface TaioFlowVarGet extends TaioFlowActionExt {
    type: '@flow.get-variable'
    parameters: {
        fallback: number
        name: TaioFlowVal
    }
}
// ### Repeat Block
export interface TaioFlowRepeat extends TaioFlowActionExt {
    type: '@flow.repeat-begin' | '@flow.repeat-end'
    parameters: {
        blockIdentifier: BID
        count?: number
    }
}
// ### For Each
export interface TaioFlowForEach extends TaioFlowActionExt {
    type: '@flow.foreach-begin' | '@flow.foreach-end'
    parameters: {
        blockIdentifier: string
        text?: TaioFlowVal
        mode?: number
        pattern?: TaioFlowVal
        group?: number
        reverse?: boolean
    }
}
export const optionForEachMode = {
    'Each Line': 0,
    'Each Regex Match': 1,
}
// ### Run JavaScript
export interface TaioFlowJS extends TaioFlowActionExt {
    type: '@flow.javascript'
    parameters: {
        script: TaioFlowVal
    }
}

// ## Utilities
// ### Show Dictionary Definition
export interface TaioFlowDict extends TaioFlowActionExt {
    type: '@util.dict'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Get Clipboard
export interface TaioFlowGetClipboard extends TaioFlowActionExt {
    type: '@util.get-clipboard'
    parameters: {}
}
// ### Set Clipboard
export interface TaioFlowSetClipboard extends TaioFlowActionExt {
    type: '@util.set-clipboard'
    parameters: {
        text: TaioFlowVal
        localOnly: boolean
        expireAfter: number
    }
}
// ### Math
export interface TaioFlowMath extends TaioFlowActionExt {
    type: '@util.math'
    parameters: {
        expr: TaioFlowVal
    }
}
// ### Speak Text
export interface TaioFlowSpeech extends TaioFlowActionExt {
    type: '@util.speech'
    parameters: {
        text: TaioFlowVal
        language: TaioFlowVal
        rate: number
        waitUntilDone: boolean
    }
}
// ### Open URL
export interface TaioFlowOpenURL extends TaioFlowActionExt {
    type: '@util.open-url'
    parameters: {
        url: TaioFlowVal
        browser: number
    }
}
export const optionBrowser = {
    'In-app Safari': 0,
    Safari: 1,
}
// ### Web Search
export interface TaioFlowWebSearch extends TaioFlowActionExt {
    type: '@util.web-search'
    parameters: {
        query: TaioFlowVal
    }
}
// ### HTTP Request
export interface TaioFlowRequest extends TaioFlowActionExt {
    type: '@util.request'
    parameters: {
        body: TaioFlowVal
        url: TaioFlowVal
        method: number
        headers: TaioFlowVal
    }
}
export const optionRequestMethod = {
    GET: 0,
    POST: 1,
    PUT: 2,
    PATCH: 3,
    DELETE: 4,
}
// ### Generate UUID
export interface TaioFlowGenerateUUID extends TaioFlowActionExt {
    type: '@util.uuid'
}
// ### Markdown to HTML
export interface TaioFlowMD2HTML extends TaioFlowActionExt {
    type: '@doc.md-html'
    parameters: {
        text: TaioFlowVal
        includeTemplate: boolean
    }
}

// ## Sharing
// ### Share Sheet
export interface TaioFlowShareSheet extends TaioFlowActionExt {
    type: '@share.sheet'
    parameters: {
        text: TaioFlowVal
        mode: number
    }
}
export const optionShareSheet = {
    Text: 0,
    Link: 1,
}
// ### Compose Email
export interface TaioFlowComposeEmail extends TaioFlowActionExt {
    type: '@share.compose-email'
    parameters: {
        recipients: TaioFlowVal
        subject: TaioFlowVal
        body: TaioFlowVal
        isHTML: boolean
    }
}
// ### Compose Text Message
export interface TaioFlowComposeTextMessage extends TaioFlowActionExt {
    type: '@share.compose-message'
    parameters: {
        recipients: TaioFlowVal
        body: TaioFlowVal
    }
}

import { AltParam } from './action'

export type JSFunc = () => void

export interface Actions {
    comment(text?: string): void
    createText(input?: AltParam): void
    textCase(text?: AltParam, convertTo?: keyof typeof optionTextCase): void
    encodeDecodeText(
        text?: AltParam,
        encodeMode?: keyof typeof optionTextEncode,
        base64Options?: keyof typeof optionBase64Mode,
        decode?: boolean
    ): void
    count(text?: AltParam, countMode?: keyof typeof optionTextCount): void
    textInRange(text?: AltParam, location?: number, length?: number): void
    textFilter(
        text?: AltParam,
        matchMode?: keyof typeof optionTextFilter,
        pattern?: AltParam
    ): void
    textTokenization(input?: AltParam): void
    findAndReplace(
        text?: AltParam,
        search?: AltParam,
        replaceWith?: AltParam,
        matchMode?: keyof typeof optionTextReplace
    ): void
    trimText(text?: AltParam, trimmingMode?: keyof typeof optionTextTrim): void
    textInput(
        prompt?: AltParam,
        initialText?: AltParam,
        keyboardType?: keyof typeof optionTextInput
    ): void
    selectFromMenu(
        options?: AltParam,
        prompt?: AltParam,
        multipleValue?: boolean
    ): void
    showAlert(
        title?: AltParam,
        message?: AltParam,
        configureButtons?: [
            TaioFlowAlertButtons,
            TaioFlowAlertButtons,
            TaioFlowAlertButtons,
            TaioFlowAlertButtons
        ],
        showCancelButton?: boolean
    ): void
    showConfirmDialog(input?: AltParam): void
    showToast(
        title?: AltParam,
        toastStyle?: keyof typeof optionToastStyle,
        waitUntilDone?: boolean
    ): void
    showText(input?: AltParam, title?: AltParam): void
    showHTML(
        code?: AltParam,
        title?: AltParam,
        showsProgress?: boolean,
        fullScreen?: boolean,
        opaqueBackground?: boolean
    ): void
    compareDiff(text1?: AltParam, text2?: AltParam): void
    filterLines(
        text?: AltParam,
        matchMode?: keyof typeof optionListFilterMatchMode,
        pattern?: AltParam
    ): void
    deduplicateLines(input?: AltParam): void
    reverseText(
        text?: AltParam,
        revertMode?: keyof typeof optionListReverseMode
    ): void
    sortLines(
        lines?: AltParam,
        sortMode?: keyof typeof optionListSortMode
    ): void
    splitText(
        text?: AltParam,
        separator?: AltParam,
        matchMode?: keyof typeof optionListSplitMatchMode
    ): void
    mergeText(lines?: AltParam, jointer?: AltParam): void
    truncateLines(
        lines?: AltParam,
        length?: number,
        truncateMode?: keyof typeof optionListTruncateMode
    ): void
    newDocument(
        text?: AltParam,
        fileName?: AltParam,
        location?: keyof typeof optionGlobalTaioEditorLocation,
        openInEditor?: boolean
    ): void
    openDocument(
        fileName?: AltParam,
        location?: keyof typeof optionGlobalTaioEditorLocation
    ): void
    getFileName(
        style?: keyof typeof optionEditorFileNameStyle,
        includeExtension?: boolean
    ): void
    getText(
        fileName?: AltParam,
        location?: keyof typeof optionGlobalTaioEditorLocation,
        whenNotExists?: keyof typeof optionGlobalTaioFallback
    ): void
    setText(
        text?: AltParam,
        fileName?: AltParam,
        location?: keyof typeof optionGlobalTaioEditorLocation,
        createIfNotExists?: boolean
    ): void
    smartSelect(matchMode?: keyof typeof optionEditorMatchMode): void
    extendSelection(
        selectionDirection?: keyof typeof optionEditorSelectionDirection,
        selectionUnit?: keyof typeof optionEditorSelectionUnit,
        numberOfCharacters?: number
    ): void
    getSelectedText(whenNotExists?: keyof typeof optionGlobalTaioFallback): void
    moveCursor(
        selectionDirection?: keyof typeof optionEditorSelectionDirection,
        selectionUnit?: keyof typeof optionEditorSelectionUnit,
        numberOfCharacters?: number
    ): void
    replaceSelectedText(input?: AltParam): void
    selectRange(location?: number, length?: number): void
    insertClipping(input?: AltParam): void
    deleteClipping(input?: AltParam): void
    replaceClipping(search?: AltParam, replaceWith?: AltParam): void
    pinClipping(input?: AltParam): void
    getClipping(contentType?: keyof typeof optionClipContentType): void
    setClippingText(input?: AltParam): void
    If(
        condition: {
            leftHandSide?: AltParam
            rightHandSide?: AltParam
            condition?: keyof typeof TaioFlowCondition
        },
        scope: () => void
    ): any
    afterDelay(delayInterval?: number): void
    finishRunning(): void
    setVariable(name?: AltParam, value?: AltParam): any
    getVariable(
        name?: AltParam,
        whenNotExists?: keyof typeof optionGlobalTaioFallback
    ): void
    repeatBlock(repeatTimes: number, scope: () => void): void
    forEach(
        text: AltParam,
        scope: () => void,
        forEachMode?: keyof typeof optionForEachMode,
        pattern?: AltParam,
        matchGroup?: number,
        reverse?: boolean
    ): void
    runJavaScript(code: string | JSFunc): void
    showDictionaryDefinition(input?: AltParam): void
    getClipboard(): void
    setClipboard(
        text?: AltParam,
        localOnly?: boolean,
        expireAfterSeconds?: number
    ): void
    math(input?: AltParam): void
    speakText(
        text?: AltParam,
        language?: AltParam,
        rate?: number,
        waitUntilDone?: boolean
    ): void
    openURL(url?: AltParam, browser?: keyof typeof optionBrowser): void
    webSearch(input?: AltParam): void
    httpRequest(
        url?: AltParam,
        method?: keyof typeof optionRequestMethod,
        headers?: AltParam,
        body?: AltParam
    ): void
    markdownToHTML(input?: AltParam, includeTemplate?: boolean): void
    shareSheet(text?: AltParam, shareAs?: keyof typeof optionShareSheet): void
    composeEmail(
        recipients?: AltParam,
        subject?: AltParam,
        messageBody?: AltParam,
        isHTML?: boolean
    ): void
    composeTextMessage(recipients?: AltParam, messageBody?: AltParam): void
}
