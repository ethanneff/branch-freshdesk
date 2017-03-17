// lib
var worker = require('./worker.js')

// properties
var seconds = 3 * 60 * 1000 // 3 minutes

// entry
module.exports = start

function start () {
  console.log('clock run')
  worker.run()
  setTimeout(function () {
    start()
  }, seconds)
}
