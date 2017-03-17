// lib
var worker = require('./worker.js')

// properties
var seconds = 1 * 60 * 1000 // 1 minutes

// entry
module.exports = start

function start () {
  worker.run()
  setTimeout(function () {
    start()
  }, seconds)
}
