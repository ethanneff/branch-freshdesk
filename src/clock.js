// lib
var app = require('./app.js')

// properties
var seconds = 10 * 60 * 1000 // 10 minutes
seconds = 3000

// entry
module.exports = start()

function start () {
  setTimeout(function () {
    app.run()
    start()
  }, seconds)
}
