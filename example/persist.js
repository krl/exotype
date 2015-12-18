var Duck = require('./duck.js')

var duck = new Duck(3)

duck.quack(function (err, res) {
  if (err) throw err
  console.log(res) // => 'quack, quack, quack'
})

duck.persist(function (err, duck) {
  if (err) throw err
  console.log(duck.__hash)
})
