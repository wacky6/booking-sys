'use strict'
module.exports = function GMTDateTimestampToDateStr(d) {
    return (new Date(d)).toLocaleString()
}