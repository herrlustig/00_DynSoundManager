<h1> Overview </h1>
This is an experimental sound engine & midifile player.
At the moment it just uses flash 10 and is in a early stage of development.
Use it on your on risk ;)

ROUGHLY tested with Firefox 23 and Chrome 28 and IE 10.

In short this library contains three parts:
* DynSoundManager: which is basically a flash sample player wrapped in js.
* MIDI.Player: reads Midi files and feeds the sample player with notes.
* Envelope: Create Envelopes

NOTE: the MIDI.Player does not work in IE! 

<h1> Development </h1>
I wrote this library due to the lack of dynamic soundlibrary for webbrowsers.
	
If there is enough interest, I can make the library more "failsafe" , or even make use of the html5 audio api.
Effects like echo, distortion, flanger etc would also be possible.
	
<h1> Demo </h1>
* <a href="https://tuxli.ch/ld26/00_DynSoundManager/test_web_app/">DEMO Page</a>

<h1> DynSoundManager functionality </h1>
<h3>Loading Sounds</h3>
<pre>
	// loads a sample as c2. 12 represents the corresponding midi note.
	dynsoundManager.load("harp", "12", "audio/harp-c2.mp3");
	// and another one
	dynsoundManager.load("female", "48", "audio/chorus-female-c5.mp3");
</pre>
NOTE: Only MP3 are allowed.
NOTE: I recommend to use low rate mp3s like 32kbit/s at the moment. MP3 with a higher bitrate are possible, but they use much more ram!

<h3>Playing Sounds</h3>
There are two ways to play sounds.

Playing a note once
<pre>
	// play(instrumentId, noteId, volume, durationInMilliseconds)
	dynsoundManager.play("harp", "12", 0.5, 1000)); 
	// the sampler is quite smart. Eventhough theres only a sample loaded for midinote 12 you can do this:
	dynsoundManager.play("harp", "13", 1, 1000)); 
	// in the background the sampler bends the sample for midinote 12 to midinote 13.
</pre>
NOTE: Volume goes from 0 to 1 and gets evaluated in a linear fashion. other values are possible, but will distort the sound. when you like it, do it ;)
NOTE: Duration just limits the playing and will fade out in a smooth way. But it will not prolong the sample if it is to short.

Playing a 'Named Note'
<pre>
	// playNamedNote(name, instrumentId, initNoteId, initVolume)
	// this will generate a note which will be looped again and again.
	dynsoundManager.playNamedNote("test", "harp","22")
	
	// now you can change its properties in realtime. These are your options
	dynsoundManager.setNamedNoteSetting("test", "midiNr", 30)
	dynsoundManager.setNamedNoteSetting("test", "vol", 0.2) // goes from  0 to 1
	dynsoundManager.setNamedNoteSetting("test", "pan", 0.1) // goes from -1 to +
	
	// you can change the loop behaviour and skip bytes at the start and end
	// this has to be done with the InstrumentSettings (more about settings you can read below)
	dynsoundManager.setInstrumentSetting("harp","skip_bytes_at_start", "5000")
	dynsoundManager.setInstrumentSetting("harp","skip_bytes_at_end", "3000")

	// get settings
	dynsoundManager.getNamedNoteSetting("test", "midiNr");
	// stop it 
	dynsoundManager.stopNamedNote("test");
</pre>
NOTE: once created, the namednote sticks to the same sample at the moment and doesnt pick the nearest fitting

<h3>Settings</h3>

There are three kinds of settings
 * InstrumentSetting: options for the whole instrument
 * InstrumentNoteSetting: options only for one specific note of the instrument
 * Overall Settings: these options influence all played notes
 <pre>
	// setInstrumentSetting(instrument, settingName, settingValue);
 	dynsoundManager.setInstrumentSetting("harp","skip_bytes_at_start", "5000")
	dynsoundManager.setInstrumentSetting("harp","skip_bytes_at_end", "3000")
	dynsoundManager.setInstrumentSetting("harp","vol", "0.8") // 0 - 1 recommended
	dynsoundManager.setInstrumentSetting("harp","pan", "-0.5") // -1 - +1
	dynsoundManager.setInstrumentSetting("harp","fade_out_time", "5000") // in ms, only effects notes with a duration shorter then the sample used
	// setInstrumentNoteSetting(instrument, instrumentNote,settingName, settingValue);
	dynsoundManager.setInstrumentNoteSetting("harp","24","skip_bytes_at_start", "5000")
	dynsoundManager.setInstrumentNoteSetting("harp","24","skip_bytes_at_end", "3000")
	dynsoundManager.setInstrumentNoteSetting("harp","24","vol", "0.5") // 0 - 1 recommended
	dynsoundManager.setInstrumentNoteSetting("harp","24","pan", "+0.8") // -1 - +1
	dynsoundManager.setInstrumentNoteSetting("harp","24","fade_out_time", "5000") // in ms, only effects notes with a duration shorter then the sample used
	
	// getters
	dynsoundManager.getInstrumentSetting("harp","skip_bytes_at_end")
	dynsoundManager.getInstrumentNoteSetting("harp","skip_bytes_at_end")
	
	// overall settings
	dynsoundManager.setVolume(0.8); // 0 - 1
	dynsoundManager.setPan(-0.8);   // -1 - +1 , left to right
	dynsoundManager.setRate(2);     // shifts everything up or down. e.g. 2 would shift everything one octave up, 0.5 one octave down
 </pre>

