// lib
var path = require('path')
var http = require('http')
var express = require('express')
var socket = require('socket.io')

// app
var app = express()

app.set('port', (process.env.PORT || 5000))
app.set('views', path.join(__dirname, './../client'))
app.set('view engine', 'ejs')

app.get('/', function (request, response) {
  response.render('index')
})

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'))
})

// sockets
var server = http.createServer(app)
var io = socket.listen(server)

// export
module.exports = {
  app: app,
  server: server,
  io: io
}
