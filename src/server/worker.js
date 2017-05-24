// lib
var request = require('request')
var fs = require('fs')
var config = require('./config')

// properties
var AGENTS_FILE = './src/server/.available-agents'
var SCHEDULE_FILE = './src/server/.scheduled-agents'

// entry
module.exports = {
  scrape: scrape,
  schedule: schedule,
  toggleAgent: toggleAgent,
  toggleSchedule: toggleSchedule
}

// from cron or pageload: scrapes freshdesk, saves data, outputs to slack
function scrape (slackSend, callback) {
  scrapeAgents(function (response) {
    // process
    var agentsJson = generateAgents(response)
    var activeAgents = generateCurrentAgents(agentsJson)
    var htmlContent = generateHtml(agentsJson)
    var slackMessage = generateSlack(agentsJson)
    var send = slackSend && isActiveDifferent(agentsJson)

    // slack
    messageSlack(send, slackMessage, function (response) {
      // save
      fs.writeFileSync(AGENTS_FILE, JSON.stringify(agentsJson, null, 2), 'utf8')

      // callback
      callback({
        agents: agentsJson,
        active: activeAgents,
        html: htmlContent,
        slack: slackMessage
      })
    })
  })
}

// from cron: dequeues and requeues agents to freshdesh, outputs to slack
function schedule (callback) {
  // tomorrow
  var tomorrow = new Date().getDay() + 1
  tomorrow = (tomorrow === 6) ? 1 : tomorrow

  // early exit
  if (tomorrow < 1 || tomorrow > 5) {
    return callback()
  }

  // grab data
  scrape(false, function (data) {
    var prev = data.active
    var schedule = readSchedule()
    var scheduled = schedule[tomorrow]
    var next = []
    for (var agent in scheduled) {
      next.push(agent)
    }

    // disable all
    toggleAgents(prev, function () {
      // enable today
      toggleAgents(next, function () {
        // message slack
        scrape(true, function () {
          callback()
        })
      })
    })
  })
}

// from schedule: group activate or deactivate agent from freshdesk
function toggleAgents (agents, callback) {
  if (agents.length === 0) {
    return callback()
  }
  var id = agents.pop()
  var agent = {
    id: id,
    activated: true
  }
  toggleAgent(agent, function () {
    toggleAgents(agents, callback)
  })
}

// from web: activate or deactivate agent from freshdesk
function toggleAgent (agent, callback) {
  var options = {
    method: 'POST',
    url: 'https://support.branch.io/agents/' + agent.id + '/toggle_availability?admin=true',
    body: 'value=' + agent.activated + '&id=' + agent.id,
    auth: {
      'user': config.freshdesk.user,
      'pass': config.freshdesk.pass
    }
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      callback()
    } else {
      throw new Error(body)
    }
  })
}

// from web, save scheduled data
function toggleSchedule (agent) {
  var schedule = readSchedule()

  if (agent.activated) {
    schedule[agent.day][agent.id] = true
  } else {
    delete schedule[agent.day][agent.id]
  }

  return fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2), 'utf8')
}

// get schedule file
function readSchedule () {
  var schedule
  try {
    schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'))
  } catch (e) {
    schedule = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }
  }
  return schedule
}

// determines active agents
function generateCurrentAgents (agents) {
  var current = []
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i]
    if (agent.available) {
      current.push(agent.id)
    }
  }

  return current
}

