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

// entry
module.exports = run()

// methods
function run () {
  // args
  processArguments()

  // server
  app.use(helmet())
  app.use(express.static(path.join(__dirname, './../client')))
  app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, '/index.html'))
  })

  // start
  http.listen(config.server.port)

  // sockets
  sockets()
}

// read arguments from cli
function processArguments () {
  var args = process.argv.splice(2)
  for (var i = 0; i < args.length; i++) {
    var arg = args[i]
    if (arg === '-prod') {
      config.prod()
    }
    if (arg === '-slack') {
      worker.scrape(true, function () {
        process.exit()
      })
    }
    if (arg === '-schedule') {
      worker.schedule(function () {
        process.exit()
      })
    }
  }
}

// handle server to web connection
function sockets () {
  // browser connect
  io.on('connection', function (socket) {
    // listeners
    socket.on('pageLoad', function (callback) {
      worker.scrape(false, function (data) {
        callback(data.html)
      })
    })
    socket.on('toggleAgent', function (agent, callback) {
      worker.toggleAgent(agent, function (success) {
        worker.scrape(true, function (data) {
          callback(data.html)
        })
      })
    })
    socket.on('toggleSchedule', function (agent) {
      worker.toggleSchedule(agent)
    })
  })
}
