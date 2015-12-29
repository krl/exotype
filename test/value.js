var exotype = require('../index.js')

var Value = exotype(function (value) {
  this.val = value
})

module.exports = Value
