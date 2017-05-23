// app
var express = require('express')
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var jwt = require('jsonwebtoken')
var parser = require('body-parser')
var error = 'Unauthorized login'

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
  app.use(helmet()) // support security
  app.use(express.static(path.join(__dirname, './../client'))) // client path
  app.use(parser.json()) // support JSON-encoded bodies

  // router
  app.get('/', function (request, response) {
    // index
    response.sendFile(path.join(__dirname, '/index.html'))
  })
  app.post('/login', function (request, response) {
    authenticate(request, response)
  })

  // start
  http.listen(config.server.port)

  // sockets
  sockets()
}

// auth
function authenticate (request, response) {
  var user = String(request.body.user).trim().toLowerCase() || null
  var pass = String(request.body.pass).trim() || null
  if (user === config.server.user && pass === config.server.pass) {
    var token = jwt.sign({ user: user, pass: pass }, config.server.auth, { expiresIn: '1h' })
    response.status(200)
    response.send(token)
  } else {
    response.status(401)
    response.send(error)
  }
}

function authorize (token) {
  try {
    return jwt.verify(token || '', config.server.auth)
  } catch (e) {
    return false
  }
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
    socket.on('loadAgents', function (data, callback) {
      if (!authorize(data.token)) return callback(error)
      worker.scrape(false, function (data) {
        callback(data.html)
      })
    })
    socket.on('toggleAgent', function (data, callback) {
      if (!authorize(data.token)) return callback(error)
      worker.toggleAgent(data, function (success) {
        worker.scrape(true, function (data) {
          callback(data.html)
        })
      })
    })
    socket.on('toggleSchedule', function (data) {
      if (!authorize(data.token)) return
      worker.toggleSchedule(data)
    })
  })
}
