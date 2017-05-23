/* global io */
/* eslint-disable no-unused-vars */

// properties
var token = ''

// cache DOM
var agents = document.getElementById('agents')
var main = document.getElementById('main')
var auth = document.getElementById('auth')
var load = document.getElementById('load')
var user = document.getElementById('user')
var pass = document.getElementById('pass')

// update DOM
renderLogin(true)
function renderLogin (show) {
  main.style.display = show ? 'none' : 'block'
  load.style.display = show ? 'none' : 'block'
  auth.style.display = show ? 'block' : 'none'
}

function renderAgents (data) {
  agents.innerHTML = data
  load.style.display = 'none'
}

// handle events
function tapLogin (e) {
  var data = JSON.stringify({user: user.value, pass: pass.value})
  var xhr = new window.XMLHttpRequest()
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        token = xhr.response
        successLogin()
      } else {
        window.alert(xhr.response)
      }
    }
  }
  xhr.open('POST', '/login')
  xhr.setRequestHeader('content-type', 'application/json')
  xhr.send(data)
}

function successLogin () {
  renderLogin(false)
  io().emit('loadAgents', {
    token: token
  }, function (data) {
    renderAgents(data)
  })
}

function toggleSchedule (e) {
  var id = e.attributes['data-id'].value
  var day = e.value
  var activated = toggleButton(e, true)

  io().emit('toggleSchedule', {
    token: token,
    id: id,
    day: day,
    activated: activated
  })
}

function toggleAgent (e) {
  var id = e.attributes['data-id'].value
  var activated = toggleButton(e, false)
  load.style.display = 'block'

  io().emit('toggleAgent', {
    token: token,
    id: id,
    activated: activated
  }, function (data) {
    renderAgents(data)
  })
}

function toggleButton (e, isSchedule) {
  var primary = (isSchedule) ? 'btn-info' : 'btn-success'
  var secondary = 'btn-default'
  if (e.classList.contains(primary)) {
    e.classList.remove(primary)
    e.classList.add(secondary)
    return false
  }
  e.classList.remove(secondary)
  e.classList.add(primary)
  return true
}
