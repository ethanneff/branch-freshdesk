// lib
var path = require('path')
var http = require('http')
var express = require('express')
var socketio = require('socket.io')
var clock = require('./clock.js')
var worker = require('./worker.js')

// properties
var app = express()
var client

// entry
module.exports = run()

function run () {
  console.log('run app')
  setupServer()
  setupSocket()
  runWebService()
}

// methods
function setupServer () {
  app.use(express.static(path.join(__dirname, './../../bower_components')))
  app.set('views', path.join(__dirname, './../client'))
  app.set('view engine', 'ejs')
  app.get('/', function (request, response) {
    response.render('index')
  })
}

function setupSocket () {
  var server = http.createServer(app)
  var io = socketio.listen(server)
  server.listen(process.env.PORT || 5000)
  io.sockets.on('connection', function (socket) {
    console.log('connected socket')
    console.log(worker.currentAgents)
    client = socket
  })
}

function runWebService () {
  clock()
}

// exports
exports.pub = function (event, data) {
  if (client) client.emit(event, data)
}

exports.sub = function (event, func) {
  if (client) {
    client.on(event, function (data) {
      func(data)
    })
  }
}
