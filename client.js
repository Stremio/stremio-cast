var fetch = typeof (window) !== 'undefined' ? window.fetch : require('node-fetch')
var events = require('events')

var POLL_INTERVAL = 1000
var STATES = { NothingSpecial: 0, Opening: 1, Buffering: 2, Playing: 3, Paused: 4, Stopped: 5, Ended: 6, Error: 7 }
var PROPS = ['audio', 'audioTrack', 'volume', 'time', 'paused', 'state', 'length', 'mediaSessionId', 'subtitlesSrc', 'subtitlesDelay', 'subtitlesSize']

function Client (url) {
  var self = new events.EventEmitter()

  self.initialized = false

  var status = { } // last state received from server
  var modified = { } // properties which we've modified, that have to be pushed to the server

  var timer = null // next sync timer

  PROPS.forEach(function (p) {
    Object.defineProperty(self, p, {
      get: function () { return modified.hasOwnProperty(p) ? modified[p] : status[p] },
      set: function (v) {
        modified[p] = v
        resetTimer(50) // do a sync in 50ms
        if (p === 'volume') self.emit('volumechanged')
      }
    })
  })

  self.play = function (src) { self.source = modified.source = src; resetTimer(50) }
  self.stop = function () { if (! self.source) return; resetTimer(50); self.source = modified.source = null;  }

  function sync () {
    var p = fetch(url, { method: 'POST', body: JSON.stringify(modified), headers: { 'content-type': 'application/json' } })
    modified = { }

    p.then(function (res) { return res.json() })
    .then(function (resp) {
      var prev = status 
      status = resp // server must send back full status
      sendEvs(prev, status) // compare old status vs new and send events if we have to; we must have updated 'status' before doing this
      resetTimer() // trigger sync after POLL_INTERVAL
    })
  }

  function resetTimer (t) {
    clearTimeout(timer)
    timer = self.source ? setTimeout(sync, t || POLL_INTERVAL) : null
  }

  function sendEvs (old, current) {
    if (current.state !== old.state || current.source !== old.source || current.mediaSessionId !== old.mediaSessionId) self.emit('statechanged', { state: current.state })
    if (current.time !== old.time) self.emit('timeupdate', { time: current.time })
  }

  return self
}

module.exports = Client
