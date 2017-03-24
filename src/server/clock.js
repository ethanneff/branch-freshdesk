// lib
var worker = require('./worker.js')
var server = require('./app.js')

// properties
var seconds

// entry
module.exports = start

function start () {
  console.log('clock')
  // TODO: test testmode
  seconds = server.testmode ? 5000 : 5 * 60 * 1000
  worker.scrape()
  setTimeout(function () {
    start()
  }, seconds)
}
