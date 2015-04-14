App.cloud = (function () {

	var 
	firebase, 
	auth,
	users, 
	user, 
	files, 
	file,
	migrateItems;
	_files = {};

	var init = function(){
		// if(true){
		// 	authCallback(null);
		// 	return;
		// }
		firebase = new Firebase("https://cleared.firebaseio.com/");
		users = firebase.child("users");
		files = firebase.child("files");
		firebase.onAuth(authCallback);
	};

	var authCallback = function(authData) {
		if (authData) {
			auth = authData;
			auth.deviceID = guid();

			App.view.auth = auth;

			App.storage.retrieve('guid', function(err, value){
				var id = value ? value : guid();
				auth.deviceID = id;
				
				App.storage.store('guid', id);
			});
			// console.log("#");
			// console.log(authData.uid);
			user = users.child(authData.uid);
			if(App.view.items){
				migrateItems = JSON.parse(JSON.stringify(App.view.items));
			}
			App.view.items = [];
			// console.log(migrateItems);
			updateUser(authData);
			getFriends();
			console.log("User " + authData.uid + " is logged in with " + authData.provider);
		} else {
			auth = null;
			file = null;
			user = null;
			App.view.auth = null;
			console.log("User is logged out");
		    // Try to authenticate with Google via OAuth redirection
		}
		App.view.setUser(auth);
	};

	var add = function(callback, data){
		var date = Firebase.ServerValue.TIMESTAMP;
		var obj = {
			date: date,
			text: data ? data.text || "" : "",
			owner: auth.uid, 
			lastEditor: auth.deviceID,
			lastEditorName: auth[auth.provider].displayName,
			users:{}
		};
		obj.users[auth.uid] = true;
		file = files.push();
		file.update(obj);

		var key = file.key();
		var userFile = user.child('files').child(key);
		var pos = getByID(App.view.items, 'new');
		if(pos!==-1){
			App.view.items[pos].key = key;
		}
		userFile.setWithPriority(true, date, callback);

	};
	var removeItem = function(key){
		console.log('removeItem:'+key);
			var pos = getByID(App.view.items, key);
			
			if(pos!==-1){
				App.view.items.splice(pos,1);
				console.log("removed item");
				var item;
				if(App.view.items[pos]){
					item = App.view.items[pos];
				}else if(App.view.items[pos-1]){
					item = App.view.items[pos-1];
				}else if(App.view.items[pos+1]){
					item = App.view.items[pos+1];
				}
				if(item){
					App.view.open({item:item});
				}

				if(!App.view.items.length){
					riot.update();
					App.storage.store('localcopy', '');
					App.view.add();
				}

				// console.log(pos);
				// console.log(App.view.items);
			}
	};

	var fileCount = 0;
	var load = function(){
		var time = new Date().getTime();
		user.child('files').on("child_removed", function(snap){
			files.child(snap.key()).off();
			removeItem(snap.key());
		});
		var total = 0;
		var cached = 0;
		var opened;

		user.child('files').once("value", function(s){
			if(!s.val()){
				App.view.add();
			}
		});

		user.child('files').orderByPriority().on("child_added", function(snap){
			var val = snap.val();
			var key = snap.key();
			total++;

			var isNew = getByID(App.view.items, key) === -1;
			// console.log("added item");

			files.child(key).on("value", function(snaptitle){
				// console.log("value change");
				var key = snaptitle.key();
				var val = snaptitle.val();
				val.key = key;
				var pos = getByID(App.view.items, key);

				if(App.view.items[pos]){
					val.active = App.view.items[pos].active;
					val.sharers = App.view.items[pos].sharers;
					App.view.items[pos] = val;

					if(key === App.view.currentItem.key){
						App.view.currentItem = App.view.items[pos];
						if(val.lastEditor!==auth.deviceID){
							App.view.setAndParse(App.view.currentItem, null, true);
						}
					}

				}else{
					App.view.items.unshift(val);
					cached++;
					if(key === App.view.lastOpened){
						App.view.open({item:val});
						opened = true;
					}else if(cached===total && !opened){
						// If no file was opened and we've loaded eveything
						App.view.open({item:App.view.items[0]});
					}
				}
				// Get shared users
				riot.update();

			});


		}, function(error){
			console.log("error");
			console.log(error);
		});
	};

	var shareWatch;
	var shareWatchProfiles;

	var getSharers = function(key){
		
		App.view.currentItem.sharers = [];
		shareWatch = files.child(key).child('users');
		shareWatchProfiles = [];
		shareWatch.on("child_added", function(snap){
		 	var key = snap.key();
		 	var profile = users.child(key);
		 	shareWatchProfiles.push(profile);
		 	profile.on("value", function(userSnap){
		 		var val = userSnap.val();
		 		val.key = userSnap.key();
		 		var pos = getByID(App.view.currentItem.sharers, key);
		 		if(App.view.currentItem.sharers[pos]){
		 			App.view.currentItem.sharers[pos] = val;
		 		}else{
		 			App.view.currentItem.sharers.unshift(val);
		 		}
		 		riot.update();
		 	});
		});
		shareWatch.on("child_removed", function(snap){
			console.log("removing friend (child)");
			var key = snap.key();
			var pos = getByID(App.view.currentItem.sharers, snap.key());

			if(pos!==-1){
				for(var i = 0 ; i < shareWatchProfiles.length ; i++){
					if(shareWatchProfiles[i].key()=== key){
						shareWatchProfiles[i].off();
						shareWatchProfiles.splice(i, 1);
						break;
					}
				}

				App.view.currentItem.sharers.splice(pos,1);
				// riot.update();
			}
		});
	};

	var addSharer = function(friend){
		var user = {};
		user[friend.key] = true;
		shareWatch.update(user);

		var ufile = {};
		ufile[file.key()] = true;
		users.child(friend.key).child('files').update(ufile);
	};

	var removeSharer = function(friend){
		console.log("remove friend");
		var filekey = file.key();
		var friendkey = friend.key;

		shareWatch.child(friendkey).remove();
		users.child(friendkey).child('files').child(filekey).remove();
		
	};

	var getFriends = function(){
		users.on("child_added", function(snap){
			var key = snap.key();
	 		var val = snap.val();
	 		val.key = key;
			var pos = getByID(App.view.friends, key);
	 		if(App.view.friends[pos]){
	 			App.view.friends[pos] = val;
	 		}else{
	 			App.view.friends.push(val);
	 		}
	 		// console.log(App.view.friends);
			// App.view.friends = snap.val();
		});
	};

	var cleanup = function(){
		// console.log("clean up");
		if(shareWatch){
			shareWatch.off();
			for(var i = 0 ; i < shareWatchProfiles.length ; i++){
				shareWatchProfiles[i].off();
			}
		}
	};



	var getCurrentFileID = function(){
		return file ? file.key() : null;
	};
	var openit;

	var open = function(value){
		cleanup();
		if(value!=="new"){
			file = files.child(value);
		}else{
			file = null;
		}
	};

	var save = function(value, title){
		var date = Firebase.ServerValue.TIMESTAMP;
		if(file){
			file.update({
				text: value,
				date: date,
				lastEditor: auth.deviceID,
				lastEditorName: auth[auth.provider].displayName
			});
			var userFile = user.child('files').child(file.key());
			userFile.setPriority(date);
		}else{
			add(function(data){
				console.log("added");
			},{text:value});
		}

	};

	var remove = function(id, callback){
		if(file){
			var key = file.key();
			file.off();
			file.remove(callback);
			user.child('files').child(key).off();
			user.child('files').child(key).remove();
		}else{
			removeItem('new');
		}
	};

	var migrate = function(migrateAll){
		for(var i = 0 ; i < migrateItems.length ; i++){
			var item = migrateItems[i];
			if(migrateAll){
				add(function(){}, item);
			}else{
				if(item.key!=='intro' && item.key!=='about' ){
					add(function(){}, item);
				}
			}

		}
		App.storage.clear();
	};

	var login = function(){
		var authType = device.mobile() ? 'authWithOAuthRedirect' : 'authWithOAuthPopup';
		firebase[authType]("google", function(error, authData) {
			if (error) {
				console.log("Login Failed!");
			} else {
				console.log("Login Success!");
			}
		}, {
			scope:'email'
		});
	};

	var logout = function(callback){
		firebase.unauth();
	};

	var updateUser = function(authData){

		var userData = authData[authData.provider].cachedUserProfile;
		user.once('value', function(dataSnapshot) {
			var userExists = dataSnapshot.exists();
			// console.log('userExists:'+userExists);
			var obj = {
					provider: authData.provider,
					firstname: userData.given_name,
					lastname: userData.family_name,
					email: userData.email,
					picture: userData.picture,
					lastseen:Firebase.ServerValue.TIMESTAMP
				};
			if(!userExists){
				user.set(obj, function(){
					console.log("Successfully signed up");
					migrate(true);
				});
			}else{
				user.update(obj, function(){
					console.log("Successfully updated");
					migrate();
				});
			}
		}, function(error){
			console.log('oh');
			console.log(error);
		});
	};


	return {
		init:init,
		login:login,
		logout:logout,
		add:add,
		save:save,
		remove:remove,
		load:load,
		getSharers:getSharers,
		getCurrentFileID:getCurrentFileID,
		addSharer:addSharer,
		removeSharer:removeSharer,
		open:open
	};

})();

