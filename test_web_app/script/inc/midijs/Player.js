/*
	-------------------------------------
	MIDI.Player : 0.3
	-------------------------------------
	https://github.com/mudcube/MIDI.js
	-------------------------------------
	#jasmid
	-------------------------------------
*/

if (typeof (MIDI) === "undefined") var MIDI = {};
if (typeof (MIDI.Player) === "undefined") MIDI.Player = {};

(function() { "use strict";

var root = MIDI.Player;
root.callback = undefined; // your custom callback goes here!
root.currentTime = 0;
root.endTime = 0; 
root.restart = 0; 
root.playing = false;
root.timeWarp = 1;
root.repeat = true;
root.songs = {};

//
root.start =
root.resume = function () {
	if (root.currentTime < -1) root.currentTime = -1;
	startAudio(root.currentTime);
};

root.pause = function () {
	var tmp = root.restart;
	stopAudio();
	root.restart = tmp;
};

root.resetData = function () {
	root.restart = 0;
	root.currentTime = 0;
	root.data = root.original_data;
	root.isScheduleOver = false; 
	root.lastEventProcessed = 0;
}
root.changeSong = function(songUrl) {
	root.stop();
	root.loadFile(songUrl);
	/* TODO: preload songs
	if (typeof(root.songs[songName]) != "undefined"){
		root.stop();
		root.data = root.songs[songName];
		root.data_original = root.songs[songName];
	}
	*/

}
root.stop = function () {
	stopAudio();
	root.resetData();
};

root.addListener = function(callback) {
	onMidiEvent = callback;
};

root.removeListener = function() {
	onMidiEvent = undefined;
};
root.onAllProcessed = function () { }; // callback when all events where processed
root.onLastNotePlayed = function () { };
root.clearAnimation = function() {
	if (root.interval)  {
		window.clearInterval(root.interval);
	}
};

root.setAnimation = function(config) {
	var callback = (typeof(config) === "function") ? config : config.callback;
	var interval = config.interval || 30;
	var currentTime = 0;
	var tOurTime = 0;
	var tTheirTime = 0;
	//
	root.clearAnimation();
	root.interval = window.setInterval(function () {
		if (root.endTime === 0) return;
		if (root.playing) {
			currentTime = (tTheirTime === root.currentTime) ? tOurTime - (new Date).getTime() : 0;
			if (root.currentTime === 0) {
				currentTime = 0;
			} else {
				currentTime = root.currentTime - currentTime;
			}
			if (tTheirTime !== root.currentTime) {
				tOurTime = (new Date).getTime();
				tTheirTime = root.currentTime;
			}
		} else { // paused
			currentTime = root.currentTime;
		}
		var endTime = root.endTime;
		var percent = currentTime / endTime;
		var total = currentTime / 1000;
		var minutes = total / 60;
		var seconds = total - (minutes * 60);
		var t1 = minutes * 60 + seconds;
		var t2 = (endTime / 1000);
		if (t2 - t1 < -1) return;
		callback({
			now: t1,
			end: t2,
			events: noteRegistrar
		});
	}, interval);
};

// helpers

root.loadMidiFile = function(data) { // reads midi into javascript array of events
	if (typeof(data) == "undefined") {
		root.replayer = new Replayer(MidiFile(root.currentData), root.timeWarp);
		root.data = root.replayer.getData();
		root.data_original = root.data;

		root.endTime = getLength();
	} 
	/*  TODO: preload songs
	else {
		root.replayer = new Replayer(data, root.timeWarp);
		return root.replayer.getData();
	}
	*/
};

root.loadFile = function (file, songName, callback) {
	root.stop();
	if (file.indexOf("base64,") !== -1) {
		var data = window.atob(file.split(",")[1]);
		root.currentData = data;
		root.loadMidiFile();
		if (callback) callback(data);
		return;
	}
	///
	var fetch = new XMLHttpRequest();
	fetch.open('GET', file);
	if (fetch.overrideMimeType) fetch.overrideMimeType("text/plain; charset=x-user-defined"); // this function does not exist in IE 
	fetch.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			var t = this.responseText || "";
			var ff = [];
			var mx = t.length;
			var scc = String.fromCharCode;
			for (var z = 0; z < mx; z++) {
				ff[z] = scc(t.charCodeAt(z) & 255);
			}
			var data = ff.join("");
			root.currentData = data;
			/* TODO: preload songs
			if( typeof(songName) != "undefined" ) {
				root.songs[songName] = root.loadMidiFile(data);
			}
			*/
			root.loadMidiFile();
			if (callback) callback(data);
		}
	};
	fetch.send();
};

