App.cloud = (function () {

	var 
	firebase, 
	auth,
	users, 
	user, 
	files, 
	file;

	var init = function(){
		firebase = new Firebase("https://cleared.firebaseio.com/");
		users = firebase.child("users");
		files = firebase.child("files");
		firebase.onAuth(authCallback);
	};

	var authCallback = function(authData) {
		if (authData) {
			auth = authData;
			user = users.child(authData.uid);
			updateUser(authData);
			console.log("User " + authData.uid + " is logged in with " + authData.provider);
		} else {
			auth = null;
			file = null;
			user = null;
			console.log("User is logged out");
		}
		App.view.setUser(auth);
	};

	var add = function(callback, data){
		var date = Firebase.ServerValue.TIMESTAMP;
		var obj = {
			date: date,
			text: data ? data.text || "" : "",
			users:{}
		};
		obj.users[auth.uid] = true;
		file = files.push(obj, function(){
			var userFile = user.child('files').child(file.key());
			userFile.set({
				text: data ? data.title || "" : "",
				date: date
			}, function(){
				if(callback){
					callback(file.key());
				}
			});
			userFile.setPriority(date);
			
		});

	};

	var load = function(callback){
		user.child('files').orderByPriority().on("value", function(snapshot){
			console.log(snapshot.val());
			callback(snapshot.val(), file ? file.key() : null);
		});
		// files.orderByChild("date").on("value", function(snapshot) {
		// 	callback(snapshot.val(), file ? file.key() : null);
		// });
	};

	var getCurrentFileID = function(){
		return file ? file.key() : null;
	};

	var open = function(value, callback){
		file = files.child(value);
		file.once("value", function(snapshot) {
			console.log('file triggered');
			callback(snapshot.val());
		});
	};

	var save = function(value, title){
		var date = Firebase.ServerValue.TIMESTAMP;
		file.update({
			text: value,
			date: date
		});
		var userFile = user.child('files').child(file.key());
		userFile.update({
			text: title,
			date: date
		});
		userFile.setPriority(date);
		user.update({
			lastseen: date
		});

	};

	var remove = function(id, callback){
		var key = file.key();
		file.remove(callback);
		user.child('files').child(key).remove();
	};

	var migrate = function(){
		var _files = App.storage.get();
		// var callback = function(){
		// 	App.storage.clear();
		// };
		for(var key in _files){
			if(key!=='intro'){
				// files.push(_files[key]);
				add(null, _files[key]);
			}
		}
		App.storage.clear();
	};

	var login = function(){
		firebase.authWithOAuthPopup("google", function(error, authData) {
			if (error) {
				console.log("Login Failed!", error);
			} else {

			}
		}, {
			scope:'email'
		});
	};

	var logout = function(callback){
		firebase.unauth();
	};

	var updateUser = function(authData){
		console.log("updateUser");
		console.log(authData[authData.provider]);
		user.once('value', function(dataSnapshot) {
			var userExists = dataSnapshot.exists();
			if(!userExists){
				console.log('no user');

				user.set({
					provider: authData.provider,
					firstname: authData[authData.provider].cachedUserProfile.given_name,
					lastname: authData[authData.provider].cachedUserProfile.family_name,
					email: authData[authData.provider].email,
					lastseen:Firebase.ServerValue.TIMESTAMP
				}, function(){
					console.log("Successfully signed up");
					migrate();
				});
			}else{
				console.log('already a user');
				user.update({
					lastseen:Firebase.ServerValue.TIMESTAMP
				});
				migrate();
			}
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
		getCurrentFileID:getCurrentFileID,
		open:open
	};

})();

