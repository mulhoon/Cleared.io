App.storage = (function () {

	var edit;
	var init = function(){
		edit = $('#edit');
	};
	var save = function(){
		var value = edit.html();
		localforage.setItem('page', value);
	};
	var load = function(){
		localforage.getItem('page', function(err, value) { 
			App.view.setAndParse(value);
		});
	};

	return {
		init:init,
		save:save,
		load:load
	};

})();