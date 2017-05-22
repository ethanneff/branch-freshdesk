// app
var express = require('express')
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

// lib
var path = require('path')
var helmet = require('helmet')
var config = require('./config')
var worker = require('./worker.js')

// properties
var testmode

// entry
module.exports = run()

function run () {
  // testmode
  testmode = isTestMode()

  // server
  app.use(helmet())
  app.use(express.static(path.join(__dirname, './../client')))
  app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, '/index.html'))
  })

  // start
  http.listen(process.env.PORT || 5000)

  // sockets
  sockets()
}

// methods
function isTestMode () {
  var args = process.argv.splice(2)
  for (var i = 0; i < args.length; i++) {
    var arg = args[i]
    if (arg === '-test') {
      return true
    }
  }
  return false
}

function sockets () {
  // browser
  io.on('connection', function (socket) {
    // listeners
    socket.on('pageLoad', function (callback) {
      worker.scrape(false, function (data) {
        callback(data.html)
      })
    })
    socket.on('toggleAgent', function (agent, callback) {
      worker.toggleAgent(agent, function (success) {
        worker.scrape(function (agents) {
          callback(agents.html)
        })
      })
    })
    socket.on('toggleSchedule', function (agent) {
      worker.toggleSchedule(agent)
    })
  })
}

// public
exports.testmode = testmode
