'use strict'
var exoform = require('exoform')
var inherits = require('inherits')
var async = require('async')

try {
  // are we in node directly?
  var requireNode = require
  var strace = requireNode('stack-trace')
  var exobundle = requireNode('exoform-bundle')
} catch (e) {}

var debug = false

function range (a, b) {
  var arr = []
  var c = b - a + 1
  while (c--) arr[c] = b--
  return arr
}

var wrapMethod = function (name) {
  return function () {
    var self = this
    var args = []
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i])
    }

    if (self.resolved) {
      self.resolved[name].apply(self, args)
    } else {
      exoform.require([], self.hash, function (res) {
        self.resolved = res
        res[name].apply(res, args)
      })
    }
  }
}

var makeRef = function (hash, methods, meta) {
  for (var i = 0; i < methods.length; i++) {
    Ref.prototype[methods[i]] = wrapMethod(methods[i])
  }
  return new Ref(hash, methods, meta)
}

var Ref = function (hash, methods, meta) {
  this.hash = hash
  this.methods = methods
  this.meta = meta
}

var codegen = function (marker, code) {
  var split = code.split('\n')
  var res = ''
  for (var i = 0; i < split.length; i++) {
    if (debug) {
      res += '/* ' + marker + ' */ '
    }
    res += split[i] + '\n'
  }
  return res
}

var escapeString = function (string) {
  return '\'' + string.replace('\'', '\\\'') + '\''
}

var transform = function (value, selfName, cb) {
  // takes the arguments array and recurively
  // turns it into generated code
  var type = typeof value
  if (type === 'function') {
    return cb(null, value.toString())
  } else if (type === 'string') {
    cb(null, escapeString(value))
  } else if (type === 'number') {
    cb(null, value + '')
  } else if (value instanceof Object) {
    var keys, args
    if (value.persist === persist) {
      // nested Exotype
      var inst = value.__instance
      value.persist(function (err, res) {
        if (err) return cb(err)
        cb(null,
           codegen(
             'in transform',
             selfName + '.__makeRef(\'' + res.__hash + '\', ' +
               JSON.stringify(inst.methods) + ', ' +
               JSON.stringify(value.meta) + ')'))
      })
      return
    } else if (value instanceof Ref) {
      // rewrite ref
      var str = selfName + '.__makeRef(\'' + value.hash + '\', ' +
        JSON.stringify(value.methods) + ', ' +
        JSON.stringify(value.meta) + ')'
      return cb(null, str)
    } else if (value instanceof Array) {
      keys = range(0, value.length - 1)
      args = []
    } else {
      keys = Object.keys(value)
      args = {}
    }
    var count = keys.length
    var all = function () {
      if (value instanceof Array) {
        cb(null, '[' + args.join(',') + ']')
      } else {
        var keys = Object.keys(args)
        async.map(keys, function (key, mcb) {
          transform(key, selfName, mcb)
        }, function (err, transformedKeys) {
          if (err) return cb(err)
          var str = '{'
          for (var i = 0; i < keys.length; i++) {
            str += transformedKeys[i] + ':' + args[keys[i]] + ','
          }
          if (keys.length) str = str.substr(0, str.length - 1)
          cb(null, str + '}')
        })
      }
    }
    keys.map(function (a) {
      transform(value[a], selfName, function (err, res) {
        if (err) return cb(err)
        args[a] = res
        if (!--count) {
          all()
        }
      })
    })
  } else if (typeof value === 'undefined') {
    cb(null, 'undefined')
  } else {
    cb(new Error('Cannot serialize type ' + type))
  }
}

var persist = function (cb) {
  var self = this

  var meta = self.constructor.__meta
  var inst = self.__instance

  if (!meta) {
    // runtime bundling for node compatability (slow)
    exobundle(inst.consModule, [], {}, function (err, res) {
      if (err) return cb(err)
      self.constructor.__meta = { self: res }
      self.persist(cb)
    })
  } else {
    if (!inst.name) {
      inst.name = 'Exo'
    }
    transform(inst.args, inst.name, function (err, initString) {
      if (err) return cb(err)
      // strip [] from initArgs array
      initString = initString.substr(1, initString.length - 2)
      var data =
        codegen('persisting',
                'var m = arguments[0]\n' +
                'm.exoform.require(m.refs, \'' + meta.self + '\', ' +
                'function (' + inst.name + ') {\n' +
                '  m.define(new ' + inst.name + '(' + initString + '))\n' +
                '})\n')

      exoform.put(data, function (err, res) {
        if (err) return cb(err)
        Object.defineProperty(self, '__hash', {
          value: res
        })
        cb(null, self)
      })
    })
  }
}

var exotype = function (type) {
  var cons = type.prototype.constructor

  // in node
  var consModule
  try {
    consModule = strace.parse(new Error('lol'))[1].fileName
  } catch (e) {}

  var Exo = function () {
    var args = []
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i])
    }
    cons.apply(this, arguments)
    Object.defineProperty(this, '__instance', {
      value: { args: args,
               Ref: Ref,
               consModule: consModule,
               methods: Object.keys(Exo.prototype),
               name: type.name }
    })
  }
  try { // to restore constructor name, if the environment supports it
    Object.defineProperty(Exo, 'name', { value: type.name })
  } catch (e) {}
  inherits(Exo, type)
  Exo.prototype.persist = persist
  Object.defineProperty(Exo, '__makeRef', { value: makeRef })
  return Exo
}

module.exports = exotype
