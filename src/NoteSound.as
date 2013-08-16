/**
 * SoundManager 2: Javascript Sound for the Web
 * ----------------------------------------------
 * http://schillmania.com/projects/soundmanager2/
 *
 * Copyright (c) 2007, Scott Schiller. All rights reserved.
 * Code licensed under the BSD License:
 * http://www.schillmania.com/projects/soundmanager2/license.txt
 *
 * Flash 9 / ActionScript 3 version
 */

package {

  import flash.external.*;
  import flash.events.SecurityErrorEvent;
  import flash.events.NetStatusEvent;
  import flash.events.SampleDataEvent;
  import flash.events.AsyncErrorEvent;
  import flash.events.NetStatusEvent;
  import flash.events.IOErrorEvent;
  import flash.events.Event;


  import flash.media.Sound;
  import flash.media.SoundChannel;
  import flash.media.SoundLoaderContext;
  import flash.media.SoundTransform;
  import flash.media.SoundMixer;
  import flash.net.URLRequest;
  import flash.utils.ByteArray;
  import flash.utils.getTimer;
  import flash.net.NetConnection;
  import flash.net.NetStream;

  public class NoteSound extends Sound {

    public var sm: MySoundManager = null;
    // externalInterface references (for Javascript callbacks)
    public var baseJSController: String = "soundManager";
    public var soundChannel: SoundChannel = new SoundChannel();
    
    /* TODO: eventuelly usefull
	public var eqData: ByteArray = new ByteArray();
    public var eqDataArray: Array = [];
	*/
    public var noteID: String;
    public var instrumentID: String;
    public var lastValues: Object = {
      bytes: 0,
      position: 0,
      duration: 0,
      volume: 0.5, // NOTE: docu says 1 as max // TODO: set Volume function (for instrument, note and specific note (or both)
      pan: 0, 
      loops: 1,
      leftPeak: 0,
      rightPeak: 0,
      waveformDataArray: null,
      eqDataArray: null,
      isBuffering: null,
      bufferLength: 0
    };
	
    public var st: SoundTransform;	
	
	// NOTE: added by beat kunz
	
	private const BLOCK_SIZE: int = 3072; // 3072 is for 96kbit/s MP3s , 1024 for 32Kbit/s // TODO: or not?!
	
	public var _sound: Sound; 
		
	public var _target: ByteArray;
		
	public var _position: Number;
	public var _rate: Number;
	public var loop:Boolean = false;
	
    public function NoteSound(orig_SoundManager: MySoundManager, instrumentID: String, noteID: String, rate: Number, volume:Number=0.5, loop:Boolean = false, name:String = null) {
      this.sm = orig_SoundManager;
	  writeDebug('NoteSound: new one! instrument "' + instrumentID + '" noteID "' + noteID +'" rate "' + rate + '" volume "' + volume + '" loop "' + loop + '"' );
      this.instrumentID = instrumentID;
      this.noteID = noteID;
	  this.lastValues.volume = volume;
	  this.loop = loop; // TODO: readd
	  
	  
	  this._target = new ByteArray();
	  this._position = 0.0;
	  this._rate = rate; // TODO: just a test
	  this._sound = new Sound();
	  this._sound.addEventListener(SampleDataEvent.SAMPLE_DATA, sampleData);
	  this.soundChannel = this._sound.play();
	  this.applyTransform(); // sets default volume and pan // TODO: volume should be given by instruments

	  
	  if (name != null) { // register it into the soundmanager
		if (this.sm.namedNotes[name] != null ) { // if there was a sound already registered with this name, stop it gracfully and set it to null
			this.sm.namedNotes[name].stop(); 
			this.sm.namedNotes[name] = null;
		}
		this.sm.namedNotes[name] = this;
	  }
	  
    }

	// NOTE: added by Beat Kunz
	public function sampleData( event: SampleDataEvent ): void
	{
		// writeDebug('NoteSound: sampleData Callback! Position: ' + this._position + ' Length: ' + (this.sm.instruments[this.instrumentID][this.noteID].length * 44.1));

		if (this._position > (this.sm.instruments[this.instrumentID][this.noteID].length * 44.1) ) {
			writeDebug('NoteSound: sampleData Callback UNREGISTERING! Processed whole file. Position: ' + this._position + ' Length: ' + this.sm.instruments[this.instrumentID][this.noteID].length * 44.1);
		    this.stop();
		} else {
			this._target.position = 0;
			var data: ByteArray = event.data;
			var scaledBlockSize: Number = BLOCK_SIZE * _rate;
			var positionInt: int = this._position;
			var alpha: Number = this._position - positionInt;
			var positionTargetNum: Number = alpha;
			var positionTargetInt: int = -1;
			var need: int = Math.ceil( scaledBlockSize ) + 2;
			var read: int = this.sm.instruments[this.instrumentID][this.noteID].extract( _target, need, positionInt ); // look at original file and extract data
			var n: int = read == need ? BLOCK_SIZE : read / this._rate;
			var l0: Number;
			var r0: Number;
			var l1: Number;
			var r1: Number;
			var loop_start: Number = 0;
			var loop_end: Number = 0;
			if (this.loop && this.sm.loopingAllowed ) {
				if ( this.sm._getInstrumentNoteSetting(this.instrumentID,this.noteID,"_skip_bytes_at_start") != null ) {
					loop_start = this.sm._getInstrumentNoteSetting(this.instrumentID,this.noteID,"_skip_bytes_at_start");
					
				} else if ( this.sm._getInstrumentSetting(this.instrumentID,"_skip_bytes_at_start") != null ) {
					loop_start = this.sm._getInstrumentSetting(this.instrumentID, "_skip_bytes_at_start");
				}
				if ( this.sm._getInstrumentNoteSetting(this.instrumentID,this.noteID,"_skip_bytes_at_end") != null ) {
					loop_end = this.sm._getInstrumentNoteSetting(this.instrumentID,this.noteID,"_skip_bytes_at_end");
					
				} else if ( this.sm._getInstrumentSetting(this.instrumentID,"_skip_bytes_at_end") != null ) {
					loop_end = this.sm._getInstrumentSetting(this.instrumentID, "_skip_bytes_at_end");
				}
			}
			
			for( var i: int = 0 ; i < n ; ++i )
			{
				if( int( positionTargetNum ) != positionTargetInt )
				{
					positionTargetInt = positionTargetNum;
					this._target.position = positionTargetInt << 3;
					l0 = this._target.readFloat();
					r0 = this._target.readFloat();
					l1 = this._target.readFloat();
					r1 = this._target.readFloat();
				}
				data.writeFloat( l0 + alpha * ( l1 - l0 ) );
				data.writeFloat( r0 + alpha * ( r1 - r0 ) );
				positionTargetNum += this._rate;
				
				// to make it loop nicer you can ignore the first few and last few bytes
				// TODO: move Setting to this.sm.instrumentNoteSetting[this.instrumentID][this.noteID] // TODO use getter method
				// * TODO: fix &readd 
				if ( this.loop && this.sm.loopingAllowed)  {
					if ((_position > this.sm.instruments[this.instrumentID][this.noteID].bytesTotal - loop_end ) )
					{
						_position = loop_start;
					}
				}
				// */ 
				alpha += this._rate;
				while( alpha >= 1.0 ) --alpha;
			}
			if( i < BLOCK_SIZE )
			{
				while( i < BLOCK_SIZE )
				{
					data.writeFloat( 0.0 );
					data.writeFloat( 0.0 );
					++i;
				}
			}
			this._position += scaledBlockSize;
		}
	}
	

    public function writeDebug (s: String, logLevel: Number = 0) : Boolean {
      return this.sm.writeDebug (s,logLevel); // defined in main SM object
    }

 
 // look at this. could be useful
 /*
    public function getEQData() : void {
      // http://livedocs.adobe.com/flash/9.0/ActionScriptLangRefV3/flash/media/SoundMixer.html#computeSpectrum()
      SoundMixer.computeSpectrum(this.eqData, true, 0); // sample EQ data at 44.1 KHz
      this.eqDataArray = [];
      for (var i: int = 0, j: int = this.eqData.length / 4; i < j; i++) { // get all 512 values (256 per channel)
        this.eqDataArray.push(int(this.eqData.readFloat() * 1000) / 1000);
      }
    }
*/
	
	// TODO: trigger fade out
	public function stop() : void {
		this._sound.removeEventListener(SampleDataEvent.SAMPLE_DATA, sampleData);
		this._position = 0;
		this.soundChannel.stop();
		this._sound = null;
		this._target = null;
		this._onfinish(); // NOTE: this is ugly
	}
	
    private function _onfinish() : void {
      writeDebug('on finish called');
    
	  this.soundChannel = null;
	  // TODO: destroy somehow
    }

    public function setVolume(nVolume: Number) : void {
      this.lastValues.volume = nVolume / 100;
      this.applyTransform();
    }

    public function setPan(nPan: Number) : void {
      this.lastValues.pan = nPan / 100;
      this.applyTransform();
    }

    public function applyTransform() : void {
	  try {
    	  writeDebug("Try to set vol / vol");
		  var vol__: Number = this.lastValues.volume*this.sm.vol;
		  if(this.sm._getInstrumentSetting(this.instrumentID, "vol") != null) {
			vol__ *= Number(this.sm._getInstrumentSetting(this.instrumentID, "vol"));
		  }
		  if (this.sm._getInstrumentNoteSetting(this.instrumentID, this.noteID, "vol") != null) {
			vol__ *= Number(this.sm._getInstrumentNoteSetting(this.instrumentID, this.noteID, "vol"));
		  }
		  var pan__: Number = this.lastValues.pan*this.sm.pan;
		  if(this.sm._getInstrumentSetting(this.instrumentID, "pan") != null) {
			pan__ *= Number(this.sm._getInstrumentSetting(this.instrumentID, "pan"));
		  }
		  if (this.sm._getInstrumentNoteSetting(this.instrumentID, this.noteID, "pan") != null) {
			pan__ *= Number(this.sm._getInstrumentNoteSetting(this.instrumentID, this.noteID, "pan"));
		  }
		  var st: SoundTransform = new SoundTransform( vol__, pan__);
		  this.soundChannel.soundTransform = st;
	  } catch (e: Error) {
		writeDebug("Fatal: Could not set vol / vol" + e.toString());
	  }
    }

	
  }
}