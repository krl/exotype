var exotype = require('../index.js')

var RubberDuck = exotype(function (age) {
  this.meta = { ageSum: age }
})

RubberDuck.prototype.age = function (cb) {
  cb(null, this.meta.ageSum)
}

RubberDuck.prototype.ageSum = function (cb) {
  this.age(cb)
}

RubberDuck.prototype.quackAll = function (cb) {
  this.quack(cb)
}

RubberDuck.prototype.quack = function (cb) {
  cb(null, '*windy squee*')
}

module.exports = RubberDuck
