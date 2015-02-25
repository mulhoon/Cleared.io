App.cloud = (function () {

	var 
	firebase, 
	users, 
	user, 
	files, 
	file;

	var init = function(){
		firebase = new Firebase("https://cleared.firebaseio.com/");
		users = firebase.child("users");
		firebase.onAuth(authCallback);
	};

	var authCallback = function(authData) {
	  if (authData) {
	  	user = authData;
	  	files = users.child(user.uid).child('files');
	    console.log("User " + authData.uid + " is logged in with " + authData.provider);
	  } else {
	  	user = null;
	  	files = null;
	  	file = null;
	    console.log("User is logged out");
	  }
	  App.view.setUser(user);
	};

	var add = function(callback){
		file = files.push({
			date: Firebase.ServerValue.TIMESTAMP,
			text:""
		}, function(){
			callback(file.key());
		});
	};

	var load = function(callback){
		files.orderByChild("date").on("value", function(snapshot) {
			callback(snapshot.val(), file ? file.key() : null);
		});
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

	var save = function(value){
		var date = Firebase.ServerValue.TIMESTAMP;
		file.update({
			text: value,
			date: Firebase.ServerValue.TIMESTAMP
		});
	};

	var remove = function(id, callback){
		file.remove(callback);
	};

	var migrate = function(){
		var _files = App.storage.get();
		for(var key in _files){
			if(key!=='intro'){
				files.push(_files[key]);
			}
		}
		App.storage.clear();
	};

	var login = function(){
		firebase.authWithOAuthPopup("google", function(error, authData) {
			if (error) {
				console.log("Login Failed!", error);
			} else {
				users.child(authData.uid).once('value', function(dataSnapshot) {
					var userExists = dataSnapshot.exists();
					if(!userExists){
						users.child(authData.uid).set({
							provider: authData.provider,
							name: authData.google.displayName
						}, function(e){
							
						});
						console.log("Successfully signed up");
					}else{
						console.log("Successfully signed in");
					}
					migrate();
				});
			}
		});
	};

	var logout = function(callback){
		firebase.unauth();
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

