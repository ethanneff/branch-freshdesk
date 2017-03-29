/* global io */
/* eslint-disable no-unused-vars */

// cache DOM
var agents = document.getElementById('agents')
var loader = document.getElementById('loader')

// listeners
io().on('renderAgents', function (data) {
  agents.innerHTML = data
  loader.style.display = 'none'
})

// notifications
function scheduleAgent (e) {
  var id = e.attributes['data-id'].value
  var day = e.value
  var activated = toggleButton(e, true)
  io().emit('toggleSchedule', {
    id: id,
    day: day,
    activated: activated
  })
}

function toggleAgent (e) {
  var id = e.attributes['data-id'].value
  var activated = toggleButton(e, false)
  loader.style.display = 'block'
  io().emit('toggleAgent', {
    id: id,
    activated: activated
  }, function (data) {
    agents.innerHTML = data
    loader.style.display = 'none'
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
