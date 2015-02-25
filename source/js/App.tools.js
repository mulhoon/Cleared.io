// GENERIC TOOLS
/* ------------------------------------------------------------ */

// Load scripts and initiate the app
var ready = function(){
	head.js.apply(window, scripts).ready('autolink', function(){
		checkDevice();
		App.view.init();
	});
};

if(!window.cordova){ 
	ready();
}else{ // if Cordova wait for device
    document.addEventListener("deviceready", ready, false);
}

// Disable Console if not available;
window.console = window.console || { log: function (d) {} };

// Check if mobile device
var checkDevice = function(){
	if(device.desktop()) {
	    event_down 		= "mousedown";
	    event_move 		= "mousemove";
	    event_release	= "mouseup";
	}else{
		event_down 		= "touchstart";
	    event_move 		= "touchmove";
	    event_release 	= "touchend";
	}
};

// Cursor positions

function save(el, offset) {
    savedSel = rangy.getSelection().saveCharacterRanges(el);
    // console.log(savedSel);
    return savedSel;
}

function restore(el, offset, selection) {
    if(selection){
        savedSel = selection;
    }
    if(offset){
        savedSel[0].characterRange.start += offset;
        savedSel[0].characterRange.end += offset;
    }

    rangy.getSelection().restoreCharacterRanges(el, savedSel);
}


Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)){
        	size++;
        }
    }
    return size;
};

var savedSel = null;
var savedSelActiveElement = null;


// Faster .data() !!
var Data = function(){
  var warehouse = {};
  var count = 1;
  return{
    reset: function(){
      count = 1;
      warehouse = {};
    },
    set: function(dom, data){
      if(!dom.__data){
        dom.__data = "hello" + count++;
      }
      warehouse[dom.__data] = data;
    },
    get: function(dom){
      return warehouse[dom.__data];
    }};
}();

function reverseForIn(obj, f) {
	var arr = [];
	for (var key in obj) {
		// add hasOwnPropertyCheck if needed
		arr.push(key);
	}
	for (var i=arr.length-1; i>=0; i--) {
		f.call(obj, arr[i]);
	}
}

// Animation Polyfill
/* ------------------------------------------------------------ */
(function() {
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
				window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
				window.cancelAnimationFrame =
					window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame){
				window.requestAnimationFrame = function(callback, element) {
						var currTime = new Date().getTime();
						var timeToCall = Math.max(0, 16 - (currTime - lastTime));
						var id = window.setTimeout(function() { callback(currTime + timeToCall); },
							timeToCall);
						lastTime = currTime + timeToCall;
						return id;
				};
		}
		if (!window.cancelAnimationFrame){
				window.cancelAnimationFrame = function(id) {
						clearTimeout(id);
				};
		}
}());