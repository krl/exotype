var exotype = require('../index.js')

var PlasticDuck = function (age) {
  this._age = age
}

PlasticDuck.prototype.age = function (cb) {
  cb(null, this._age)
}

PlasticDuck.prototype.ageSum = function (cb) {
  this.age(cb)
}

PlasticDuck.prototype.quackAll = function (cb) {
  this.quack(cb)
}

PlasticDuck.prototype.quack = function (cb) {
  cb(null, '*windy squee*')
}

module.exports = exotype(PlasticDuck)
