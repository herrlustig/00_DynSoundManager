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

  import flash.display.Sprite;
  import flash.events.Event;
  import flash.events.IOErrorEvent;
  import flash.events.MouseEvent;
  import flash.events.SecurityErrorEvent;
  import flash.events.AsyncErrorEvent;
  import flash.events.NetStatusEvent;
  import flash.events.TimerEvent;
  import flash.events.SampleDataEvent;
  import flash.external.ExternalInterface; // woo
  import flash.media.Sound;
  import flash.media.SoundChannel;
  import flash.media.SoundMixer;
  import flash.net.URLLoader;
  import flash.net.URLRequest;
  import flash.system.Security;
  import flash.system.System;
  import flash.text.TextField;
  import flash.text.TextFormat;
  import flash.text.TextFieldAutoSize;
  import flash.ui.ContextMenu;
  import flash.ui.ContextMenuItem;
  import flash.utils.setInterval;
  import flash.utils.clearInterval;
  import flash.utils.Dictionary;
  import flash.utils.Timer;
  import flash.utils.ByteArray;


  public class MySoundManager extends Sprite {

    public var version:String = "V0.1";
    public var version_as:String = "(AS3/Flash 10)";

    // externalInterface references (for Javascript callbacks)
    public var baseJSController:String = "mysoundManager";
    

    // internal objects
	// holds instruments and references to their soundfiles. instruments[instrumentId][noteId] 
    public var instruments: Dictionary = new Dictionary(); 			
    // holds settings for the whole instrument e.g. overall volume of a instrument. instrumentSettings[instrumentId][settingName]
	public var instrumentSettings: Dictionary = new Dictionary(); 	
	// holds settings for the specific notes of the instrument e.g. loop points. instrumentNoteSettings[instrumentId][noteId][settingName]
	public var instrumentNoteSettings: Dictionary = new Dictionary(); 	
	
	// named notes are hold in here
	public var namedNotes: Dictionary = new Dictionary();

    public var debugEnabled: Boolean = false; // Flash debug output enabled by default, disabled by JS call
    public var flashDebugEnabled: Boolean = false; // Flash internal debug output (write to visible SWF in browser)
    public var messages:Array = [];
    public var textField: TextField = null;
    public var textStyle: TextFormat = new TextFormat();
    public var didSandboxMessage: Boolean = false;
    public var caughtFatal: Boolean = false;
	public var lastNote: NoteSound;
	public var vol:Number = 0.8;
	public var pan:Number = 0;
	public var loopingAllowed:Boolean = true;


	// initalize manager
    public function MySoundManager() {

      // <d>
      this.flashDebugEnabled = true;
      

      if (this.flashDebugEnabled) {
        var canvas: Sprite = new Sprite();
        canvas.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
        addChild(canvas);
      }
      // </d>

      flashDebug('SM2 SWF ' + version + ' ' + version_as);

      // context menu item with version info

      var sm2Menu:ContextMenu = new ContextMenu();
      var sm2MenuItem:ContextMenuItem = new ContextMenuItem('SoundManager ' + version + ' ' + version_as);
      sm2MenuItem.enabled = false;
      sm2Menu.customItems.push(sm2MenuItem);
      contextMenu = sm2Menu;

      if (ExternalInterface.available) {
        flashDebug('ExternalInterface available');
        try {
          flashDebug('Adding ExternalInterface callbacks...');
          ExternalInterface.addCallback('_load', _load); // load mp3 to instruments, assign note name
          ExternalInterface.addCallback('_unload', _unload); // load mp3 to instruments, assign note name

          ExternalInterface.addCallback('_play', _play); // play specific instrument, note template gets chosen
          
          ExternalInterface.addCallback('_disableDebug', _disableDebug);
          ExternalInterface.addCallback('_getMemoryUse', _getMemoryUse);
          ExternalInterface.addCallback('_testInterface', _testInterface);
          ExternalInterface.addCallback('_setDebug', _setDebug);
		  
          ExternalInterface.addCallback('_setInstrumentSetting', _setInstrumentSetting);
          ExternalInterface.addCallback('_setInstrumentNoteSetting', _setInstrumentNoteSetting);
          ExternalInterface.addCallback('_getInstrumentSetting', _getInstrumentSetting);
          ExternalInterface.addCallback('_getInstrumentNoteSetting', _getInstrumentNoteSetting);


		  ExternalInterface.addCallback('_setPan', _setPan);
          ExternalInterface.addCallback('_setVolume', _setVolume);
		  ExternalInterface.addCallback('_setLooping', _setLooping);
		  
		  // named note
  		  ExternalInterface.addCallback('_setNamedNoteSetting', _setNamedNoteSetting);
  		  ExternalInterface.addCallback('_getNamedNoteSetting', _getNamedNoteSetting);
		  ExternalInterface.addCallback('_stopNamedNote', _stopNamedNote);



        } catch(e: Error) {
          flashDebug('Fatal: ExternalInterface error: ' + e.toString());
        }
      } else {
        flashDebug('Fatal: ExternalInterface (Flash &lt;-&gt; JS) not available');
      };

	  // call js callback function
      writeDebug('call onFlashLoad');
      ExternalInterface.call(baseJSController + "['_onFlashLoad']");

	  
    } // MySoundManager()
	
    // methods
    // -----------------------------------



    public function _load(instrumentID:String, noteID:String, sURL:String) : void {
      writeDebug('_load()');
	  
	  if (instruments[instrumentID] == null) {
		instruments[instrumentID] = new Dictionary();
		// set standard settings
		try {
			_setInstrumentSetting(instrumentID, "vol", "0.6"); // not to load
			_setInstrumentSetting(instrumentID, "pan", "0");   // center
			_setInstrumentSetting(instrumentID, "skip_bytes_at_end", "0"); // only when looping
			_setInstrumentSetting(instrumentID, "skip_bytes_at_start", "0");
		} catch(e: Error) {
			writeDebug('Could not set settings');

		}
		writeDebug('instrument has to be created');

	  } else {
        writeDebug('instrument already exists');

	  }
	  
	  try {
		  writeDebug('try to load sample for instrument "' + instrumentID + '" note "' + noteID + '"');

		  instruments[instrumentID][noteID] = new Sound(new URLRequest(sURL));
		  // instruments[instrumentID][noteID].play(); // TODO: just a test, remove afterwards
	  } catch(e: Error) {
          writeDebug('error during loadSound(): ' + e.toString());
      }
    
      

    }
	
	
	// TODO: to unload stuff. e.g. when only instrument give, unload the whole thing!
	public function _unload(instrumentID:String, noteID:String, sURL:String) : void {
		/* TODO: do somthing like
		s = null;
      soundObjects[sID] = null;
      delete soundObjects[sID];
		*/
	}
	
	public function findNearestKey(dict: Dictionary, midiNr: Number):Number {
			writeDebug('go though keys ...');

            var nearestKey:Number;
            for (var key:* in dict) {
				var key_n: Number = Number(key);
				if (key_n is Number) {
					writeDebug('go though keys: is number "' + key_n + '"');
					if (isNaN(nearestKey)) {
						nearestKey = key_n;
						writeDebug('go though keys: nearest key is now "' + nearestKey + '"');

					} else if ( Math.abs(midiNr - key_n) < Math.abs(midiNr - nearestKey)) {
						writeDebug('found key which is nearer then "' + nearestKey + '", "' + key_n +'"');
						nearestKey = key;
					}
				} else {
					writeDebug('go though keys: is NOT a number "' + key_n + '"');
				}
			}
            return nearestKey;
    }
	
    public function _play(instrumentID:String, noteID:String, volume:Number=0.5, loop: Boolean = false, duration:uint = 0, name:String = null) : void { // TODO: or instead of note ID the midiNr, or both
      writeDebug('_play()');
	  
	  // choose sound and calculate rate
	  if (this.instruments[instrumentID] != null ) { // only if instrument exists
		  if ( this.instruments[instrumentID][noteID] != null ) {
  			writeDebug('found note in dict, play it');
  		    this.lastNote = new NoteSound(this, instrumentID, noteID, 1.0, volume,  loop, name, duration); // this will play immediately
  			writeDebug('saved it in "lastNote" of soundmanager');

		  } else {
			  writeDebug('could not find note');
			  try {
				var noteID_x:Number = Number(noteID); // TODO: replace parseInt with own function 'cause '22a' will turn into 22
			  } catch(e: Error) {
				writeDebug('Could not turn noteID into a number "' + noteID + '"');
			  }
			  
			  if (noteID_x is Number) {
				var nearKey: Number = this.findNearestKey(this.instruments[instrumentID], noteID_x);
				if (!isNaN(nearKey)) {
					var nearKey_s: String = "" + nearKey; // back to string
					writeDebug('found NEAREST key "' + nearKey_s + '"');
					// calculate rate change (ratio between them calculated via semitone #)
					var new_rate: Number = Math.pow(2, (noteID_x - nearKey)/12.0);
					writeDebug('could calculate rate / ratio "' + new_rate + '"');
					new NoteSound(this, instrumentID, nearKey_s, new_rate, volume, loop, name, duration); // this will play immediately
				} else {
					writeDebug('Note isNaN Could not find this note "' + noteID_x + '" in instrument "' + instrumentID + '" nearKey "' + nearKey + '"');
				}
			  } else {
				writeDebug('Could not find this note "' + noteID_x + '" in instrument "' + instrumentID + '"');
			  }
		  }
	  } else {
		writeDebug('Instrument "' + instrumentID + '" does not exist');
	  }
    }

	
    public function _getInstrumentSetting(instrumentName:String, settingName:String) :* {
		try {
          // writeDebug('try to get instrument setting ' + settingName);
          // writeDebug('It is ' + instrumentSettings[instrumentName][settingName]);

		  return instrumentSettings[instrumentName][settingName];
		} catch(e: Error) {
          // writeDebug('Fatal: could not get instrument setting ' + settingName + "  => " + e.toString());
		  return null
        }
	}

    public function _setInstrumentSetting(instrumentName:String, settingName:String, settingValue:String) : void {
	  if (instrumentSettings[instrumentName] == null) {
		instrumentSettings[instrumentName] = new Dictionary();
        writeDebug('instrumentsetting has to be created');

	  } else {
        writeDebug('instrumentsetting already exists');

	  }
	  if (settingName == "vol" || settingName == "pan" || settingName ==  "skip_bytes_at_end" || settingName ==  "skip_bytes_at_start" || settingName == "fade_out_time" || settingName == "overlap") {
		instrumentSettings[instrumentName][settingName] = Number(settingValue);
	  } else {
		instrumentSettings[instrumentName][settingName] = settingValue;
	  }
	}

	
	public function _getInstrumentNoteSetting(instrumentName:String, noteName:String, settingName:String) :* {
		try {
		  // writeDebug('try to get instrument note setting ' + settingName);

		  // writeDebug('it is ' + instrumentNoteSettings[instrumentName][noteName][settingName]);
		  return instrumentNoteSettings[instrumentName][noteName][settingName];
		} catch(e: Error) {
          // writeDebug('Fatal: could not get instrument note setting ' + settingName + "  => " + e.toString());
		  return null
        }
	}

    public function _setInstrumentNoteSetting(instrumentName:String, noteName:String, settingName:String, settingValue:String) : void {
	  if (instrumentNoteSettings[instrumentName] == null) {
		instrumentNoteSettings[instrumentName] = new Dictionary();
        writeDebug('instrumentnotesetting dict has to be created');
	  } else {
        writeDebug('instrumentnotesetting dict already exists');
	  }
	  if (instrumentNoteSettings[instrumentName][noteName] == null) {
		instrumentNoteSettings[instrumentName][noteName] = new Dictionary();
        writeDebug('instrumentnotesetting has to be created');
	  } else {
        writeDebug('instrumentnotesetting already exists');
	  }
	  if (settingName == "vol" || settingName == "pan"|| settingName ==  "skip_bytes_at_end" || settingName ==  "skip_bytes_at_start" || settingName == "fade_out_time" || settingName == "overlap") {
		instrumentNoteSettings[instrumentName][noteName][settingName] = Number(settingValue);
	  } else {
		instrumentNoteSettings[instrumentName][noteName][settingName] = settingValue;
	  }
	}
	
	public function _setNamedNoteSetting(namedNote:String, setting:String, setting_value:String) : void {
	// first check if named note is registered
		if ( this.namedNotes[namedNote] == null ) {
			// do nothing
			writeDebug("no such named Note to set setting to");
			
		} else {
			try {		
				if (setting == "vol") {
					this.namedNotes[namedNote].lastValues.volume = Number(setting_value);
				} else if ( setting == "pan" ){
					this.namedNotes[namedNote].lastValues.pan = Number(setting_value);
				} else if ( setting == "midiNr" ) {
					// this.namedNotes[namedNote].lastValues.volume; // TODO
					this.namedNotes[namedNote]._rate = Math.pow(2, (Number(setting_value) - Number(this.namedNotes[namedNote].noteID))/12.0);
				} else { // do nothing
				
				}
			} catch (e: Error ) {
				writeDebug("something went wrong with the named note '" + namedNote + "' and setting '" + setting + "'" + e.toString());
			}
		}
	
	}
	
	public function _getNamedNoteSetting(namedNote:String, setting:String) :* {
		// first check if named note is registered
		if ( this.namedNotes[namedNote] == null ) {
			// do nothing
			writeDebug("no such named Note to get setting from");
			
		} else {
			try {		
				if (setting == "vol") {
					return this.namedNotes[namedNote].lastValues.volume;
				} else if ( setting == "pan" ){
					return this.namedNotes[namedNote].lastValues.pan;
				} else if ( setting == "midiNr" ) {
					return Number(this.namedNotes[namedNote].noteID) * this.namedNotes[namedNote]._rate;
				} else { // do nothing
				
				}
			} catch (e: Error ) {
				writeDebug("something went wrong with the named note '" + namedNote + "' and setting '" + setting + "'" + e.toString());
			}
		}
	
	}
	
	public function _stopNamedNote (namedNote:String) : void {
		if ( this.namedNotes[namedNote] == null ) {
			// do nothing
			writeDebug("no such named Note to stop");
			
		} else {
			this.namedNotes[namedNote].stop();
			this.namedNotes[namedNote] = null; // remove reference
		}	
		
	}
	
	// overall
    public function _setPan(nPan:Number) : void {
	  this.pan = nPan;
    }

	// overall
    public function _setVolume(nVol:Number) : void {
      // writeDebug('_setVolume: '+nVol);
      this.vol = nVol;
    }
	// overall
    public function _setLooping(nLoop:Boolean) : void {
      this.loopingAllowed = nLoop;
    }

    public function _getMemoryUse() : String {
      return System.totalMemory.toString();
    }

	public function _setDebug(bool_s:String) :void {
		if (bool_s == "true") {
			debugEnabled = true;
		} else if ( bool_s == "false") {
			debugEnabled = false;
		}
	}
	
    public function writeDebug (s:String, logLevel:Number = 0) : Boolean {

	  if (this.debugEnabled) {
		ExternalInterface.call(baseJSController + "['_writeDebug']", "(Flash MySoundManager): " + s, null, logLevel);
	  }
      return true;
    }
	public function _testInterface (bla:String="hahaha") : void {
    
      ExternalInterface.call("wuff", bla);
	  ExternalInterface.call("wuff", "baseJSController is: " + baseJSController);
  	  ExternalInterface.call("wuff", "now use 'writeDebug' function output");

	  writeDebug("test debug");
    
    }
	

    public function _disableDebug() : void {
      // prevent future debug calls from Flash going to client (maybe improve performance)
      writeDebug('_disableDebug()');
      debugEnabled = false;
    }
	

    public function flashDebug (txt:String) : void {
      // <d>
      messages.push(txt);
      if (this.flashDebugEnabled) {
        var didCreate: Boolean = false;
        textStyle.font = 'Arial';
        textStyle.size = 12;
        // 320x240 if no stage dimensions (happens in IE, apparently 0 before stage resize event fires.)
       var w:Number = this.stage.width?this.stage.width:320;
       var h:Number = this.stage.height?this.stage.height:240;
        if (textField == null) {
          didCreate = true;
          textField = new TextField();
          textField.autoSize = TextFieldAutoSize.LEFT;
          textField.x = 0;
          textField.y = 0;
          textField.multiline = true;
          textField.textColor = 0;
          textField.wordWrap = true;
        }
        textField.htmlText = messages.join('\n');
        textField.setTextFormat(textStyle);
        textField.width = w;
        textField.height = h;
        if (didCreate) {
          this.addChild(textField);
        }
      }
      // </d>
    }
	
    // -----------------------------------
    // end methods

  }

  // package

}