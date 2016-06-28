module.exports = function toGMTDateTimestamp(date) {
   return (new Date( Math.floor(new Date(date).getTime() / 86400000) * 86400000 )).getTime()
}