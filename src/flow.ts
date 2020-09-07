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
    actions: TaioFlowItem[]
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

export interface TaioFlowItem {
    type: string
    parameters?: {}
}

// ## General
// ### Comment
export interface TaioFlowComment extends TaioFlowItem {
    type: '@comment'
    parameters: {
        text: TaioFlowVal
    }
}

// ## Text
// ### Create Text
export interface TaioFlowText extends TaioFlowItem {
    type: '@text'
    parameters: {
        text: TaioFlowVal
    }
}
// ### Text Case
export interface TaioFlowTextCase extends TaioFlowItem {
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
export interface TaioFlowTextEncode extends TaioFlowItem {
    type: '@text.encode'
    parameters: {
        mode: number
        decode: boolean
        text: TaioFlowVal
    }
}
export const optionTextEncode = {
    'URL Encode': 0,
    'Base64 Encode': 1,
    'HTML Entity Encode': 2,
    'JSON Escape': 3,
}
// ### Count
export interface TaioFlowTextCount extends TaioFlowItem {
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
export interface TaioFlowTextRange extends TaioFlowItem {
    type: '@text.extract-range'
    parameters: {
        text: TaioFlowVal
        location: number
        length: number
    }
}
// ### Text Filter
// ### Text Tokenization
// ### Find & Replace
// ### Trim Text

// ## User Interface
// ### Text Input
// ### Select from Menu
export interface TaioFlowMenu extends TaioFlowItem {
    type: '@ui.menu'
    parameters: {
        prompt: TaioFlowVal
        multiValue: boolean
        lines: TaioFlowVal
    }
}
// ### Show Alert
// ### Show Confirm Dialog
// ### Show Toast
// ### Show Text
export interface TaioFlowRender extends TaioFlowItem {
    type: '@ui.render-text'
    parameters: {
        title: TaioFlowVal
        text: TaioFlowVal
    }
}
// ### Show HTML
// ### Compare Diff

// ## List
// ### Filter Lines
// ### Deduplicate Lines
// ### Reverse Text
// ### Sort Lines
// ### Split Text
// ### Merge Text
// ### Truncate Lines

// ## Editor
// ### New Document
// ### Open Document
// ### Get File Name
// ### Get Text
// ### Set text
// ### Extend Selection
// ### Get Selected Text
// ### Move Cursor
// ### Replace Selected Text
// ### Select Range

// ## Clips
// ### Insert Clipping
// ### Delete Clipping
// ### Replace Clipping
// ### Pin Clipping
// ### Get Clipping
// ### Set Clipping Text

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
export interface TaioFlowConditionControl {
    type: '@flow.if' | '@flow.else' | '@flow.endif'
    parameters: {
        blockIdentifier: string
        condition?: number
        lhs?: TaioFlowVal
        rhs?: TaioFlowVal
    }
}
// ### After Delay
export interface TaioFlowDelay extends TaioFlowItem {
    type: '@flow.delay'
    parameters: {
        interval: number
    }
}
// ### Finish Running
export interface TaioFlowFinish extends TaioFlowItem {
    type: '@flow.finish'
}
// ### Set Variable
export interface TaioFlowVarSet extends TaioFlowItem {
    type: '@flow.set-variable'
    parameters: {
        value: TaioFlowVal
        name: TaioFlowVal
    }
}
// ### Get Variable
export interface TaioFlowVarGet extends TaioFlowItem {
    type: '@flow.get-variable'
    parameters: {
        fallback: 0 | 1
        name: TaioFlowVal
    }
}
// ### Repeat Block
export interface TaioFlowRepeat extends TaioFlowItem {
    type: '@flow.repeat-begin' | '@flow.repeat-end'
    parameters: {
        blockIdentifier: BID
        count?: number
    }
}
// ### For Each
// ### Run JavaScript
export interface TaioFlowJS extends TaioFlowItem {
    type: '@flow.javascript'
    parameters: {
        script: TaioFlowVal
    }
}

// ## Utilities
// ### Show Dictionary Definition
// ### Get Clipboard
// ### Set Clipboard
// ### Math
// ### Speak Text
// ### Open URL
// ### Web Search
// ### HTTP Request
export interface TaioFlowRequest extends TaioFlowItem {
    type: '@util.request'
    parameters: {
        body: TaioFlowVal
        url: TaioFlowVal
        method: number
        headers: TaioFlowVal
    }
}
// ### Markdown to HTML

// ## Sharing
// ### Share Sheet
// ### Compose Email
// ### Compose Text Message
