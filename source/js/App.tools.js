// GENERIC TOOLS
/* ------------------------------------------------------------ */

// Load scripts and initiate the app
var ready = function(){
	head.js.apply(window, scripts).ready('transparency', function(){
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


var saveSelection, restoreSelection;

if (window.getSelection && document.createRange) {
    saveSelection = function(containerEl, offset) {
        offset = offset ? offset : 0;
        var range = window.getSelection().getRangeAt(0);
        var preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        var start = preSelectionRange.toString().length + offset;

        return {
            start: start,
            end: start + range.toString().length
        };
    };

    restoreSelection = function(containerEl, savedSel, offset) {
        offset = offset ? offset : 0;
        var charIndex = 0, range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        var nodeStack = [containerEl], node, foundStart = false, stop = false;
        
        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType === 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };
} else if (document.selection && document.body.createTextRange) {
    saveSelection = function(containerEl) {
        var selectedTextRange = document.selection.createRange();
        var preSelectionTextRange = document.body.createTextRange();
        preSelectionTextRange.moveToElementText(containerEl);
        preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
        var start = preSelectionTextRange.text.length;

        return {
            start: start,
            end: start + selectedTextRange.text.length
        };
    };

    restoreSelection = function(containerEl, savedSel) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.end);
        textRange.moveStart("character", savedSel.start);
        textRange.select();
    };
}

var savedSelection;

function save(offset) {
    savedSelection = saveSelection( document.getElementById("edit") , offset);
}




function restore(offset) {
    if (savedSelection) {
        restoreSelection(document.getElementById("edit"), savedSelection, offset);
    }
}
    
function saveSelection() {
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            return sel.getRangeAt(0);
        }
    } else if (document.selection && document.selection.createRange) {
        return document.selection.createRange();
    }
    return null;
}

function restoreSelection(range) {
    if (range) {
        if (window.getSelection) {
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (document.selection && range.select) {
            range.select();
        }
    }
}

function setCursorToEnd(ele){
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(ele, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    ele.focus();
}

function cancelEvent(e)
{
    if (isInFocus === false && savedRange !== null) {
        if (e && e.preventDefault) {
            //alert("FF");
            e.stopPropagation(); // DOM style (return false doesn't always work in FF)
            e.preventDefault();
        }
        else {
            window.event.cancelBubble = true;//IE stopPropagation
        }
        restoreSelection();
        return false; // false = IE style
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