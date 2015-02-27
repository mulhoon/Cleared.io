App.storage = (function () {

	var edit, index, _files, loadTrigger;
	var init = function(){

		edit = $('#edit');

		localforage.config({
			driver      : localforage.WEBSQL, // Force WebSQL; same as using setDriver()
			name        : 'Cleared',
			version     : 1.0,
			size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
			storeName   : 'todolist', // Should be alphanumeric, with underscores.
			description : 'Files stored in Cleared.io'
		});

	};

	var clear = function(){
		localforage.clear();	
		loadTrigger = null;
		_files = {};
		index = null;
	};

	var save = function(value, title, callback){
		console.log('saving');
		if(value){
			_files[index].text = value || '';
			_files[index].title = title || '';
			_files[index].date = new Date().getTime();
		}
		localforage.setItem('files', _files);
		if(callback){
			callback();
		}
	};

	var getCurrentFileID = function(){
		return index;
	};
	var get = function(){
		return _files;
	};
	var guid = function(){
		return Math.random().toString(36).substring(7);
	};

	var add = function(callback, text, id){
		var file = {
			text: text || '',
			date: new Date().getTime()
		};
		var uid = id || guid();
		_files[uid] = file;
		save(null, '', function(){
			load(function(_files){
				loadTrigger(_files);
				if(!id){
					callback(uid);
				}
			});
		});
		
	};

	var remove = function(id, callback){
		delete _files[id];
		save(null, function(){
			load(function(_files){
				loadTrigger(_files);
				if(!id){
					callback(uid);
				}
			});
		});
	};

	var open = function(id, callback){
		index = id;
		console.log("open:"+id);
		callback(_files[id]);
	};

	var load = function(callback){
		if(!loadTrigger){
			loadTrigger = callback;
		}
		localforage.getItem('files', function(err, value) { 
			_files = value || {};

			if(!Object.size(_files)){
				console.log("Loading default...");
				$.ajax({
					url : "default.txt",
					dataType: "text",
					success : function (data) {
						index = null;
						console.log('loaded default');
						add(callback, data, 'intro');
					}
				});
			}else{
				console.log('loaded');
				callback(_files);
			}
			
		});
	};

	return {
		init:init,
		clear:clear,
		save:save,
		load:load,
		get:get,
		add:add,
		remove:remove,
		getCurrentFileID:getCurrentFileID,
		open:open
	};

})();