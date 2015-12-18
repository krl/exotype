var exotype = require('../index.js')

var Sorter = function (sortFn) {
  this.sortFn = sortFn
}

Sorter.prototype.sort = function (array, cb) {
  cb(null, array.sort(this.sortFn))
}

module.exports = exotype(Sorter)
