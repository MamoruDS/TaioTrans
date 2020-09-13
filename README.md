# TaioTrans

> Generate Taio Action with JS/TS

![npm](https://img.shields.io/npm/v/taiotrans.svg?style=flat-square)

## Installation

```shell
npm i taiotrans
```

## Usage

### create new action

```javascript
const taio = require('taiotrans')

const action1 = taio.newTaioAction({
    name: 'Example Action',
})

const action2 = taio.newTaioAction({
    name: 'Dropbox Sync',
    summary: 'sync files with your dropbox account',
    icon: 'shippingbox.fill',
    iconColor: '#13247B',
})
```

### variables

#### built-in variables

```javascript
action.builtIn('Last Result')
action.builtIn('Clipboard')
action.builtIn('Current Date', {
    dateStyle: 'Full Style',
    timeStyle: 'No Style',
})
action.builtIn('Current Date', 'yyyy')
action.builtIn('File Name')
action.builtIn('File Extension')
action.builtIn('Full Text')
action.builtIn('Selected Text')
action.builtIn('Selected Location')
action.builtIn('Selected Length')
```

#### variables usage

```javascript
// varaible allocate
const peach = action.setVariable('peach', 'peach')

// default
action.showText()
action.showText(action.builtIn('Last Result'))

// variable
action.showText(peach)

// string
action.showText('')
action.showText(`i love ${peach}`)

// boolean
action.showText(true)
action.showText(false)

// object
action.showText({
    'Fruit-Type': peach,
})

// array
action.showText(['apple', 'pear', peach])
```

### condition

```javascript
const x = action.setVariable('x', Math.floor(Math.random() * 5).toString())
action
    .If(
        {
            leftHandSide: x,
            rightHandSide: '0',
            condition: 'Equal to',
        },
        () => {
            action.showText('x is equal to 0', 'result')
        }
    )
    .ElseIf(
        {
            leftHandSide: x,
            rightHandSide: '1',
            condition: 'Equal to',
        },
        () => {
            action.showText('x is equal to 1', 'result')
        }
    )
    .ElseIf(
        {
            leftHandSide: x,
            rightHandSide: '2',
            condition: 'Equal to',
        },
        () => {
            action.showText('x is equal to 1', 'result')
        }
    )
    .ElseIf(
        {
            leftHandSide: x,
            rightHandSide: '3',
            condition: 'Equal to',
        },
        () => {
            action.showText('x is equal to 3', 'result')
        }
    )
    .Else(() => {
        action.showText('x is larger than 3', 'result')
    })
action.showText(`x is ${x}`, 'final')
```

### embedding JS code

```javascript
action.runJavaScript(() => {
    // Get input
    const text = $actions.inputValue

    // Resolve with output
    $actions.resolve('Result')

    // Exception handling:
    //  $actions.reject("Error");
    //  $actions.finish();
})

// embedding
const fs = require('fs')
action.runJavaScript(fs.readFileSync('code.js', { encoding: 'utf-8' }))
```

declaration of built-in methods

```javascript
const { $actions, $app } = require('taiotrans/dist/builtIn')
```

 <p align="center" style="align:center;height:250px;"><img src="https://github.com/MamoruDS/TaioTrans/raw/main/static/MPDM195XBO2_2020-09-14_06-50-57.png" alt="logo"></p>

### export

```javascript
console.log(action.toString())

const fs = require('fs')
fs.writeFileSync('action.json', action)
```

## License

MIT © MamoruDS
