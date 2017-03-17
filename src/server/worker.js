// lib
var request = require('request')
var app = require('./app.js')

// properties
var currentAgents = []

// entry
module.exports = {
  run: run
}

function run () {
  scrapeFreshDesk(function (res) {
    var agents = getAgents(res)
    var change = isAgentsDifferent(agents)

    if (change) {
      var message = getMessage(agents)
      messageSlack(message)
    }

    updateHtml(agents)
    currentAgents = agents
  })
}

// methods
function scrapeFreshDesk (callback) {
  var link = 'https://support.branch.io/helpdesk/dashboard/agent_status#ticket-assignment'
  var user = 'eneff@branch.io'
  var pass = 'JRxp6102'

  var options = {
    url: link,
    auth: {
      'user': user,
      'pass': pass
    }
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(body)
    } else {
      console.error('could not scrape freshdesk')
    }
  })
}

function getAgents (res) {
  var available = 'data-id="available"'
  var start = '<span href="#">'
  var finish = '</span>'
  var agents = []

  var nextAvailableAgent = 0
  while (true) {
    nextAvailableAgent = res.indexOf(available, nextAvailableAgent + 1)
    if (nextAvailableAgent === -1) {
      break
    }

    var agentStart = res.indexOf(start, nextAvailableAgent)
    var agentFinish = res.indexOf(finish, nextAvailableAgent)
    var agent = res.substr(agentStart + start.length, agentFinish - agentStart - start.length)
    agents.push(agent)
  }

  return agents
}

function getMessage (agents) {
  var username = 'TimBOT'
  var attachments = [{
    'title': 'Active agents',
    'color': '#1cadce',
    'fields': []
  }]
  var value = ''
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i]
    value += '\n' + agent
  }
  attachments[0].fields.push({'value': value})

  var body = {
    'channel': '#integration-eng-core',
    'username': username,
    'attachments': attachments,
    'icon_emoji': ':tim:'
  }

  return JSON.stringify(body)
}

function isAgentsDifferent (agents) {
  if (currentAgents.length === 0) {
    return false // no different first run
  }
  if (currentAgents.length !== agents.length) {
    return true // different lengths
  }

  for (var i = 0; i < currentAgents.length; i++) {
    var agent = currentAgents[i]
    if (agents.indexOf(agent) === -1) {
      return true // different agents
    }
  }

  return false // no different
}

function messageSlack (message, callback) {
  var link = 'https://hooks.slack.com/services/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'

  var options = {
    method: 'POST',
    url: link,
    body: message
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      if (callback) callback(body)
    } else {
      console.error('could not send to slack')
    }
  })
}

function updateHtml (agents) {
  var output = ''
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i]
    output += '<pre>' + agent + '</pre>'
  }
  app.pub('ping', output)
}