<h1> MIDI.Player functionality </h1>


NOTE: The MIDI.Player does not work in IE

<pre>
	// first tell the MIDI.Player where the DynSoundManager is
	MIDI.Player.setDynSoundManager(dynsoundManager);
	
	// now you have to asign instruments to the different channels
	// register them
	dynsoundManager.setChannelInstrument(0, "harp");
	dynsoundManager.setChannelInstrument(1, "piano");
	dynsoundManager.setChannelInstrument(2, "female");
	dynsoundManager.setChannelInstrument(3, "drums");
	// ...
	
	// load a song and start it
	MIDI.Player.loadFile('audio/test.mid');
	MIDI.Player.start()
	
	// set repeat mode. default is true
	MIDI.Player.repeat = true
	
	// stop the song currently loaded. This will also reset it back to start
	MIDI.Player.stop()
	
	// change the song. this will stop the old one if it is playing
	MIDI.Player.changeSong("audio/forellenquintett.mid")
	
	// you also can change the tempo, e.g. will playback the file with half the tempo
	MIDI.Player.timeStretch = 2
	
	// or can play it in a standarized way. this will playback the song without the tempochanges defined in the midi file.
	MIDI.Player.trueTempo = false
	// e.g. if timestretch is 1 and the song is played in a standardized fashion, the bpm will be 60
	MIDI.Player.timeStretch = 1
	// e.g. if timestretch is 2 and the song is played in a standardized fashion, the bpm will be 30
	MIDI.Player.timeStretch = 2
	// e.g. if timestretch is 0.5 and the song is played in a standardized fashion, the bpm will be 120
	MIDI.Player.timeStretch = 2
	
	// this can be really useful to synchronize the music to e.g. a game / game element etcetc.	
</pre>

<h1> Envelope functionality </h1>
	This Library also provides a helper class to setup envelops.
<pre>
	// Envelope(value_table, times_table, mode, time_offset, curve, custom_curve, custom_start, custom_end)
	
	// define a simple envelope with linear progession from point to point
	// start at 0, reach 1 on second 1, go back to zero which will be reached at second 3.
	// the envelope default state is "stopped", default mode is "repeat"
	ev = new Envelope([0,1,0],[1,3])
	// start it
	ev.start()
	
	// update it with delta time in seconds. for a game you could input here 1/framerate
	ev.update(0.070) // add 70 ms
	ev.current_value
	ev.current_time
	
	// you can set callback functions
	ev.onUpdate = function() {console.log("Updated")}
	ev.onFinish = function() {console.log("Envelope finished")}
	
	// you also can create much more complicated envelopes thanks to the "custom_curve" attribute
	// NOTE: this feature isnt perfect yet. custom curves can produce cracks at the transition point to the next defined point in the envelope
	// NOTE: the custom_curve string argument is plain javascript. atm you can use 'y' and 'x' in your calculations.
	// a sin 
	ev = new Envelope([1,1],[1],"repeat",0,"custom","Math.sin(y/30)")
	// same as the first example but with a "wavy" line
	ev = new Envelope([0,1,0],[1,3],"repeat",0,"custom","Math.sin(y/30)")

	// stop the envelope
	ev.stop()
	
	// look at its state, can be "playing", "stopped", "finished"
	ev.state
	
	// the mode, if it is "repeat", it will do so
	ev.mode
</pre>

<h1> Memory usage </h1>
<pre>
// get memory usage
dynsoundManager.getMemoryUse()
</pre>

<h1> Tribute </h1>
 <h3>This piece of code is inspired by the following libraries;</h3>
* <a href="http://www.schillmania.com/projects/soundmanager2/">SoundManager2</a> by <a href="http://schillmania.com">Scott Schiller</a>
* <a href="https://github.com/gasman/jasmid">jasmid</a>: Reads MIDI file byte-code, and translats into a Javascript array.
* <a href="https://github.com/mudcube/MIDI.js/">MIDI.js</a>: Midi file player with many interfaces.
* <a href="http://blog.andre-michelle.com/2009/pitch-mp3/">Pitch bending with flash</a>: A clear example how to do dsp coding with flash
* <a href="http://sso.mattiaswestlund.net/">Sonatina Symphonic Orchestra</a>:  a creative commons-licensed orchestral sample library with many high quality samples to play around with.