// scrape freshdesk for html
function scrapeAgents (callback) {
  var options = {
    url: 'https://support.branch.io/helpdesk/dashboard/agent_status#ticket-assignment',
    auth: {
      'user': config.freshdesk.user,
      'pass': config.freshdesk.pass
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

// determines if file agent json is different scrape agent json
function isActiveDifferent (currentAgents) {
  var previousAgents
  try {
    previousAgents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'))
  } catch (e) {
    return false // no file
  }

  // comparison of json to json
  var i
  var previousAgent
  var currentAgent
  var previousAgentsArray = []
  for (i = 0; i < previousAgents.length; i++) {
    previousAgent = previousAgents[i]
    if (previousAgent.available) {
      previousAgentsArray.push(previousAgent)
    }
  }
  var currentAgentsArray = []
  for (i = 0; i < currentAgents.length; i++) {
    currentAgent = currentAgents[i]
    if (currentAgent.available) {
      currentAgentsArray.push(currentAgent)
    }
  }
  if (previousAgentsArray.length !== currentAgentsArray.length) {
    return true
  }
  while (previousAgentsArray.length > 0) {
    previousAgent = previousAgentsArray.pop()
    var found = false
    for (i = 0; i < currentAgentsArray.length; i++) {
      currentAgent = currentAgentsArray[i]
      if (previousAgent.id === currentAgent.id) {
        found = true
        break
      }
    }
    if (!found) {
      return true
    }
  }

  // no difference
  return false
}

// sends a message to slack
function messageSlack (send, message, callback) {
  if (!send) {
    return callback()
  }

  var options = {
    method: 'POST',
    url: 'https://hooks.slack.com/services' + config.slack.user,
    body: message
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(body)
    } else {
      throw new Error(body)
    }
  })
}

// transform html to json of agents
function generateAgents (response) {
  var availableStart = '<tr data-id="'
  var availableFinish = '"'
  var idStart = 'data-id="'
  var idFinish = '"'
  var nameStart = '<span href="#">'
  var nameFinish = '</span>'
  var timeStart = '<span class="active_since muted">'
  var timeFinish = '</span>'
  var agents = []

  var location = 0
  while (true) {
    var asi = response.indexOf(availableStart, location + 1)
    var afi = response.indexOf(availableFinish, asi + availableStart.length + 1)
    var a = response.substr(asi + availableStart.length, afi - asi - availableStart.length)

    var isi = response.indexOf(idStart, afi + 1)
    var ifi = response.indexOf(idFinish, isi + idStart.length + 1)
    var i = response.substr(isi + idStart.length, ifi - isi - idStart.length)

    var nsi = response.indexOf(nameStart, ifi + 1)
    var nfi = response.indexOf(nameFinish, nsi + nameStart.length + 1)
    var n = response.substr(nsi + nameStart.length, nfi - nsi - nameStart.length)

    var tsi = response.indexOf(timeStart, nfi + 1)
    var tfi = response.indexOf(timeFinish, tsi + timeStart.length + 1)
    var t = response.substr(tsi + timeStart.length, tfi - tsi - timeStart.length)

    if (asi === -1) {
      break
    }

    agents.push({
      id: parseInt(i),
      name: n,
      time: t,
      available: (a === 'available')
    })
    location = tfi
  }

  return agents
}

// transform json of agent to html
function generateHtml (agents) {
  var schedule = readSchedule()

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
    '<button type="button" class="btn ' + scheduledHtmlButton(schedule, agent.id, '1') + '" data-id="' + agent.id + '" onclick="toggleSchedule(this)" value="1">M</button>' +
    '<button type="button" class="btn ' + scheduledHtmlButton(schedule, agent.id, '2') + '" data-id="' + agent.id + '" onclick="toggleSchedule(this)" value="2">T</button>' +
    '<button type="button" class="btn ' + scheduledHtmlButton(schedule, agent.id, '3') + '" data-id="' + agent.id + '" onclick="toggleSchedule(this)" value="3">W</button>' +
    '<button type="button" class="btn ' + scheduledHtmlButton(schedule, agent.id, '4') + '" data-id="' + agent.id + '" onclick="toggleSchedule(this)" value="4">H</button>' +
    '<button type="button" class="btn ' + scheduledHtmlButton(schedule, agent.id, '5') + '" data-id="' + agent.id + '" onclick="toggleSchedule(this)" value="5">F</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</li>'
  }
  return output
}

// helper for generateHtml for button class
function scheduledHtmlButton (schedule, id, day) {
  return (schedule[day].hasOwnProperty(id)) ? 'btn-info' : 'btn-default'
}

// generates the message for slack
function generateSlack (agents) {
  var username = 'TimBOT'
  var attachments = [{
    'author_name': 'Active Freshdesk Agents',
    'author_icon': 'http://i.imgur.com/9bm3oH5.jpg',
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
    'channel': config.slack.channel,
    'username': username,
    'attachments': attachments,
    'icon_emoji': ':tim:'
  }

  return JSON.stringify(body)
}
