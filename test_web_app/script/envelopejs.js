//       AUTHOR:  Beat Kunz (), <>
//       CREATED_ORIGINALLY:  05/24/2011 01:24:04 AM CEST
//       COMMENT: Ported from lua
//

// @values_table: values at times given key <   times_table, plus starting value for  time 0
// @times_table: times, excluding start at 0.0 sec. in seconds
// @curve: linear, exponential: value = x^z, z = log(y)/log(x)
function Envelope(value_table, times_table, mode, time_offset, curve, custom_curve, custom_start, custom_end) {
	
	// default args
	if(typeof(mode)==='undefined') mode = "repeat";
	if(typeof(time_offset)==='undefined') time_offset = 0;
	if(typeof(curve)==='undefined') curve = "linear";
	if(typeof(custom_curve)==='undefined') custom_curve = "Math.sin(x)";
	if(typeof(custom_start)==='undefined') custom_start = 0;
	if(typeof(custom_end)==='undefined') custom_end = 2*Math.pi;

	this.mode = mode;
	this.current_time = time_offset;
	var tottime = times_table[value_table.length - 2 ]; // TODO: make it failsafe: find biggest value withing times_table[0] .. times_table[value_table.length - 2 ]
	this.totaltime = tottime;
	this.maxvalue = 0;
	
	this.curve = curve;
	for (  k = 0; k < value_table.length;  k++ ) {
		var v = value_table[k];
		if ( this.maxvalue < v ) {
			this.maxvalue = v	;
		}
	}

	this.values_per_second = 100; // every 10ms
	var size_of_value_table = tottime * this.values_per_second;

	// helper function
	this.calc_linear_curve = function(times_table, value_table, values_per_second) {
			var envelope_value_table = [];
			var start_time = 0;
			for (  key = 0;  key <  value_table.length - 1 ;  key++ ) {
				var time_value = times_table[key];
				var start_val = value_table[key];
				var end_val = value_table[key+1];
				var steps = (time_value - start_time) * values_per_second;
				var step_size =  (end_val - start_val)/steps;
				var cur_val = start_val;
				var i = 1;
				// // console.log("Curval: " + cur_val);
				while(i <= steps) {
					envelope_value_table.push(cur_val);
					cur_val = cur_val + step_size;
					i = i + 1;
				}
				// console.log("Endval: " + cur_val + ", should be " + end_val);
				start_time = time_value;
			}
			return envelope_value_table;
	};
	
	
	this.envelope_value_table = [];
	// calculate values
	if ( this.curve == "custom" ) {
		// console.log("env calc, custom");
		var _custom_curve = custom_curve;
		var _func = function () { return eval(_custom_curve)};
		var envelope_value_table_custom = [];
		var _custom_x_start = custom_start;
		var _custom_x_end = custom_end;
		// console.log("start at:" + _custom_x_start + "} at:" 	+ _custom_x_end);
		x = _custom_x_start;
		var _custom_y_start = _func();
		x = _custom_x_end;
		var _custom_y_end = _func();
		var x_diff = _custom_x_end - _custom_x_start;
		var y_diff = _custom_y_end - _custom_y_start;
		var start_time = 0;
		for (  key = 0; key <  value_table.length - 1 ;  key++ ) {
			var time_value = times_table[key];
			var steps = (time_value - start_time) * this.values_per_second;
			var _x_delta = x_diff /steps;
			var _y_delta = y_diff /steps;
			// console.log("y_delta" + _y_delta);
			var i = 1;
			while(i <= steps) {
				x = (i*_x_delta+_custom_x_start);
				var val = _func();
				val = val - (i*_y_delta); //scale
				envelope_value_table_custom.push(val);
				i = i + 1;
			}
			start_time = time_value;
		}

		// add to linear curve
		var envelope_value_table_linear = this.calc_linear_curve(times_table, value_table, this.values_per_second);
		// console.log("linear env's got: " + envelope_value_table_linear.length);
		// console.log("custom env's got: " + envelope_value_table_custom.length);
		for (  _k = 0; _k <  envelope_value_table_linear.length; _k++) {
			var _v = envelope_value_table_linear[_k];
			var cur_val = _v + envelope_value_table_custom[_k];
			this.envelope_value_table.push(cur_val);
		}

	} else if ( this.curve == "exponential" ) {
		// console.log("env calc, exponential");
		var start_time = 0;
		for (  key = 0;  key <  value_table.length - 1;  key++) {
			var time_value = times_table[key];
			var start_val = value_table[key];
			var end_val = value_table[key+1];
			var steps = (time_value - start_time) * this.values_per_second;
			var y_diff =  end_val - start_val;
			var x_diff = time_value - start_time;
			// var z = (Math.log(end_val))/Math.log(x_diff) // z for  equation z = log(y)/log(x);
			z = 4;
			// z = Math.pow(y_diff, 1/x_diff);
			// console.log("z is: " + z);
			var step_size =  (end_val - start_val)/steps;
			var cur_val = start_val;
			var i = 1;
			// console.log("Curval: " + cur_val);
			var x = 0;
			while(i <= steps) {
				this.envelope_value_table.push(cur_val);
				x = x + step_size;
				var y = Math.pow(x,z);
				cur_val = start_val + y;
				i = i + 1;
			}
			// console.log("Endval: " + cur_val + ", should be " + end_val);
			start_time = time_value;
		}
	} else { // just "linear" curves
		// console.log("env calc, linear");
		this.envelope_value_table = this.calc_linear_curve(times_table, value_table, this.values_per_second);
	}
	// TODO: smooth values if requested
	
	this.current_value = this.envelope_value_table[0]; // set to start of envelope_value_table
	this.state = 'stopped'; // TODO: others like stopped, playing, finished

	// call with time difference
	this.update = function (dt) {
		// console.log("update function called with " + dt);
		if ( this.state == 'playing' ) { 
			this.current_time = this.current_time + dt;

			// TODO: add reverse playing
			if ( this.current_time >= this.totaltime ) {
				if ( this.mode == 'repeat' ) {
					this.current_time = 0; // send to start of envelope
				} else {
					this.state = 'finished';
				}
			} else if ( this.current_time < 0 ) {
				this.current_time = 0;
			}
			var env_index = Math.floor(this.current_time * this.values_per_second + 1); // TODO: or calc value as mix of neighbours
			// // console.log( "env_index: " + env_index + " current_time: " + this.current_time);
			this.current_value = this.envelope_value_table[env_index];
		} else {
			// console.log("not playing because the state is", this.state);
		}
		

		// // console.log("table size: " + this.envelope_value_table.length);
		// // console.log("current_value: " + this.current_value );
	};

	this.start = function () {
		this.state = 'playing';
	}
	
	this.stop = function () {
		this.state = 'stopped';
	}
	
	this.reset = function() {
		this.current_time = 0;
		this.current_value = this.envelope_value_table[0];

	}
	
}