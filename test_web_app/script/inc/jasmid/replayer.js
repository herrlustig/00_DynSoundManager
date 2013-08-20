var clone = function (o) {
	if (typeof o != 'object') return (o);
	if (o == null) return (o);
	var ret = (typeof o.length == 'number') ? [] : {};
	for (var key in o) ret[key] = clone(o[key]);
	return ret;
};

function Replayer(midiFile, timeWarp, eventProcessor) {
	var trackStates = [];
	var beatsPerMinute = 60; // TODO: change this back to 120
	var ticksPerBeat = midiFile.header.ticksPerBeat;
	
	for (var i = 0; i < midiFile.tracks.length; i++) {
		trackStates[i] = {
			'nextEventIndex': 0,
			'ticksToNextEvent': (
				midiFile.tracks[i].length ?
					midiFile.tracks[i][0].deltaTime :
					null
			)
		};
	}

	var nextEventInfo;
	var samplesToNextEvent = 0;
	
	function getNextEvent() {
		var ticksToNextEvent = null;
		var nextEventTrack = null;
		var nextEventIndex = null;
		
		for (var i = 0; i < trackStates.length; i++) {
			if (
				trackStates[i].ticksToNextEvent != null
				&& (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)
			) {
				ticksToNextEvent = trackStates[i].ticksToNextEvent;
				nextEventTrack = i;
				nextEventIndex = trackStates[i].nextEventIndex;
			}
		}
		if (nextEventTrack != null) {
			/* consume event from that track */
			var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
			if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
				trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
			} else {
				trackStates[nextEventTrack].ticksToNextEvent = null;
			}
			trackStates[nextEventTrack].nextEventIndex += 1;
			/* advance timings on all tracks by ticksToNextEvent */
			for (var i = 0; i < trackStates.length; i++) {
				if (trackStates[i].ticksToNextEvent != null) {
					trackStates[i].ticksToNextEvent -= ticksToNextEvent
				}
			}
			return {
				"ticksToEvent": ticksToNextEvent,
				"event": nextEvent,
				"track": nextEventTrack
			}
		} else {
			return null;
		}
	};
	//
	var midiEvent;
	var temporal = [];
	var memoryLastNotes = {};
	var memoryCurrentTimes = {};
	var memoryCurrentTimesStand = {}
	//
	function processEvents() {
		function processNext() {
			if ( midiEvent.event.type == "meta" && midiEvent.event.subtype == "setTempo" ) {
				// tempo change events can occur anywhere in the middle and affect events that follow
				beatsPerMinute = 60000000 / midiEvent.event.microsecondsPerBeat; // TODO: remove again
			}
			
			if (typeof(memoryCurrentTimes[midiEvent.event.channel]) == "undefined") {
				memoryCurrentTimes[midiEvent.event.channel] = 0;
			}
			if (typeof(memoryCurrentTimesStand[midiEvent.event.channel]) == "undefined") {
				memoryCurrentTimes[midiEvent.event.channel] = 0;
			}
			if (typeof(memoryLastNotes[midiEvent.event.channel]) == "undefined") {
				memoryLastNotes[midiEvent.event.channel] = {};
			}
			
			if (midiEvent.ticksToEvent > 0) {
				var beatsToGenerate = midiEvent.ticksToEvent / ticksPerBeat;
				var secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60);
				// NOTE: also save a standarized value (60BPM, one beat per second) which is not affected by setTempo, so processing is possible later
				var secondsToGenerate_standarized = beatsToGenerate / (60 / 60);

			}
			var time = (secondsToGenerate * 1000 * timeWarp) || 0;
			var time_standardized = (secondsToGenerate_standarized * 1000 ) || 0; // TODO: without timeWarp ?

			temporal.push([ midiEvent, time, time_standardized]);
			
			if ( midiEvent.event.type == "channel" && midiEvent.event.subtype == "noteOff" ) {
				var lastNoteOn = memoryLastNotes[midiEvent.event.channel][midiEvent.event.noteNumber];
				temporal[lastNoteOn[0]][7] = memoryCurrentTimes[midiEvent.event.channel] - lastNoteOn[1];
				temporal[lastNoteOn[0]][8] = memoryCurrentTimesStand[midiEvent.event.channel] - lastNoteOn[2];
				

			}
			
			if ( midiEvent.event.type == "channel" && midiEvent.event.subtype == "noteOn" ) {
				memoryLastNotes[midiEvent.event.channel][midiEvent.event.noteNumber] = [temporal.length -1,memoryCurrentTimes[midiEvent.event.channel],memoryCurrentTimesStand[midiEvent.event.channel]];
				memoryCurrentTimes[midiEvent.event.channel] = 0;
				memoryCurrentTimesStand[midiEvent.event.channel] = 0;


			}
			
			memoryCurrentTimes[midiEvent.event.channel] += time;
			memoryCurrentTimesStand[midiEvent.event.channel] += time_standardized;


			
			midiEvent = getNextEvent();
		};
		//
		if (midiEvent = getNextEvent()) {
			while(midiEvent) processNext(true);
		}
	};
	processEvents();
	return {
		"getData": function() {
			return clone(temporal);
		}
	};
};
