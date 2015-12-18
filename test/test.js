var test = require('tape')

var exoform = require('exoform')

var Duck = require('./duck.js')
var RubberDuck = require('./rubber.js')
var Sorter = require('./sorter.js')

var persistGetback = function (obj, cb) {
  obj.persist(function (err, res) {
    if (err) throw err
    exoform.require([], res.__hash, cb)
  })
}

test('make duck quack', function (t) {
  var duck = new Duck(3)

  duck.quack(function (err, res) {
    if (err) return t.fail(err)
    t.equal(res, 'quack, quack, quack')
    t.end()
  })
})

test('make duck with children', function (t) {
  var duck = new Duck(3, [new Duck(1), new Duck(2)])

  t.plan(2)

  duck.quackAll(function (err, res) {
    if (err) return t.fail(err)
    t.deepEqual(res, ['quack, quack, quack',
                      'quack',
                      'quack, quack'])
  })

  duck.ageSum(function (err, res) {
    if (err) return t.fail(err)
    t.equal(res, 6)
  })
})

test('persist duck with children', function (t) {
  var duck = new Duck(3, [new Duck(1), new RubberDuck(2)])

  persistGetback(duck, function (sameduck) {
    // the Ref should have metadata
    t.deepEqual(sameduck.children[0].meta, { ageSum: 1 })

    sameduck.quackAll(function (err, res) {
      if (err) t.fail(err)
      t.deepEqual(res, ['quack, quack, quack', 'quack', '*windy squee*'])
      t.end()
    })
  })
})

test('two rounds of persist/restore', function (t) {
  var duck = new Duck(3, [new Duck(1), new RubberDuck(2)])

  persistGetback(duck, function (duck2) {
    persistGetback(duck2, function (duck3) {
      duck3.quackAll(function (err, res) {
        if (err) t.fail(err)
        t.deepEqual(res, ['quack, quack, quack', 'quack', '*windy squee*'])
        t.end()
      })
    })
  })
})

test('functions as constructor args', function (t) {
  var jumble = [3, 8, 4, 2, 2, 9, 100, 99]

  t.plan(6)

  var sorter1 = new Sorter(function (a, b) {
    return a - b
  })

  var sorter2 = new Sorter(function (a, b) {
    return b - a
  })

  sorter1.sort(jumble, function (err, res) {
    if (err) t.fail(err)
    t.deepEqual(res, [ 2, 2, 3, 4, 8, 9, 99, 100 ])
  })

  sorter2.sort(jumble, function (err, res) {
    if (err) t.fail(err)
    t.deepEqual(res, [ 100, 99, 9, 8, 4, 3, 2, 2 ])
  })

  persistGetback(sorter1, function (sorter3) {
    sorter3.sort(jumble, function (err, res) {
      if (err) t.fail(err)
      t.deepEqual(res, [ 2, 2, 3, 4, 8, 9, 99, 100 ])
    })
  })

  persistGetback(sorter2, function (sorter4) {
    sorter4.sort(jumble, function (err, res) {
      if (err) t.fail(err)
      t.deepEqual(res, [ 100, 99, 9, 8, 4, 3, 2, 2 ])
    })
  })

  persistGetback(sorter1, function (inter) {
    persistGetback(inter, function (sorter5) {
      sorter5.sort(jumble, function (err, res) {
        if (err) t.fail(err)
        t.deepEqual(res, [ 2, 2, 3, 4, 8, 9, 99, 100 ])
      })
    })
  })

  persistGetback(sorter2, function (inter) {
    persistGetback(inter, function (sorter6) {
      sorter6.sort(jumble, function (err, res) {
        if (err) t.fail(err)
        t.deepEqual(res, [ 100, 99, 9, 8, 4, 3, 2, 2 ])
      })
    })
  })
})
