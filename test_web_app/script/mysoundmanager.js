/** @license
 *
 * MySoundManager: TODO: nice title
 */


/**
 * About this file
 TODO
 */

function MySoundManager(_id) {

  this.id = (_id || 'mysoundmanager');
  this.hasConsole = (window.console !== undefined && console.log !== undefined);
  this.flash = window[this.id];
  var flash = this.flash
   /**
   * Calls _load function of flash application
   *
   * @param {string} instrumentID The Name of the instrument. Will be created if not available
   * @param {string} noteID The Name of the note
   * @param {string} sUrl Url to mp3 // NOTE: not crossdomain
   */
    this.load = function(instrumentId, noteId, sURL) {
		try {
            flash._load(instrumentId, noteId, sURL);
        } catch(e) {
			this._writeDebug("Could not load: " + e);
        }

    };

    /**
     * Unloads a sound, canceling any open HTTP requests.
     *
     */
	/*
    this.unload = function(instrumentId, noteId, fileName) { // TODO: do this later
        flash._unload(instrumentId, noteId, fileName); 
    };
	*/


    this.play = function(instrumentId, noteId, volume, duration, loop) {
		loop = (typeof(loop) == "undefined"  ? false : true);
		duration = (typeof(duration) == "number"  ? duration : 0); // duration of 0 means that the whole file will be played
		volume = (typeof(volume) == "number"  ? volume : 0.5)
		flash._play(instrumentId, noteId, volume, loop, duration);
    };

	/*  special play function which returns the id of the sound.
		This function can be used e.g. to create a singer. // TODO: better docu
	*/
	
	this.playNamedNote = function(name, instrumentId, noteId, volume) {
		if ( typeof(name) != "undefined") {
			volume = (typeof(volume) == "number"  ? volume : 0.5)
			return flash._play(instrumentId, noteId, volume, true, 0, name);
		} else { 
			this._writeDebug ("can not create named note without a name");
			return false
		}
			
    };
	
	this.stopNamedNote = function(name) {
		flash._stopNamedNote(name);	
    };
	
	

    /**
     * Sets the panning (L-R) effect.
     * @param {string} instrumentId Name of instrument
     * @param {number} nPan The pan value (-100 to 100)
     */

    this.setPan = function(nPan) {
        flash._setPan(nPan);
    };

    /**
     * Set the volume of an instrument
     * @param {string} instrumentId Name of instrument
     * @param {string} instrumentID Name of instrument.
     * 
     */

    this.setVolume = function(nVol) {
      flash._setVolume(nVol);
    };
	this.setRate = function(nVol) {
      flash._setRate(nVol);
    };
	this.setLooping = function(nLoop) {
      flash._setLooping(nLoop);
    };

	
	this.setInstrumentSetting = function(instrumentName, settingName, value) {
		try {
            flash._setInstrumentSetting(instrumentName, settingName, value);
        } catch(e) {
          this._writeDebug(	"Could not load set instrument setting"); 
        }
	};
	this.getInstrumentSetting = function(instrumentName,  settingName) {
		try {
            return flash._getInstrumentSetting(instrumentName,  settingName);
        } catch(e) {
            this._writeDebug(	"Could not load get instrument setting"); 

        }
	};
	this.getInstrumentNoteSetting = function(instrumentName, noteName, settingName) {
		try {
            return flash._getInstrumentNoteSetting(instrumentName, noteName, settingName);
        } catch(e) {
            this._writeDebug(	"Could not load get instrument note setting"); 
        }
	};
	this.setInstrumentNoteSetting = function(instrumentName, noteName, settingName, value) {
		try {
            flash._setInstrumentNoteSetting(instrumentName, noteName, settingName, value);
        } catch(e) {
            this._writeDebug(	"Could not load set instrument note setting"); 
        }

	};
	//* // TODO:readd
	this.setNamedNoteSetting = function (namedNote, settingName, settingValue) {
		try {
			flash._setNamedNoteSetting(namedNote, settingName, settingValue);
		} catch(e) {
			this._writeDebug(	"Could not set named note setting '" + settingName + "' with '" + settingValue + "' for note '" + namedNote + "'"); 
		}
	};
	// */

	// channel stuff
	this.channelInstruments = {};
	this.setChannelInstrument = function (channelNr, instrumentName) {
		this.channelInstruments[channelNr] = instrumentName;
	}

	// set channel volume 0 - 1
	this.channelVolumes = {};
	this.setChannelVolume = function (channelNr, volume) {
		this.channelVolumes[channelNr] = volume;
	}
	///////////////// debug stuff
	
	this.getNamedNoteSetting = function (namedNote, settingName) {
		try {
			return flash._getNamedNoteSetting(namedNote, settingName);
		} catch(e) {
			this._writeDebug(	"Could not get named note setting '" + settingName + "' for note '" + namedNote + "'"); 
		}
	}
	// */
	
  /**
   * Retrieves the memory used by the flash plugin.
   *
   * NOTE: from SoundManager2 project
   * @return {number} The amount of memory in use
   */

  this.getMemoryUse = function() {
    var ram = 0;
    ram = parseInt(flash._getMemoryUse(), 10);

    return ram;

  };

 
  /**
   * Writes console.log()-style debug output to a console or in-browser element.
   * Applies when debugMode = true
   *
   * NOTE: from SoundManager2 project
   *
   * @param {string} sText The console message
   * @param {object} nType Optional log level (number), or object. Number case: Log type/style where 0 = 'info', 1 = 'warn', 2 = 'error'. Object case: Object to be dumped.
   */

  this._writeDebug = function(sText) {

    if (this.hasConsole) {
        console.log(sText);
      }
     

  };
  
  this._onFlashLoad = function()
  {
	this._onFlashLoadCallback(); // TODO: try catch block
  };
  this._onFlashLoadCallback = function () { this._writeDebug("Flash loaded (default callback)") };

  this.setDebug = function(bool) {
		try {
            flash._setDebug(bool);
        } catch(e) {
			this._writeDebug(console.log("Could not load set debug"));
        }

  };
	
} 