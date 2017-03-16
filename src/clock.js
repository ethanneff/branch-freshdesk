// lib
var worker = require('./worker.js')

// properties
var seconds = 5 * 60 * 1000 // 5 minutes

// entry
module.exports = start()

function start () {
  setTimeout(function () {
    worker.run()
    start()
  }, seconds)
}