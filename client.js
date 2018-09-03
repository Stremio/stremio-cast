var fetch = typeof (window) !== 'undefined' ? window.fetch : require('node-fetch')
var Interface = require('./PDI');

var POLL_INTERVAL = 1000

function Client (url, stremio, enginefs) {
  //var self = new events.EventEmitter()

  var self = new Interface(stremio, enginefs);

  self.initialized = false

  self.mediaStatus = { }; // last state received from server
  var modified = { } // properties which we've modified, that have to be pushed to the server

  var timer = null // next sync timer

  self.on('propertychanged', function(prop, val) {
        modified[prop] = val;
        resetTimer(50); // do a sync in 50ms
  });

  self.play = function (libItem) {
	  self.source = modified.source = libItem.stream.url;
	  resetTimer(50);
  };
  self.stop = function () {
	  if (! self.source) return;
	  resetTimer(50);
	  self.source = modified.source = null;
  };

  function sync () {
    var p = fetch(url, { method: 'POST', body: JSON.stringify(modified), headers: { 'content-type': 'application/json' } })
    modified = { }

    p.then(function (res) { return res.json() })
    .then(function (resp) {
      var changed = Interface.syncData(self.mediaStatus, resp);
	  self.emitProperEvent(changed);

      resetTimer() // trigger sync after POLL_INTERVAL
    })
  }

  function resetTimer (t) {
    clearTimeout(timer)
    timer = self.source ? setTimeout(sync, t || POLL_INTERVAL) : null
  }

  return self
}

module.exports = Client
