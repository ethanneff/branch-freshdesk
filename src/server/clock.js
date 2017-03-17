// lib
var worker = require('./worker.js')

// properties
var seconds = 5 * 60 * 1000 // 3 minutes

// entry
module.exports = start

function start () {
      worker.run()
  setTimeout(function () {

    start()
  }, seconds)
}