// Playing the audio

var eventQueue = []; // hold events to be triggered
var queuedTime; // 
var startTime = 0; // to measure time elapse
var noteRegistrar = {}; // get event for requested note
var onMidiEvent = undefined; // listener callback
var scheduleTracking = function (channel, note, currentTime, offset, message, velocity, event_id) {
	// console.log("Scheduletracking, note", note);
	var event_id_in = event_id;
	var interval = window.setTimeout(function () {
		var data = {
			channel: channel,
			note: note,
			now: currentTime,
			end: root.endTime,
			message: message,
			velocity: velocity
		};
		//
		if (message === 128) {
			delete noteRegistrar[note];
		} else {
			noteRegistrar[note] = data;
		}
		if (onMidiEvent) {
			// TODO: count already processed notes
			onMidiEvent(data);
		}
		
		if (root.isScheduleOver ) { // callback when all events where processed
			root.onAllProcessed();
		}
		
		root.currentTime = currentTime;
		if (root.currentTime === queuedTime && root.isScheduleOver == false ){ // queuedTime < root.endTime) { // grab next sequence // TODO: replace endtime with a counter of already processed notes and notes overall
			startAudio(queuedTime, true);
		} 
		if (root.isScheduleOver && root.lastNoteOnEventId == event_id_in) {
			// console.log("last note played! Stop the whole thing and reset");
			// call callback
			
			root.onLastNotePlayed();
			root.stop(); 
			if (root.repeat) {
				root.start();
			}
		}
	}, currentTime - offset);
	return interval;
};

var getContext = function() {
	if (MIDI.lang === 'WebAudioAPI') {
		return MIDI.Player.ctx;
	} else if (!root.ctx) {
		root.ctx = { currentTime: 0 };
	}
	return root.ctx;
};

var getLength = function() {
	var data =  root.data;
	var length = data.length;
	var totalTime = 0.5;
	for (var n = 0; n < length; n++) {
		totalTime += data[n][1];
	}
	return totalTime;
};

root.dynSoundManager = null;
root.setDynSoundManager = function (manager) {
	root.dynSoundManager = manager;
}

// TODO: move to plugin, I'm just lazy 
var testNoteOn = function (channel, note, velocity, delay, duration) {
	var note_in = note;
	var duration_in = duration;
	return	window.setTimeout(function () {  
								if (root.dynSoundManager != null) {
									var instrumentName = root.dynSoundManager.channelInstruments[channel]; 
									if (typeof(instrumentName) != "undefined") {
										if (typeof(root.dynSoundManager.channelVolumes[channel]) == "number") {
											root.dynSoundManager.play(instrumentName, ""+note_in, (velocity/127)*root.dynSoundManager.channelVolumes[channel], duration_in); // TODO: add channel volume
										} else {
											root.dynSoundManager.play(instrumentName, ""+note_in, velocity/127, duration_in); // TODO: add channel volume
										}
									}
								}
								// console.log("play with setTimeout note", note_in);
								}, delay*1000)
	};

// dynamic tempo change
root.timeStretch = 1;
root.trueTempo = true; // if true, play the song as given in midi file and all the tempo changes. if false: 1 beat per second (if timeStretch 1)
root.nr_of_notes_to_process = 20; // TODO: why only 100 is ok? // remove TODO
root.isScheduleOver = false; // gets true when last event gets scheduled
root.lastEventProcessed = 0; // holds id of last processed event (with function startAudio


