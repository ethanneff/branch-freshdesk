// lib
var request = require('request')
var fs = require('fs')
var server = require('./app.js')

// properties
var AGENTS_FILE = './src/server/.available-agents'
var SCHEDULE_FILE = './src/server/.schedule-agents'
var FRESHDESK_USER = 'eneff@branch.io'
var FRESHDESK_PASS = 'JRxp6102'

// entry
module.exports = {
  scrape: scrape,
  toggle: toggle,
  schedule: schedule
}

// public
function scrape (callback) {
  scrapeAgents(function (response) {
    var agentsJson = generateAgents(response)
    var scheduleJson = generateSchedule(agentsJson)
    var htmlContent = generateHtml(agentsJson)
    var slackMessage = generateSlack(agentsJson)

    isActiveDifferent(agentsJson) && messageSlack(slackMessage)
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agentsJson), 'utf8')
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(scheduleJson), 'utf8')

    // callback
    callback({
      agents: agentsJson,
      schedule: scheduleJson,
      html: htmlContent,
      slack: slackMessage
    })
  })
}

function schedule (callback) {

}

function toggle (callback) {

}

// methods
function scrapeAgents (callback) {
  var options = {
    url: 'https://support.branch.io/helpdesk/dashboard/agent_status#ticket-assignment',
    auth: {
      'user': FRESHDESK_USER,
      'pass': FRESHDESK_PASS
    }
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(body)
    } else {
      throw new Error(body)
    }
  })
}

function isActiveDifferent (agents) {
  var currents
  try {
    currents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'))
  } catch (e) {
    return false // no file
  }

  if (currents.length === 0) {
    return false // no different first run
  }
  if (currents.length !== agents.length) {
    return true // different lengths
  }

  for (var i = 0; i < currents.length; i++) {
    var current = currents[i]
    if (agents.indexOf(current) === -1) {
      return true // different agents
    }
  }

  return false // no different
}

function messageSlack (message, callback) {
  var options = {
    method: 'POST',
    url: 'https://hooks.slack.com/services/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',
    body: message
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      if (callback) callback(body)
    } else {
      throw new Error(body)
    }
  })
}

function generateAgents (response) {
  var nameStart = '<span href="#">'
  var nameFinish = '</span>'
  var timeStart = '<span class="active_since muted">'
  var timeFinish = '</span>'
  var availableStart = 'data-availability="'
  var availableFinish = '"'
  var idStart = 'data-id="'
  var idFinish = '"'
  var agents = []
  var location = 0
  while (true) {
    var nsi = response.indexOf(nameStart, location + 1)
    var nfi = response.indexOf(nameFinish, nsi + nameStart.length + 1)
    var n = response.substr(nsi + nameStart.length, nfi - nsi - nameStart.length)
    if (nsi === -1) {
      break
    }

    var tsi = response.indexOf(timeStart, nfi + 1)
    var tfi = response.indexOf(timeFinish, tsi + timeStart.length + 1)
    var t = response.substr(tsi + timeStart.length, tfi - tsi - timeStart.length)

    var asi = response.indexOf(availableStart, tfi + 1)
    var afi = response.indexOf(availableFinish, asi + availableStart.length + 1)
    var a = response.substr(asi + availableStart.length, afi - asi - availableStart.length)
    a = (a === 'true')

    var isi = response.indexOf(idStart, afi + 1)
    var ifi = response.indexOf(idFinish, isi + idStart.length + 1)
    var i = response.substr(isi + idStart.length, ifi - isi - idStart.length)
    i = parseInt(i) || Date.now()

    agents.push({
      id: i,
      name: n,
      time: t,
      available: a
    })
    location = nfi
  }

  return agents
}

function generateSchedule (agents) {
  return agents
}

function generateHtml (agents) {
  var output = ''
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i]
    var active = agent.available ? 'btn-success' : 'btn-default'
    output += '' +
    '<li class="list-group-item">' +
    '<div class="row text-center">' +
    '<div class="col-sm-6 text-justify-sm">' + agent.name + '</div>' +
    '<div class="col-sm-6">' +
    '<div class="btn-group-xs text-right-sm" role="group">' +
    '<button type="button" class="btn ' + active + '" data-id="' + agent.id + '" onclick="toggleAgent(this)"><i class="fa fa-check" aria-hidden="true"></i></button>' +
    '<span>&nbsp;</span>' +
    '<button type="button" class="btn btn-default" data-id="' + agent.id + '" onclick="scheduleAgent(this)" value="M">M</button>' +
    '<button type="button" class="btn btn-default" data-id="' + agent.id + '" onclick="scheduleAgent(this)" value="T">T</button>' +
    '<button type="button" class="btn btn-default" data-id="' + agent.id + '" onclick="scheduleAgent(this)" value="W">W</button>' +
    '<button type="button" class="btn btn-default" data-id="' + agent.id + '" onclick="scheduleAgent(this)" value="H">H</button>' +
    '<button type="button" class="btn btn-default" data-id="' + agent.id + '" onclick="scheduleAgent(this)" value="F">F</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</li>'
  }
  return output
}

function generateSlack (agents) {
  var username = 'TimBOT'
  var attachments = [{
    'title': 'Active agents',
    'color': '#1cadce',
    'fields': []
  }]

  var value = ''
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i]
    if (agent.available) {
      value += '\n' + agent.name
    }
  }
  attachments[0].fields.push({'value': value})

  var body = {
    'channel': server.testmode ? '#eneff_test' : '#integration-eng-core',
    'username': username,
    'attachments': attachments,
    'icon_emoji': ':tim:'
  }

  return JSON.stringify(body)
}
