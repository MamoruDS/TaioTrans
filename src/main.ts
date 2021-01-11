import {
    TaioAction as _TaioAction,
    AltParam,
    FlowVariable,
    TaioFlowIf,
} from './action'
import * as Taio from './taio'

class TaioAction implements Taio.Actions {
    private _action: _TaioAction

    constructor(
        info: {
            name?: string
            summary?: string
            icon?: string
            iconColor?: string
        } = {}
    ) {
        this._action = new _TaioAction()
        Object.keys(info).forEach((key) => {
            this._action[key] = info[key]
        })
    }

    builtIn(
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
    builtIn(
        name: 'Current Date',
        style: {
            dateStyle?: keyof typeof Taio.DATE_STYLE
            timeStyle?: keyof typeof Taio.TIME_STYLE
        }
    ): FlowVariable
    builtIn(name: 'Current Date', customFormat?: string): FlowVariable
    builtIn(name: string, ...P: any[]): FlowVariable {
        return this._action.builtInVars(name, ...P)
    }

    comment(text?: string): void {
        this._action.comment(text)
    }
    createText(input?: AltParam): void {
        this._action.createText(input)
    }
    textCase(
        text?: AltParam,
        convertTo?: keyof typeof Taio.optionTextCase
    ): void {
        this._action.textCase(text, convertTo)
    }
    encodeDecodeText(
        text?: AltParam,
        encodeMode?: keyof typeof Taio.optionTextEncode,
        base64Options?: keyof typeof Taio.optionBase64Mode,
        decode?: boolean
    ): void {
        this._action.encodeDecodeText(text, encodeMode, base64Options, decode)
    }
    count(
        text?: AltParam,
        countMode?: keyof typeof Taio.optionTextCount
    ): void {
        this._action.count(text, countMode)
    }
    textInRange(text?: AltParam, location?: number, length?: number): void {
        this._action.textInRange(text, location, length)
    }
    textFilter(
        text?: AltParam,
        matchMode?: keyof typeof Taio.optionTextFilter,
        pattern?: AltParam
    ): void {
        this._action.textFilter(text, matchMode, pattern)
    }
    textTokenization(input?: AltParam): void {
        this._action.textTokenization(input)
    }
    findAndReplace(
        text?: AltParam,
        search?: AltParam,
        replaceWith?: AltParam,
        matchMode?: keyof typeof Taio.optionTextReplace
    ): void {
        this._action.findAndReplace(text, search, replaceWith, matchMode)
    }
    trimText(
        text?: AltParam,
        trimmingMode?: keyof typeof Taio.optionTextTrim
    ): void {
        this._action.trimText(text, trimmingMode)
    }
    textInput(
        prompt?: AltParam,
        initialText?: AltParam,
        keyboardType?: keyof typeof Taio.optionTextInput
    ): void {
        this._action.textInput(prompt, initialText, keyboardType)
    }
    selectFromMenu(
        options?: AltParam,
        prompt?: AltParam,
        multipleValue?: boolean
    ): void {
        this._action.selectFromMenu(options, prompt, multipleValue)
    }
    showAlert(
        title?: AltParam,
        message?: AltParam,
        configureButtons?: {
            title: AltParam
            value: AltParam
        }[],
        showCancelButton?: boolean
    ): void {
        this._action.showAlert(
            title,
            message,
            configureButtons,
            showCancelButton
        )
    }
    showConfirmDialog(input?: AltParam): void {
        this._action.showConfirmDialog(input)
    }
    showToast(
        title?: AltParam,
        toastStyle?: keyof typeof Taio.optionToastStyle,
        waitUntilDone?: boolean
    ): void {
        this._action.showToast(title, toastStyle, waitUntilDone)
    }
    showText(input?: AltParam, title?: AltParam): void {
        this._action.showText(input, title)
    }
    showHTML(
        code?: AltParam,
        title?: AltParam,
        showsProgress?: boolean,
        fullScreen?: boolean,
        opaqueBackground?: boolean
    ): void {
        this._action.showHTML(
            code,
            title,
            showsProgress,
            fullScreen,
            opaqueBackground
        )
    }
    compareDiff(text1?: AltParam, text2?: AltParam): void {
        this._action.compareDiff(text1, text2)
    }
    filterLines(
        text?: AltParam,
        matchMode?: keyof typeof Taio.optionListFilterMatchMode,
        pattern?: AltParam
    ): void {
        this._action.filterLines(text, matchMode, pattern)
    }
    deduplicateLines(input?: AltParam): void {
        this._action.deduplicateLines(input)
    }
    reverseText(
        text?: AltParam,
        revertMode?: keyof typeof Taio.optionListReverseMode
    ): void {
        this._action.reverseText(text, revertMode)
    }
    sortLines(
        lines?: AltParam,
        sortMode?: keyof typeof Taio.optionListSortMode
    ): void {
        this._action.sortLines(lines, sortMode)
    }
    splitText(
        text?: AltParam,
        separator?: AltParam,
        matchMode?: keyof typeof Taio.optionListSplitMatchMode
    ): void {
        this._action.splitText(text, separator, matchMode)
    }
    mergeText(lines?: AltParam, jointer?: AltParam): void {
        this._action.mergeText(lines, jointer)
    }
    truncateLines(
        lines?: AltParam,
        length?: number,
        truncateMode?: keyof typeof Taio.optionListTruncateMode
    ): void {
        this._action.truncateLines(lines, length, truncateMode)
    }
    newDocument(
        text?: AltParam,
        fileName?: AltParam,
        location?: keyof typeof Taio.optionGlobalTaioEditorLocation,
        openInEditor?: boolean
    ): void {
        this._action.newDocument(text, fileName, location, openInEditor)
    }
    openDocument(
        fileName?: AltParam,
        location?: keyof typeof Taio.optionGlobalTaioEditorLocation
    ): void {
        this._action.openDocument(fileName, location)
    }
    getFileName(
        style?: keyof typeof Taio.optionEditorFileNameStyle,
        includeExtension?: boolean
    ): void {
        this._action.getFileName(style, includeExtension)
    }
    getText(
        fileName?: AltParam,
        location?: keyof typeof Taio.optionGlobalTaioEditorLocation,
        whenNotExists?: keyof typeof Taio.optionGlobalTaioFallback
    ): void {
        this._action.getText(fileName, location, whenNotExists)
    }
    setText(
        text?: AltParam,
        fileName?: AltParam,
        location?: keyof typeof Taio.optionGlobalTaioEditorLocation,
        createIfNotExists?: boolean
    ): void {
        this._action.setText(text, fileName, location, createIfNotExists)
    }
    smartSelect(matchMode?: keyof typeof Taio.optionEditorMatchMode): void {
        this._action.smartSelect(matchMode)
    }
    extendSelection(
        selectionDirection?: keyof typeof Taio.optionEditorSelectionDirection,
        selectionUnit?: keyof typeof Taio.optionEditorSelectionUnit,
        numberOfCharacters?: number
    ): void {
        this._action.extendSelection(
            selectionDirection,
            selectionUnit,
            numberOfCharacters
        )
    }
    getSelectedText(
        whenNotExists?: keyof typeof Taio.optionGlobalTaioFallback
    ): void {
        this._action.getSelectedText(whenNotExists)
    }
    moveCursor(
        selectionDirection?: keyof typeof Taio.optionEditorSelectionDirection,
        selectionUnit?: keyof typeof Taio.optionEditorSelectionUnit,
        numberOfCharacters?: number
    ): void {
        this._action.moveCursor(
            selectionDirection,
            selectionUnit,
            numberOfCharacters
        )
    }
    replaceSelectedText(input?: AltParam): void {
        this._action.replaceSelectedText(input)
    }
    selectRange(location?: number, length?: number): void {
        this._action.selectRange(location, length)
    }
    insertClipping(input?: AltParam): void {
        this._action.insertClipping(input)
    }
    deleteClipping(input?: AltParam): void {
        this._action.deleteClipping(input)
    }
    replaceClipping(search?: AltParam, replaceWith?: AltParam): void {
        this._action.replaceClipping(search, replaceWith)
    }
    pinClipping(input?: AltParam): void {
        this._action.pinClipping(input)
    }
    getClipping(contentType?: keyof typeof Taio.optionClipContentType): void {
        this._action.getClipping(contentType)
    }
    setClippingText(input?: AltParam): void {
        this._action.setClippingText(input)
    }
    If(
        condition: {
            leftHandSide: AltParam
            rightHandSide: AltParam
            condition: keyof typeof Taio.TaioFlowCondition
        },
        scope: () => void
    ): TaioFlowIf {
        return this._action.If(condition, scope)
    }
    afterDelay(delayInterval?: number): void {
        this._action.afterDelay(delayInterval)
    }
    finishRunning(): void {
        this._action.finishRunning()
    }
    setVariable(name?: string, value?: AltParam): FlowVariable {
        return this._action.setVariable(name, value)
    }
    getVariable(
        name?: AltParam,
        whenNotExists?: keyof typeof Taio.optionGlobalTaioFallback
    ): void {
        this._action.getVariable(name, whenNotExists)
    }
    repeatBlock(repeatTimes: number, scope: () => void): void {
        this._action.repeatBlock(repeatTimes, scope)
    }
    forEach(
        text: AltParam,
        scope: () => void,
        forEachMode?: keyof typeof Taio.optionForEachMode,
        pattern?: AltParam,
        matchGroup?: number,
        reverse?: boolean
    ): void {
        this._action.forEach(
            text,
            scope,
            forEachMode,
            pattern,
            matchGroup,
            reverse
        )
    }
    runJavaScript(code: Taio.JSFunc | string): void {
        this._action.runJavaScript(code)
    }
    showDictionaryDefinition(input?: AltParam): void {
        this._action.showDictionaryDefinition(input)
    }
    getClipboard(): void {
        this._action.getClipboard()
    }
    setClipboard(
        text?: AltParam,
        localOnly?: boolean,
        expireAfterSeconds?: number
    ): void {
        this._action.setClipboard(text, localOnly, expireAfterSeconds)
    }
    math(input?: AltParam): void {
        this._action.math(input)
    }
    speakText(
        text?: AltParam,
        language?: AltParam,
        rate?: number,
        waitUntilDone?: boolean
    ): void {
        this._action.speakText(text, language, rate, waitUntilDone)
    }
    openURL(url?: AltParam, browser?: keyof typeof Taio.optionBrowser): void {
        this._action.openURL(url, browser)
    }
    webSearch(input?: AltParam): void {
        this._action.webSearch(input)
    }
    httpRequest(
        url?: AltParam,
        method?: keyof typeof Taio.optionRequestMethod,
        headers?: AltParam,
        body?: AltParam
    ): void {
        this._action.httpRequest(url, method, headers, body)
    }
    markdownToHTML(input?: AltParam, includeTemplate?: boolean): void {
        this._action.markdownToHTML(input, includeTemplate)
    }
    shareSheet(
        text?: AltParam,
        shareAs?: keyof typeof Taio.optionShareSheet
    ): void {
        this._action.shareSheet(text, shareAs)
    }
    composeEmail(
        recipients?: AltParam,
        subject?: AltParam,
        messageBody?: AltParam,
        isHTML?: boolean
    ): void {
        this._action.composeEmail(recipients, subject, messageBody, isHTML)
    }
    composeTextMessage(recipients?: AltParam, messageBody?: AltParam): void {
        this._action.composeTextMessage(recipients, messageBody)
    }

    toJSON(): string {
        return JSON.stringify(this._action.export(), null, options.indentLength)
    }
    toString(): string {
        return JSON.stringify(this._action.export(), null, options.indentLength)
    }
}

export const newTaioAction = (
    info: {
        name?: string
        summary?: string
        icon?: string
        iconColor?: string
    } = {}
): TaioAction => {
    return new TaioAction(info)
}

export const options = {
    indentLength: 2,
    defaultIcon: 'wand.and.stars',
    defaultIconColor: '#307ABC',
} as {
    indentLength: number
    defaultIcon: string
    defaultIconColor: string
}
