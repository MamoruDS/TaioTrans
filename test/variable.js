const TaioAction = require('../dist/action').TaioAction
const action = new TaioAction()

const peach = action.setVariable('peach', 'peach')

// default
action.showText()

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
    'Content-Type': 'application/json',
    fruit: peach,
})

// array
action.showText(['apple', 'pear', peach])

console.log(JSON.stringify(action.export()['actions'], null, 4))
