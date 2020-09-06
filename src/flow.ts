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
    parameters: {}
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
// ### Encode/Decode Text
// ### Count
// ### Text in Range
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
// ### After Delay
// ### Finish Running
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
