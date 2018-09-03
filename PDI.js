"use strict";
var events = require("events");
//var events = require("stream").Duplex;

function notImplemented() {
	throw "notImplemented";
}

function PlayerDeviceInterface() {
	var self = this;
	console.log('Initialising Player...');
	events.call(this, {
		objectMode: true,
		allowHalfOpen: false
	});
	this.resetMediaStatus();
	PlayerDeviceInterface.mediaProps.map(function(prop) {
		Object.defineProperty(self, prop, {
			get: function() { return self.mediaStatus[prop]; },
			set: self.setProperty.bind(self, prop)
		});
	});
}

PlayerDeviceInterface.prototype = Object.create(events.prototype);

// Static stuff
PlayerDeviceInterface.states = {
	NothingSpecial: 0,
	Opening: 1,
	Buffering: 2,
	Playing: 3,
	Paused: 4,
	Stopped: 5,
	Ended: 6,
	Error: 7
};
PlayerDeviceInterface.mediaProps = ['audio', 'audioTrack', 'volume', 'time', 'paused', 'state', 'length', 'mediaSessionId', 'subtitlesSrc', 'subtitlesDelay', 'subtitlesSize'];

PlayerDeviceInterface.eventsMap = {
	'time': "timeupdate",
	'volume': "volumechanged"
};

PlayerDeviceInterface.syncData = function syncData(target, update) {
	var changes = {};
	if(!target || !update || target === update) {
		return changes;
	}
	PlayerDeviceInterface.mediaProps.map(function(key) {
		if(update.hasOwnProperty(key) && target[key] != update[key]) {
			changes[key] = update[key];
			target[key] = update[key];
		}
	});
	return changes;
};

// Instance members
PlayerDeviceInterface.prototype.playerUIRoles = ["playpause", "seek", "dub", "subtitles", "volume"];
PlayerDeviceInterface.prototype.initialized = false;
PlayerDeviceInterface.prototype.embedded = false;
PlayerDeviceInterface.prototype.usePlayerUI = false;
PlayerDeviceInterface.prototype.onlyHtml5Formats = false;
PlayerDeviceInterface.prototype.attach = notImplemented;
PlayerDeviceInterface.prototype.detach = notImplemented;
PlayerDeviceInterface.prototype.play = notImplemented;
PlayerDeviceInterface.prototype.stop = notImplemented;
PlayerDeviceInterface.prototype.setMediaStatus = function (prop, val) {
	if(typeof this.mediaStatus[prop] == "undefined") {
		console.log("Unsupported property");
		return;
	}
	var changed = {};
	changed[prop] = val;
	this.mediaStatus[prop] = val;
	this.emitProperEvent(changed);
};
PlayerDeviceInterface.prototype.resetMediaStatus = function () {
	this.mediaStatus = {
		'audio': [],
		'subtitles': [],
		'audioTrack': 0,
		'volume': 1,
		'time': 0,
		'paused': false,
		'state': PlayerDeviceInterface.states.NothingSpecial,
		'length': 0,
		'source': null,
		'subtitlesSrc': null,
		'subtitlesSelected': null,
		'subtitlesDelay': 0,
		'subtitlesSize': 2
	};
};
PlayerDeviceInterface.prototype.setProperty = function (prop, val) {
	var oldVal = this.mediaStatus[prop];
	this.setMediaStatus(prop, val);
	this.emit('propertychanged', prop, val, oldVal);
};
PlayerDeviceInterface.prototype.emitProperEvent = function emitProperEvent(data) {
	var events = {};
	var event;
	for(event in data) events[PlayerDeviceInterface.eventsMap[event] || "statechanged"] = true;
	for(event in events) this.emit(event, this.mediaStatus);
};

module.exports = PlayerDeviceInterface;

