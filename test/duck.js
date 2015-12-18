var exotype = require('../index.js')
var a = require('async')

var Duck = function (age, children) {
  this._age = age
  this.children = children || []
  var sum = age
  for (var i = 0; i < this.children.length; i++) {
    sum += this.children[i].meta.ageSum
  }
  this.meta = { ageSum: sum }
}

Duck.prototype.age = function (cb) {
  return cb(null, this._age)
}

Duck.prototype.ageSum = function (cb) {
  return cb(null, this.meta.ageSum)
}

Duck.prototype.quackAll = function (cb) {
  var self = this
  self.quack(function (err, res) {
    if (err) return cb(err)
    a.reduce(Object.keys(self.children), [res], function (memo, i, rcb) {
      self.children[i].quackAll(function (err, res) {
        if (err) return cb(err)
        memo = memo.concat(res)
        rcb(null, memo)
      })
    }, cb)
  })
}

Duck.prototype.quack = function (cb) {
  var quacks = []
  for (var i = 0; i < this._age; i++) {
    quacks.push('quack')
  }
  cb(null, quacks.join(', '))
}

module.exports = exotype(Duck)
