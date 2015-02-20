App.storage = (function () {

	var edit, index, _files;
	var init = function(){

		edit = $('#edit');
		index = 0;

		localforage.config({
			driver      : localforage.WEBSQL, // Force WebSQL; same as using setDriver()
			name        : 'Cleared',
			version     : 1.0,
			size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
			storeName   : 'todolist', // Should be alphanumeric, with underscores.
			description : 'Files stored in Cleared.io'
		});
		// localforage.clear();
	};


	var save = function(value){
		_files[index].text = value || '';
		localforage.setItem('files', _files);
		App.view.updateFileListItem(index, $.trim(value.split('\n')[0]));
	};

	var add = function(attr){
		attr = attr ? attr : {};
		var file = {
			name: attr.name || 'Untitled',
			text: attr.text || '',
			tags:[]
		};
		_files.push(file);
		App.view.updateFileList(_files);
		return _files.length-1;
	};

	var remove = function(id){
		_files.splice(id, 1);
		App.view.updateFileList(_files);
	};

	var open = function(id){
		if(_files[id]){
			index = id;
		}else{
			index = _files.length-1;
		}
		if(!_files.length){
			add();
			open(0);
			return;
		}
		$('#files .file').removeClass('active').eq(index).addClass('active');
		App.view.setAndParse(_files[index].text);
		
	};

	var load = function(){
		localforage.getItem('files', function(err, value) { 
			_files = value || [];

			// value = $.trim(value);
			if(!value){
				console.log("Loading default...");
				$.ajax({
					url : "default.txt",
					dataType: "text",
					success : function (data) {
						add({text:data, name:'Welcome'});
						open(0);
					}
				});
			}else{
				App.view.updateFileList(_files);
				open(0);
			}
			
		});
	};

	return {
		init:init,
		save:save,
		load:load,
		add:add,
		remove:remove,
		open:open
	};

})();