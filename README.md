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

<h1> Demo </h1>
* <a href="https://tuxli.ch/ld26/00_DynSoundManager/test_web_app/">DEMO Page</a>

<h1> DynSoundManager functionality </h1>
<pre>
	// loads a sample as c2. 12 represents the corresponding midi note.
	mysoundManager.load("harp", "12", "audio/harp-c2.mp3");
	// and another one
	mysoundManager.load("female", "48", "audio/chorus-female-c5.mp3");
</pre>
NOTE: Only MP3 are allowed.
NOTE: I recommend to use low rate mp3s like 32kbit/s at the moment. MP3 with a higher bitrate are possible, but they use much more ram!

<pre>
	// loads a sample as c2
	mysoundManager.load("harp", "12", "audio/harp-c2.mp3");
</pre>
NOTE: Only MP3 are allowed.
NOTE: I recommend to use low rate mp3s like 32kbit/s at the moment. MP3 with a higher bitrate are possible, but they use much more ram!

<h1> MIDI.Player functionality </h1>
<pre>

</pre>

<h1> Envelope functionality </h1>
<pre>

</pre>

<h1> Tribute </h1>
 <h3>This piece of code is inspired by following libraries, so many thanks to the authors;</h3>
* Flash package: <a href="http://www.schillmania.com/projects/soundmanager2/">SoundManager2</a> by <a href="http://schillmania.com">Scott Schiller</a>
* <a href="https://github.com/gasman/jasmid">jasmid</a>: Reads MIDI file byte-code, and translats into a Javascript array.
* <a href="https://github.com/mudcube/MIDI.js/">MIDI.js</a>: Midi file player with many interfaces.
* <a href="http://blog.andre-michelle.com/2009/pitch-mp3/">Pitch bending with flash</a>: A clear example how to do dsp coding with flash
* <a href="http://sso.mattiaswestlund.net/">Sonatina Symphonic Orchestra</a>:  a creative commons-licensed orchestral sample library with many high quality samples to play around with.


