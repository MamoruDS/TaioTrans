const taio = require('../dist/main')
const action = taio.newTaioAction({
    name: 'variables',
})

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
    'Content-Type': 'application/json',
    fruit: peach,
})

// array
action.showText(['apple', 'pear', peach])
