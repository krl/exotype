var test = require('tape')

var exoform = require('exoform')

var Duck = require('./duck.js')
var RubberDuck = require('./rubber.js')
var Sorter = require('./sorter.js')
var Value = require('./value.js')

var persistGetBack = function (obj, cb) {
  obj.persist(function (err, res) {
    if (err) throw err
    exoform.require([], res.__hash, cb)
  })
}

test('make duck quack', function (t) {
  var duck = new Duck(3)

  duck.quack(function (err, res) {
    if (err) return t.fail(err)
    t.equal(res, 'quack, quack, quack', 'duck should quack')
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
                      'quack, quack'],
                'all ducks should quack')
  })

  duck.ageSum(function (err, res) {
    if (err) return t.fail(err)
    t.equal(res, 6)
  })
})

test('persist duck with children', function (t) {
  var duck = new Duck(3, [new Duck(1), new RubberDuck(2)])

  persistGetBack(duck, function (sameduck) {
    // the Ref should have metadata
    t.deepEqual(sameduck.children[0].meta, { ageSum: 1 })

    sameduck.quackAll(function (err, res) {
      if (err) t.fail(err)
      t.deepEqual(res, ['quack, quack, quack', 'quack', '*windy squee*'],
                  'persisted ducks should quack')
      t.end()
    })
  })
})

test('two rounds of persist/restore', function (t) {
  var duck = new Duck(3, [new Duck(1), new RubberDuck(2)])

  persistGetBack(duck, function (duck2) {
    persistGetBack(duck2, function (duck3) {
      duck3.quackAll(function (err, res) {
        if (err) t.fail(err)
        t.deepEqual(res, ['quack, quack, quack', 'quack', '*windy squee*'],
                   'doubly persisted ducks should quack')
        t.end()
      })
    })
  })
})

test('complex args', function (t) {
  var v = new Value({ 'wong': [3, 2, 0],
                      0: 1,
                      'he-lo': 9.99,
                      NaN: undefined })

  persistGetBack(v, function (res) {
    t.deepEqual(v.val, res.val, 'copmlex arguments restored')
    t.end()
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
    t.deepEqual(res, [ 2, 2, 3, 4, 8, 9, 99, 100 ], 'should sort ascending')
  })

  sorter2.sort(jumble, function (err, res) {
    if (err) t.fail(err)
    t.deepEqual(res, [ 100, 99, 9, 8, 4, 3, 2, 2 ], 'should sort descending')
  })

  persistGetBack(sorter1, function (sorter3) {
    sorter3.sort(jumble, function (err, res) {
      if (err) t.fail(err)
      t.deepEqual(res, [ 2, 2, 3, 4, 8, 9, 99, 100 ],
                  'should persist and sort ascending')
    })
  })

  persistGetBack(sorter2, function (sorter4) {
    sorter4.sort(jumble, function (err, res) {
      if (err) t.fail(err)
      t.deepEqual(res, [ 100, 99, 9, 8, 4, 3, 2, 2 ],
                  'should persist and sort decending')
    })
  })

  persistGetBack(sorter1, function (inter) {
    persistGetBack(inter, function (sorter5) {
      sorter5.sort(jumble, function (err, res) {
        if (err) t.fail(err)
        t.deepEqual(res, [ 2, 2, 3, 4, 8, 9, 99, 100 ],
                    'should persist twice and sort ascending')
      })
    })
  })

  persistGetBack(sorter2, function (inter) {
    persistGetBack(inter, function (sorter6) {
      sorter6.sort(jumble, function (err, res) {
        if (err) t.fail(err)
        t.deepEqual(res, [ 100, 99, 9, 8, 4, 3, 2, 2 ],
                    'should persist twice and sort decending')
      })
    })
  })
})

test('instanceof', function (t) {
  var duck = new Duck(4, [new Duck(3)])
  var rubb = new RubberDuck(3)

  t.assert(duck instanceof Duck, 'duck is a Duck')
  t.assert(rubb instanceof RubberDuck, 'rubb is a RubberDuck')
  t.false(duck instanceof RubberDuck, 'duck is not a RubberDuck')

  persistGetBack(duck, function (duck2) {
    t.assert(duck2 instanceof Duck, 'restored duck is a Duck')

    var ling = duck2.children[0]

    t.false(ling instanceof Duck, 'restored duck child is a ref')

    ling.reify(function (err, ling2) {
      if (err) return t.fail(err)
      t.assert(ling2 instanceof Duck, 'reified child is a Duck')

      ling2.quack(function (err, res) {
        if (err) return t.fail(err)
        t.equal(res, 'quack, quack, quack', 'reified should quack')

        // test reify original
        duck.reify(function (err, duck3) {
          if (err) return t.fail(err)
          t.equal(duck, duck3, 'reifying duck should be noop')
          t.end()
        })
      })
    })
  })
})
