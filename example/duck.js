var exotype = require('../index.js')

var Duck = function (age) {
  this._age = age
}

Duck.prototype.quack = function (cb) {
  var quacks = []
  for (var i = 0; i < this._age; i++) {
    quacks.push('quack')
  }
  cb(null, quacks.join(', '))
}

module.exports = exotype(Duck)