// NOTE: the name of this function is kind of misleading. only the next couple of noteOn events are grabbed. Again and again
var startAudio = function (currentTime, fromCache) {
	if (!root.replayer) return;
	if (!fromCache) {
		if (typeof (currentTime) === "undefined") currentTime = root.restart;
		if (root.playing) stopAudio();
		root.playing = true;
		root.data = root.replayer.getData();
		root.endTime = getLength();
	}
	var note;
	var duration;
	var offset = 0;
	var messages = 0;
	var data = root.data;	
	var ctx = getContext();
	var length = data.length;
	//
	queuedTime = 0.5;
	startTime = ctx.currentTime;
	
	// console.log("calculating next", root.nr_of_notes_to_process, "notes");
	// console.log("length", length);
	for (var n = root.lastEventProcessed; n < length && messages < root.nr_of_notes_to_process; n++) {
	
		if ( data[root.lastEventProcessed][5] != undefined ) {
			queuedTime = data[root.lastEventProcessed][5];  // TODO: look at this. will data[root.lastEventProcessed][4] be added twice to queuedTime ?
		}
		if (n == length -1) {
			root.isScheduleOver = true;
			// console.log ( "!!!!!!!!!!!!!!!!!¨last note gets scheduled !!!!");
		}
	
		if (root.trueTempo) {
			if ( data[n][4] == undefined ) { data[n][4] = data[n][1] * root.timeStretch } ; // save how it actually was played
			queuedTime += data[n][4];
			data[n][5] = queuedTime;
			duration = data[n][7];
		} else {
			// standarized tempo (ignores setTempo events of piece
			if ( data[n][4] == undefined ) { data[n][4] = data[n][2] * root.timeStretch } ; // save how it actually was played
			queuedTime += data[n][4];
			data[n][5] = queuedTime;
			duration = data[n][8];
		}
		
		var skip_note = false;
		if (queuedTime < currentTime ) {
			offset = queuedTime;
			// console.log("already played");
			skip_note = true;
		}
		
		// also skip if has already played
		if (data[n][3] != undefined) {
			offset = queuedTime;
			// console.log("######### marked as already played, skip this");
			skip_note = true;
		}
		
		root.lastEventProcessed = n;
		if (skip_note) {
			continue;
		}
		
		// mark as already played
		data[n][3] = true;
		currentTime = queuedTime - offset;
		var event = data[n][0].event;
		if (event.type !== "channel") continue;
		var channel = event.channel;
		switch (event.subtype) {
			case 'noteOn':
				root.lastNoteOnEventId = n;

				if (MIDI.channels[channel].mute) break; // TODO: for DynSoundManager
				note = event.noteNumber - (root.MIDIOffset || 0);
				// console.log("note before push", note);
				/*
				if ( n % 20 == 0) { // ((currentTime / 1000 + ctx.currentTime)*1000) != (queuedTime - offset)) {
					console.log("note play time from now", (currentTime / 1000 + ctx.currentTime)*1000, " VS ", queuedTime - offset, ((currentTime / 1000 + ctx.currentTime)*1000) == (queuedTime - offset));
				}
				*/
				eventQueue.push({
					event: event,
					source:  testNoteOn(channel, event.noteNumber, event.velocity, currentTime / 1000 + ctx.currentTime, duration),
							
					// MIDI.noteOn(channel, event.noteNumber, event.velocity, currentTime / 1000 + ctx.currentTime),
					interval: scheduleTracking(channel, note, queuedTime, offset, 144, event.velocity, root.lastNoteOnEventId)
				});
				messages ++;
				break;
			/*
			case 'noteOff':
				if (MIDI.channels[channel].mute) break;
				note = event.noteNumber - (root.MIDIOffset || 0);
				eventQueue.push({
					event: event,
					source: setTimeout(function () {  
								// mysoundManager.play("harp", ""+note) // TODO: stop, and naturally move to plugin.js
								// console.log("play note ", event.noteNumber);
								}, (currentTime / 1000 + ctx.currentTime)*1000 ),
					// MIDI.noteOff(channel, event.noteNumber, currentTime / 1000 + ctx.currentTime),
					interval: scheduleTracking(channel, note, queuedTime, offset, 128)
				});
				break;
			*/
			default:
				break;
		}
	}
};

var stopAudio = function () {
	var ctx = getContext();
	root.playing = false;
	root.restart += (ctx.currentTime - startTime) * 1000;
	// stop the audio, and intervals
	while (eventQueue.length) {
		var o = eventQueue.pop();
		window.clearInterval(o.interval);
		if (!o.source) continue; // is not webaudio
		if (typeof(o.source) === "number") {
			window.clearTimeout(o.source);
		} else { // webaudio
			var source = o.source;
			source.disconnect(0);
			source.noteOff(0);
		}
	}
	// run callback to cancel any notes still playing
	for (var key in noteRegistrar) {
		var o = noteRegistrar[key]
		if (noteRegistrar[key].message === 144 && onMidiEvent) {
			onMidiEvent({
				channel: o.channel,
				note: o.note,
				now: o.now,
				end: o.end,
				message: 128,
				velocity: o.velocity
			});
		}
	}
	// reset noteRegistrar
	noteRegistrar = {};
	

};

})();