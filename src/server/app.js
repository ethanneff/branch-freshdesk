// app
var express = require('express')
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

// lib
var path = require('path')
var helmet = require('helmet')
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
  app.use(express.static(path.join(__dirname, './../../bower_components')))
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
    // connection
    worker.scrape(function (agents) {
      socket.emit('renderAgents', agents.html)
    })

    // listeners
    socket.on('toggleAgent', function (agent, callback) {
      worker.toggle(agent, function (success) {
        worker.scrape(function (agents) {
          callback(agents.html)
        })
      })
    })
    socket.on('scheduleAgent', function (agent) {
      console.log(agent)
    })
  })
}

// public
exports.testmode = testmode
