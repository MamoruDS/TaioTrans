interface Actions {
    finish: () => void
    getVar: (name: string) => string
    inputValue: string
    reject: (error: string) => void
    resolve: (value: string) => void
    setVar: (name: string, value: string) => void
}
export const $actions = {} as Actions

interface App {
    autoKeyboardEnabled: boolean
    close: (sec: number) => void
    env: number | 1
    idleTimerDisabled: boolean
    info: AppInfo
    listen: (...args: any[]) => void
    minOSVer?: string
    minSDKVer?: string
    notify: (...args: any) => void
    openBrowser: (...args: any) => void
    openURL: (url: string) => void
    rotateDisabled: boolean
    strings?: object
    theme?: string
    tips: (tips: string) => void
    widgetIndex: number | -1
}
type AppInfo = {
    version: string
    build: string
    locale: string
    bundleID: string
}
export const $app = {} as App

interface Context {
    allItems?: object
    clear: () => void
    close: () => void
    dataItems: Data[]
    image: Image
    imageItems: Image[]
    link: string
    linkItems: string[]
    query?: object
    safari: {
        items: any[]
    }
    text: string
    textItems: string[]
}
export const $context = {} as Context

interface Clipboard {
    clear: () => void
    copy: (...args: any[]) => void
    date: Date
    dates: Date[]
    email: string
    emails: string[]
    image: Image
    items: any[]
    link: string
    links: string[]
    phoneNumber: string
    phoneNumbers: string[]
    set: (...args: any[]) => void
    setTextLocalOnly: (text: string) => void
    text: string
}
export const $clipboard = {} as Clipboard

interface Data {}
export const $data = {} as Data

interface Device {
    hasFaceID: boolean
    hasTouchID: boolean
    info: DeviceInfo
    isDarkMode: boolean
    isIpad: boolean
    isIphonePlus: boolean
    isIphoneX: boolean
    isJailbroken: boolean
    isVoiceOverOn: boolean
    networkType: number | object // 1
    space: DeviceStorageSpace
    ssid: object
    taptic: (level: number) => void
    wlanAddress: string
}
type DeviceInfo = {
    battery: {
        level: number
        state: number
    }
    language: string
    model: string
    name: string
    screen: {
        height: number
        orientation: number
        scale: number
        width: number
    }
    version: number // iOS version
}
type SpaceInfo = {
    bytes: number
    string: string
}
type DeviceStorageSpace = {
    disk: {
        free: SpaceInfo
        total: SpaceInfo
    }
    memory: {
        free: SpaceInfo
        total: SpaceInfo
    }
}
export const $device = {} as Device

interface DownloadResult {}

interface Editor {
    activate: () => void
    canRedo: boolean
    canUndo: boolean
    deactivate: () => void
    isActive: boolean
    redo: () => void
    save: () => void
    selectedRange: Range
    selectedText: string
    setTextInRange: (text: string, range: Range) => void
    text: string
    textInRange: (range: Range) => string
    undo: () => void
    view: TextView
}
export const $editor = {} as Editor

interface http {
    download: (req: httpRequest) => Promise<DownloadResult>
    get: (req: httpRequest) => Promise<httpResult>
    lengthen: (...args: any[]) => Promise<string>
    request: (req: httpRequest) => Promise<httpResult>
    shorten: (...args: any[]) => Promise<string>
    startServer: (...args: any[]) => void
    status: number
    stopServer: (...args: any[]) => void
    upload: (req: httpRequest) => Promise<httpResult>
}
export const $http = {} as http

interface httpRequest {}
interface httpResult {}

interface Image {}
export const $image = {} as Image

type Range = {
    length: number
    location: number
}

interface SelectResult {}

interface TextView {}

interface UI {
    action: (...args: any[]) => Promise<SelectResult>
    alert: (...args: any[]) => Promise<SelectResult>
    animate: (...args: any[]) => Promise<boolean>
    clearToast: () => void
    controller: any
    create: (...args: any[]) => View
    error: (message: string, delay?: number) => void
    get: (id: string) => View
    loading: (...args: (boolean | string)[]) => void
    menu: (items: string[]) => Promise<SelectResult>
    pop: () => void
    popToRoot: () => void
    popover: (...args: any[]) => void
    preview: (...args: any[]) => void
    progress: (value: number, message?: string) => void
    push: (...args: any[]) => View[]
    render: (...args: any[]) => View[]
    selectIcon: () => Promise<string>
    title: string
    toast: (message: string, delay?: number) => void
    window: View
}
export const $ui = {} as UI

interface View {}

// export type runJS = () => void
