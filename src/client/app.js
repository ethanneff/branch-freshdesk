/* global io */
/* eslint-disable no-unused-vars */

// cache DOM
var agents = document.getElementById('agents')
var spinner = document.getElementById('spinner')

// listeners
io().on('renderAgents', function (data) {
  toggleContent(data, true)
})

function toggleContent (content, show) {
  agents.innerHTML = (show) ? content : ''
  spinner.style.display = (show) ? 'none' : 'block'
}

// notifications
function scheduleAgent (e) {
  console.log('scheduleAgent')
  var id = e.attributes['data-id'].value
  var day = e.value
  var activated = toggleButton(e, true)
  io().emit('scheduleAgent', {
    agent: id,
    day: day,
    activated: activated
  })
}

function toggleAgent (e) {
  console.log('toggleAgent')
  var id = e.attributes['data-id'].value
  var activated = toggleButton(e, false)
  io().emit('toggleAgent', {
    agent: id,
    activated: activated
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
