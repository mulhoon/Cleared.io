App.storage = (function () {

	var edit, index;
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

		getLast();
		// clear();
	};

	var clear = function(){
		localforage.setItem('files', null);
		index = null;
	};

	var save = function(value, title){
		console.log('saving');
		console.log(index);
		var id = getByID(App.view.items, index);
		var item = App.view.items[id];

		if(item){
			if(item.key==='new'){
				App.view.items[id].key = guid();
				index = App.view.items[id].key;
			}
			if(value){
				App.view.items[id].text = value || '';
				App.view.items[id].date = new Date().getTime();
			}
		}
		localforage.setItem('files', App.view.items);
		riot.update();
	};

	var getCurrentFileID = function(){
		return index;
	};

	var store = function(key, value){
		localforage.setItem(key, value);
	};
	var retrieve = function(key, callback){
		localforage.getItem(key, callback);
	};


	var getLast = function(id){
		retrieve('last', function(err, value){
			App.view.lastOpened = value;
		});
		retrieve('localcopy', function(err, value){
			App.view.setAndParse({text:value});
		});
	};

	var add = function(text, id){
		var file = {
			text: text || '',
			date: new Date().getTime(),
			active:false,
			key: id || guid()
		};
		App.view.items.push(file);
		riot.update();
	};

	var remove = function(){
		var pos = getByID(App.view.items, index);
		App.view.items.splice(pos, 1);

		// Choose nearest one...
		if(App.view.items[pos]){
			item = App.view.items[pos];
		}else if(App.view.items[pos-1]){
			item = App.view.items[pos-1];
		}else if(App.view.items[pos+1]){
			item = App.view.items[pos+1];
		}
		save();
		if(item){
			App.view.open({item:item});
		}
	};

	var open = function(key){
		index = key;
	};

	var load = function(){
		localforage.getItem('files', function(err, value) { 
			App.view.items = value || [];

			if(!App.view.items.length){
				console.log("Loading default...");
				$.ajax({
					url : "default.txt",
					dataType: "text",
					success : function (data) {
						index = null;
						console.log('loaded default');
						add(data, 'intro');
						App.view.open({item:App.view.items[0]});
					}
				});
			}else{
				App.view.items.sort(function(a, b){
					return b.date - b.date >= 0 ? 1 : -1;
				});
				App.view.open({item:App.view.items[0]});
			}
			riot.update();
		});
	};

	var getSharers = function(){
		// empty for localstorage
	};

	return {
		init:init,
		clear:clear,
		save:save,
		load:load,
		add:add,
		remove:remove,
		store:store,
		retrieve:retrieve,
		getCurrentFileID:getCurrentFileID,
		getSharers:getSharers,
		open:open
	};

})();