// Setup App namespace
var App = App || {};

// Load scripts
/* ------------------------------------------------------------ */
var scripts = [
	{jquery: 		"//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js"},
	{device: 		"js/vendor/device.min.js"},
	{moment: 		"js/vendor/moment.min.js"},
	{transparency: 	"js/vendor/transparency.min.js"}
];


// Globals
/* ------------------------------------------------------------ */

var event_down, 
	event_move, 
	event_release, 
	transition = "transitionend webkitTransitionEnd",
	animation = "animationend webkitAnimationEnd";


