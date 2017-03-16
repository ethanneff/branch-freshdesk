// lib
var worker = require('./worker.js')

// properties
var seconds = 3 * 60 * 1000 // 3 minutes
seconds = 3000

// entry
module.exports = start()

function start () {
  setTimeout(function () {
    worker.run()
    start()
  }, seconds)
}
