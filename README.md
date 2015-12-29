# Exotype

Persistent Javascript instances.

Exotype wraps javascript object constructors, and gives them a .persist method, which will use [exoform](https://github.com/krl/exoform) to persist the given instance.

This works by overloading the object constructor, and saving the initial values that the object was created with.

Exotype tries to provide an interface as similar as possible to traditional javascript objects, but there's some caveats.

Persistent in this case means immutable, and you'll have to use this in a functional-style, creating new objects rather than changing them.

If you set a .meta attribute to your object, this will also be saved in the reference

If your constructor contains other Exotype instances, these will be persisted as Ref-types. Ref types keep track of their metadata, what methods and constructor they are associated with.

If you call a method on a Ref object, the ref will lazily load and cache its children, and call the same method on the returned value. This means that all methods will have to be asynchronous.

## demo

`example/duck.js`
```js
var exotype = require('exotype')

var Duck = exotype(function (age) {
  this._age = age
})

Duck.prototype.quack = function (cb) {
  var quacks = []
  for (var i = 0; i < this._age; i++) {
    quacks.push('quack')
  }
  cb(null, quacks.join(', '))
}

module.exports = Duck
```

`example/persist.js`
```js
var Duck = require('./duck.js')

var duck = new Duck(3)

duck.quack(function (err, res) {
	if (err) throw err
  console.log(res) // => 'quack, quack, quack'
})

duck.persist(function (err, duck) {
	if (err) throw err
	console.log(duck.__hash) => QmPC8fQmpyv358VqdczAhvJ5FhLSoDK5uc2HNiSZFxvhoM
})
```

```bash
ipfs cat QmPC8fQmpyv358VqdczAhvJ5FhLSoDK5uc2HNiSZFxvhoM
```

Then outputs:

```js
var m = arguments[0]
m.exoform.require(m.refs, 'QmZAEXu9zmqVSvLqTN4EWA1PYvphmgNtihYGAV6jvrXeL5', function (Exo) {
  m.define(new Exo(3))
})
```

# Tests

Check out the tests for a more thorough demonstration of this lib.