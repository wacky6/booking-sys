const {
    isString,
    isArray,
    isNumber
} = require('util')

function isYear(o) {
    return isInteger
}

function isInteger(o) {
    return isNumber(o) && ''+Math.floor(o) === ''+o
}

const SCHEME = {
    user: {
        user: (s) => isString(s) && s.length>=3,
        pswd: (s) => isString && s.length>=3,
        cid:  (s) => isString(s) && s.match(/\d+/) 
    },
    book: {
        title: (s) => isString && s.length>=1,
        year:  isYear,
        publisher: isString,
        author: isString,
        total:  (o) => isInteger(o) && o>=0
    }
}

let EXPORTS = {}

for (let key in SCHEME) 
    EXPORTS[key] = (inp) => verify(inp, SCHEME[key])

module.exports = EXPORTS


function verify(inp, scheme) {
    for (let key in scheme)
        if ( ! scheme[key](inp[key]) )
            return false
    return true
}