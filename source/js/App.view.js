
// Notes
// DOMSubtreeModified is Deprecated
// Mutation Observers are slow
// 'input' is the fastest

App.view = (function () {

	var html, body, 
	selectedElement, 
	currentKey = {keyCode:null},
	adapter = 'storage', // 'storage' or 'cloud'
	sidebar, 
	pullpanels,
	page,
	newfile, 
	files, 
	style, 
	saveTimer, 
	undoManager, 
	oldhtml, 
	oldcursor, 
	opening,
	_display,
	_filtered,
	_filter;

	// Options

	var options = {
		saveDelay:{
			value:300
		},
		appendDate:{
			value: false,
			name: "Append date to <span class='tag' data-id='#done'>#done</span>",
			visible: true
		},
		spellcheck:{
			value: true,
			name: "Spell check",
			visible: false,
			func: function(value){
				edit[0].spellcheck = value;
				edit[0].focus();
				edit[0].blur();
			}
		},
		smallfont:{
			value: false,
			name: "Use small font",
			visible: true,
			func: function(value){
				if(value){
					body.css({'font-size':'15px'});
				}else{
					body.attr('style', '');
				}
			}
		}
	};

	// Option+ shortcuts

	var shortcuts = {
		'68': function(){ // Option+D
			selectedElement.find('.mark').trigger(event_release);
		},
		'38': function(){ // Option+Up
			moveItem(-1);
		},
		'40': function(){ // Option+Down
			moveItem(1);
		},
		'77': function(){ // Option+Down
			body.toggleClass('showMenu');
		}
	};

	// Various defaults

	var _checkbox = ['☐', '-', '-[ ]'];
	var _checkbox_ticked = ['☑', '✔'];
	var _checkbox_invalid = ['☒', '✘'];
	var _bullet = ['•', '*'];
	var _important = ['!'];
	var _important2 = ['!!'];
	var _all = _checkbox.concat(_checkbox_ticked).concat(_checkbox_invalid);

	var _default 	= '<p><br/></p>';
	var tick 		= '<span class="mark tick">'+_checkbox[0]+'</span>';
	var tock 		= '<span class="mark tock">'+_checkbox_ticked[0]+'</span>';
	var invalid 	= '<span class="mark invalid">'+_checkbox_invalid[0]+'</span>';
	var bullet 		= '<span class="bullet">'+_bullet[0]+'</span>';

	var init = function(){

		html 		= $('html');
		body 		= $('body');
		style 		= $('#style');
		edit 		= $("#edit");
		sidebar 	= $("#sidebar");
		page 		= $(".page");
		files 		= $("#files");
		newfile 	= $(".newfile-button");
		settingbut 	= $(".setting-button");
		search 		= $("#search input");
		signin 	= 	$('.signin-google');
		selectedElement = $('<div/>');
		pullpanels = $("#sidebar, .page");

		_display = {
				w:window.innerWidth,
				h:window.innerHeight
		};

		// $("#search").hide();

		riotMenu();
		

		// Setup storage adapter
		App.storage.init();

		// Setup cloud adapter
		App.cloud.init();

		// Bind Actions
		actions();

		// Text Selections
		rangy.init();

		// Search Box
		$(".chosen").chosen().change(runSearch);

		// Undos
		undoManager = new UndoManager();

		// Create Settings
		settings();

		// var sortable = Sortable.create(edit[0],{animation: 150, draggable: ".todo"});

		// Load files from storage when fonts are ready

		// WebFont.load({
		//   custom: {
		//     families: [
		// 	    'AvenirNextLTPro-Medium', 
		// 	    'AvenirNextLTPro-Regular', 
		// 	    'AvenirNextLTPro-UltLt'
		// 	    // 'ticks'
		//     ]
		//   },
		//   active: function(){
		//   	// App.storage.load();
		//   },
		//   inactive: function(){
		//   	// App.storage.load();
		//   }
		// });

		// Remove mobile delay
		FastClick.attach(document.body);

		typed();
	};

	var typed = function(){
		$('.typeahead').textcomplete([{
		    // match: /(^|\s)@(\w{2,})$/,
		    match: /(^|\s)(\w{2,})$/,
		    search: function (term, callback) {
		    	term = term.toLowerCase();
		        callback($.map(friends, function (e) {
		        	if(e.firstname && e.lastname){
			        	if((e.firstname.toLowerCase().indexOf(term)===0 || 
			        		e.lastname.toLowerCase().indexOf(term)===0
			        		) && e.key!==App.view.auth.uid){
			        		return e;//.firstname + " " + e.lastname + " - @" + e.username;
			        	}else{
			        		return null;
			        	}
		        	}else{
		        		return null;
		        	}
		        	// var reg = new RegExp("/"+term+"(\\w+)/");
		        	// return fullname.match(reg) ? e.username : null;
		            // return e.username.indexOf(term) === 0 ? e.username: null;
		        }));
		    },
		    replace: function (word) {
		        return word + ' ';
		    },
		    template: function(e){
		    	return e.firstname + " " + e.lastname;
		    }
		}], {
			// placement: 'bottom|absleft'
		}).on({
        'textComplete:select': function (e, value, strategy) {
			App[adapter].addSharer(value);
        }
    	}
        ).on('focus', function(){
   			$(this).val('');
   		}).on('blur', function(){
   			$(this).val('');
   			// window.scrollTo(0,0);
   		});
	};

	var removeSharer = function(e){
		var item = e.item;

		if(App.view.currentItem.owner !== App.view.auth.uid){
			body.removeClass('info');
			setTimeout(function(){
				App[adapter].removeSharer(item);
			},300);
		}else{
			App[adapter].removeSharer(item);
		}
		e.preventDefault();
		e.stopPropagation();
	};


	var setUser = function(user){
		if(user){
			$('.user').html('signed in as '+user[user.provider].displayName+' <a href="#logout">sign out</a>').show();
			signin.hide();
			adapter = 'cloud';
		}else{
			$('.user').text('').hide();
			signin.show();
			App.view.auth = {uid:'guest'};
			adapter = 'storage';
		}

		App[adapter].load();
	};

	var settings = function(){
		var html = '';
		for(var key in options){
			var a = options[key];
			if(a.visible){
				html += '<div class="row">' + a.name + '<input type="checkbox" id="'+key+'" class="js-switch" '+(a.value ? 'checked':'')+' /><div class="clear"></div></div>';
			}
		}
		$('.settings .middle').html(html);
		var switches = $('.settings input');
		switches.each(function(i,a) {
			var switchery = new Switchery(a, {
				size:'small',
				color: '#3D9970'
			});
			a.onchange = function() {
				var id = $(this).attr('id');
				options[id].value = this.checked;
				if(options[id].func){
					options[id].func(this.checked);
				}
			};
		});

	};

	var addUndo = function(attrs){
		undoManager.add({
		    undo: function() {
				edit.html(attrs.oldhtml);
				extractTags();
				requestAnimationFrame(function(){
					restore(edit[0], 0, attrs.oldcursor);
				});
		    },
		    redo: function() {
				edit.html(attrs.html);
				extractTags();
				requestAnimationFrame(function(){
					restore(edit[0], 0, attrs.cursor);
				});
		    }
		});
	};

	
	// simple markdown parser based on http://pzxc.com/f/posts/34/markdown.js
	var parseMarkdown = function(r){
	    r = r.replace(/\*\*(.*?)\*\*/g, '<strong>**$1**</strong>');
	    r = r.replace(/([^*]|^)\*((?:\*\*|[^*])+)\*(?!\*)/g, '$1<em>*$2*</em>');
	    r = r.replace(/``(.*?)``/g, '<code>``$1``</code>');
	    return r;
	};

	// Parse anything with an identifier, e.g. #tag, #mention
	var parseTags = function(options) {
		var o = options;
		o.end = o.end ? o.end : "";
		o.endEsc = o.end ? "+("+escapeRegExp(o.end)+")" : "";
		o.startEsc = escapeRegExp(o.start);

		var tags = {},
		tagString = [],
		begin;

		if(o.begins){
			begin = "\^(";
		}else{
			begin = "\\B(";
		}

		var reg = new RegExp(begin+o.startEsc+")([\\w-]+)"+o.endEsc,"g");
		var html = o.str.replace(reg, function(u) {
			var word = u.split(o.start)[1];
			var name = o.start+word+o.end;//u.slice(1).split('(')[0];
			tags[word] = tags[word] || {count:0};
			tags[word].name = name;
			tags[word].id = name;
			tags[word].html = "<span class='"+o.type+"' data-id='"+name+"'>"+u+"</span>";
			tags[word].count++;
			return tags[word].html;
		});
		for(var tag in tags){
			tagString.push(o.start+ tag);
		}
		tagString = tagString.join(' ');
		return {
			type:o.type, 
			html:html, 
			tags:tags, 
			tagString:tagString
		};
	};

	var parseLinks = function(str) {
		return {html:linkify(str)};
	};

	var inArr = function(value, arr){
		for(var i = 0 ; i < arr.length ; i++){
			if(value===arr[i]+' '){
				return true;
			}
		}
		return false;
	};

	var parseTodo = function(str, tags) {

		if(str.length<2){
			return {html:str, classStr:''};
		}
		var classStr = '';
		var justNum;

		// Get the first word of the string...
		var start = str.match(/^(.*?)\ /g);
		start = start ? start[0] : "";

		if(inArr(start, _all)){
			var tickEl = '';
			if(str.length>=2){
				tickEl = tick;
			}
			if(tags){
				if(tags.done){
					tickEl = tock;
				}
				if(tags.invalid){
					tickEl = invalid;
				}
			}
			str = tickEl + " " + str.slice(2);
			classStr = 'todo';
		}else if(inArr(start, _important)){
			classStr = 'important';
		}else if(start === '# '){
			classStr = 'heading1';
		}else if(start === '## '){
			classStr = 'heading2';
		}else if(start === '### '){
			classStr = 'heading3';
		}else if(start === '#### '){
			classStr = 'heading4';
		}else if(inArr(start, _bullet)){
			str = bullet + " " + str.slice(start.length);
			classStr = 'bullet';
		}else if(start.match(/^([0-9]+\.\ )/g) && str.length>=2){
			justNum = start.slice(0,-1);
			str = "<span class='number'>"+justNum+"</span> " + str.slice(start.length);
			classStr = 'numbered';
		}

		return {html:str, classStr:classStr, num:parseFloat(justNum)};
	};

	var parseTitles = function(str){
		var end = str.slice(-1);
		return {html:str, classStr: end===':' ? ' title ' : ''};
	};


	var actions = function(){

		// Essential to focus
		// bindEditKeyActions()


		document.delayFocus = function(){
			requestAnimationFrame(function(){
				setFocus();
			});
		};

		var mc = new Hammer(body[0], {
			velocity:0.9
		});
		mc.on('swiperight', function(ev) {
		   	body.addClass('showMenu');
		}).on('swipeleft', function(ev) {
		   	body.removeClass('showMenu');
		});

		edit.on(click, 'p', function(){
			setFocus($(this));
			// $(this).focus();
		});
		// edit.on(event_down, 'p', function(){
		// 	edit.focus();
		// });

		edit.on(event_release, 'p', function(e){
			requestAnimationFrame(function(){
				setFocus();
			});
			// e.preventDefault();
			// e.stopPropagation();
		});


		edit.on(event_release, '.mark', toggleDone).on(event_down, '.mark', prevent);
		body.on(click, 'a', openURL);
		body.on(click, '.internal', runInternal);

		var tagDelay;
		edit.on('input', function(e){
			var value = edit.text();
			if(!value){
				setDefault();
				saveFile();
				return false;
			}else{
				edit.removeClass('empty');
			}

			if(opening){
				return false;
			}

			setFocus();
			if(selectedElement){
				formatLine();
			}

			saveFile();
		}).on(event_down, function(){
			// console.log("down");
			// body.addClass('hideMenu').removeClass('settings info');
		}).on('focus', function(){
			bindEditKeyActions(true);
			if(App.view.currentItem.key==='new'){
				window.scrollTo(0,0);
			}
		}).on('blur', function(){
			bindEditKeyActions(false);
		});
		
		// iNoBounce.disable();

		edit[0].addEventListener("copy", copy);
		edit[0].addEventListener("paste", paste);


		newfile.on(click, function(){
			add();
		});

		settingbut.on(click, function(){
			body.toggleClass('settings');
		});

		signin.on(click, App.cloud.login);

		$('.close, .menu').on(click, function(){
			if(body.hasClass('settings') || body.hasClass('info')){
				body.removeClass('settings info');
			}else{
				body.toggleClass('showMenu');
			}
		});

		$('.cover').on(event_down, function(){
			body.removeClass('settings info showMenu');
		});

		// URL ROUTING
		// riot.route(function(id) {
		// 	console.log(id);
		// 	open(id);
		// });


		// body.on(event_down, function(e){
		// 	var start = touch(e).x;
		// 	var dir = 0;
		// 	var moved = 0;
		// 	var x = 0;
		// 	var oldX = 0;
		// 	var enabled = false;
		// 	// if(!body.hasClass('showMenu')){
		// 		body.on(event_move, function(e){
		// 			x = touch(e).x;
		// 			moved = x-start;
		// 			dir = x>oldX ? 1 : -1;
					
		// 			if(moved > 80 && !enabled){
		// 				// iNoBounce.enable();
		// 				enabled = true;
		// 				body.addClass('showMenu');
		// 				body.off(event_move).off(event_release);
		// 			}else if(moved < -80 && !enabled){
		// 				body.removeClass('showMenu');
		// 				enabled = true;
		// 				body.off(event_move).off(event_release);
		// 				// iNoBounce.disable();
		// 			}
		// 			// if(enabled){
		// 			// 	pullMenu(moved);
		// 			// }
		// 			oldX = x;
		// 		});
		// 		// body.on(event_release, function(){
		// 		// 	iNoBounce.disable();
		// 		// 	body.off(event_move).off(event_release);
		// 		// 	// endPullMenu(x, dir);
		// 		// });
		// 	// }
		// });

	};

	var limit = function(value, min, max){
		return Math.min(Math.max(value, min), max);
	};

	var add = function(){
		var newObj = {text:"", active:true, key:"new"};
		App.view.items.unshift(newObj);
		open({item:newObj});
	};

	var pullMenu = function(x){
		// console.log(y);
		body.addClass("moving");
		pullpanels.attr("style", "");

		var pc = (x/_display.w);

		var xlimit1 = limit(-100 + (100*pc), -100, 0);// limit(pc, -100, 0);
		var xlimit2 = limit(75*pc, 0, 75);

		// window.scrollTo(0,0);
		// console.log( xlimit1 );
		sidebar.css({"-webkit-transform":"translate3d("+xlimit1+"%, 0, 0)"});

		// var z = limit((-100+(y/5)), -100, 0);
		page.css({"-webkit-transform":"translate3d("+xlimit2+"%, 0, 0)"});

		// var a = limit((1-(y/_display.h)), 0, 1);
		// cover.css({"background-color":"rgba(51,51,51,"+a+")"});
	};


	var endPullMenu = function(x, direction){
	
		var speed = Math.floor(300 * (x) / _display.w) + 'ms';

		$([sidebar, page]).each(function() {
			$(this).attr("style", "").css({
				"-webkit-transition-duration":speed,
				"-webkit-transition-timing-function": "ease-out"
			}).bind(transition, function(){
				$(this).removeAttr("style");
				$(this).unbind(transition);
			});
		});

		body.removeClass("moving");
		if(x<100 || direction===-1){ // Threshold
			return false;
		}
		// cover.attr("style","");
		body.addClass('showMenu');
	};


	//var keyboardTimer; 
	var bindEditKeyActions = function(value){
		var wtop;
		if(value){
			$(window).on('keydown', editKeyActions).on('keyup', function(){
				currentKey = {keyCode:null};
			});
			

			// Complicated stuff for mobile
			body.addClass('editing');
			// keyboardTimer = setTimeout(function(){
			// 	if(body.hasClass('editing')){
			// 		var top = $(".page").scrollTop();
			// 		wtop = $(window).scrollTop();
			// 		body.addClass('keyboard');
			// 		$('.page').scrollTop(0);
			// 		window.scrollTo(0, wtop+top);
			// 	}
			// }, 600);
		}else{
			// clearTimeout(keyboardTimer);
			$(window).off('keydown').off('keyup');
			// wtop = $(window).scrollTop();
			// body.removeClass('editing keyboard');
			// $('.page').scrollTop(wtop);
			// window.scrollTo(0, 0);

		}
	};

	var editKeyActions = function(e){
		currentKey = {
			keyCode: e.keyCode,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			metaKey: e.metaKey,
			shiftKey: e.shiftKey
		};
		if(currentKey.metaKey){
			if(shortcuts[currentKey.keyCode]){
				shortcuts[currentKey.keyCode]();
				e.preventDefault();
				return;
			}
		}

		var selection, start, end,
		newStr,
		oldStr,
		text,
		pos,
		isTodo,
		isTitle,
		isEnd,
		isBullet,
		isNumbered,
		newNumber,
		iStart;

		// If backspace is pressed, let's do some magic...

		if(e.keyCode === 8){
			isTodo = selectedElement.hasClass('todo');
			isBullet = selectedElement.hasClass('bullet');
			isNumbered = selectedElement.hasClass('numbered');

			if(!isTodo && !isBullet && !isNumbered){
				return;
			}

			selection = save(selectedElement[0])[0].characterRange;
			start = selection.start;

			if((isNumbered && start>3) ||  ((isTodo || isBullet) && start>2)){
				return;
			}

			end = selection.end;
			text = selectedElement.text();
			pos = text.length;
			newStr = text.substr(end, pos-end);
			oldStr = text.substr(0, start);
			
			// isTitle = selectedElement.hasClass('title');
			isEnd = end===pos;
			isStart = start===0;
			// console.log($.trim(oldStr));
			if($.trim(oldStr)===_checkbox[0] || $.trim(oldStr)===_bullet[0] || ($.trim(oldStr).match(/(\w+)\.$/g) && isNumbered) ){
				newStr = !newStr ? '<br/>' : newStr;
				selectedElement.html(newStr).removeClass('todo bullet numbered');
				setCursor(selectedElement[0]);
				if(isNumbered){
					newNumber = parseFloat(oldStr.match(/(^[0-9]+)/g))-1;
					reNumber(selectedElement, newNumber);
				}
				// formatLine(selectedElement[0]);
				e.preventDefault();
				saveFile(true);
				// document.delayFocus();
				return;
			}
		}
		// If return is pressed, let's do some magic...

		if(e.keyCode === 13) {
			selection = save(selectedElement[0])[0].characterRange;
			start = selection.start;
			end = selection.end;
			text = selectedElement.text();
			pos = text.length;
			newStr = text.substr(end, pos-end);
			oldStr = text.substr(0, start);
			cursorOffest = 0;
			isTodo = selectedElement.hasClass('todo');
			isBullet = selectedElement.hasClass('bullet');
			isNumbered = selectedElement.hasClass('numbered');
			isTitle = selectedElement.hasClass('title');
			isEnd = end===pos;
			isStart = start===0;
			var additions = newStr;
			

			if(isTodo && !parseTodo(newStr).classStr){
				additions = '- '+additions;
				cursorOffest = 2;
			}else if(isBullet){
				additions = '* '+additions;
				cursorOffest = 2;
			}else if(isNumbered){
				newNumber = parseFloat(oldStr.match(/(^[0-9]+)/g))+1;
				additions = newNumber+". "+additions;
				cursorOffest = newNumber.toString().length+2;
			}

			if(!text || isTodo || (isTitle && !isEnd)){
				selectedElement.attr('class', '').removeAttr('data-id data-children');
			}

			var parentTitle = isTitle ? selectedElement : selectedElement.prevAll('.title').eq(0);
			var parentTags = $.trim(parentTitle.attr('data-id'));

			if(parentTags){
				additions += ' '+parentTags;
			}

			if(_filtered){
				additions += " "+_filter;
			}

			if($.trim(oldStr)===_checkbox[0] || $.trim(oldStr)===_bullet[0] || ($.trim(oldStr).match(/(\w+)\.$/g) && isNumbered) ){
				newStr = !newStr ? '<br/>' : newStr;
				selectedElement.html(newStr).removeClass('todo bullet numbered');
				setCursor(selectedElement[0]);
				e.preventDefault();
				if(isNumbered){
					newNumber = parseFloat(oldStr.match(/(^[0-9]+)/g))-1;
					reNumber(selectedElement, newNumber);
				}
				saveFile(true);
				document.delayFocus();
				return;
			}else if( (isNumbered && !isStart) || (isBullet && !isStart) || (isTodo && !isStart) || (isTitle && !isEnd && !isStart) || parentTags || _filtered){
				newStr = additions;
				newStr = !newStr ? '<br/>' : newStr;
				selectedElement.text(oldStr);
				formatLine();
				var newP = $('<p>'+newStr+'</p>');
				newP.insertAfter(selectedElement);
				setCursor(newP[0], cursorOffest);
				setFocus();
				formatLine(newP);
				if(isNumbered){
					reNumber(selectedElement, newNumber);
				}
				saveFile(true);
				document.delayFocus();
				e.preventDefault();
				return;
			}

		}

		if(e.keyCode === 40){ // Down arrow
			selection = save(selectedElement[0]);

			// Fix selection overflow
			var len = selectedElement.next().text().length;
		    if(selection[0].characterRange.start > len){
		    	selection[0].characterRange.start = len;
		    	selection[0].characterRange.end = len;
		    }

			restore(selectedElement.next()[0], 0, selection);
			document.delayFocus();
			e.preventDefault();
			return;
		}

		document.delayFocus();

		if (!e.metaKey || e.keyCode !== 90) {
			return;
		}

		if (e.shiftKey && e.metaKey && e.keyCode===90) {
			// Detect Redo
			if(undoManager.hasRedo()){
				undoManager.redo();
			}
		}else if(e.metaKey && e.keyCode===90) {
			// Detect Undo
			if(undoManager.hasUndo()){
				undoManager.undo();
			}
		}
	};

	var saveFile = function(instant){
		// To be improved....
		clearTimeout(saveTimer);
		saveTimer = setTimeout(function() {
				extractTags();
				var html = edit.html();
				var cursor = save(edit[0]);
				if(html!==oldhtml){
					addUndo({
						oldhtml:oldhtml,
						html:html,
						oldcursor:oldcursor,
						cursor:cursor
					});
					var txt = getAllText();
					App[adapter].save(txt);
					App.storage.store('localcopy', txt);
					// App.storage.store('files', App.view.items);
				}
				oldhtml = html;
				oldcursor = cursor;
		}, instant ? 0 : options.saveDelay.value);
	};

	var showInfo = function(){
		body.addClass('info');
	};
	var hideInfo = function(){
		body.removeClass('info');
	};

	var copy = function(e){
		// e.preventDefault();
		// console.log(e);
		// e.clipboardData.setData("text/html", rangy.getSelection().toHtml());
		// e.clipboardData.setData("text/liszt", 'local');
	};


	var paste = function(e){
		e.preventDefault();

		var selection = save(edit[0])[0].characterRange;
		var start = selection.start;
		var end = selection.end;

		var text = e.clipboardData.getData("text/plain");
		text = p(text);

		document.execCommand("insertHTML", false, text);

		opening = true;
		edit.find('p').each(function(i, a){
			formatLine($(a));
		});
		opening = false;
	};


	var openURL = function(e){
		var url = $(this).attr('href');
		if(url.slice(0,1)==='#'){
			App.view[url.slice(1)]();
		}else{
			window.open(url, '_blank');
		}
		e.preventDefault();
		e.stopPropagation();
		return;
	};

	var runInternal = function(e){
		var id = $(this).data().id;
		if(id==='[google]'){
			App.cloud.login();
		}
		e.preventDefault();
	};

	var runSearch = function(){

		var chosen = $(".chosen option:selected");

		var value = [];
		$(chosen).each(function(i,a){
			value.push($(this).attr('value'));
		});

		if(value){
			value = value.join(' ');
		}else{
			value = '';
		}

		var tags = parseTags({
			str:value, 
			type:'tag',
			start:'#'
		}); 
		var mentions = parseTags({
			str:value, 
			type:'mention', 
			start:'@'
		}); 
		filterPage($.extend(tags.tags, mentions.tags));
	};


	var p = function(t){
	    t = $.trim(t);
	    return (t.length>0?'<p>'+t.replace(/\r?\n/g,'</p><p>')+'</p>':'').replace(/<p><\/p> | <p><br><\/p>/g, '');
	};

	var moveItem = function(direction){
		save(selectedElement[0]);
		if(direction===1){
			selectedElement.insertAfter(selectedElement.next());
		}else{
			selectedElement.insertBefore(selectedElement.prev());
		}
		restore(selectedElement[0]);
		selectedElement.addClass('blink').on(animation, function(){
			$(this).removeClass('blink');
		});
	};

	var reNumber = function(container, num){
		num+=1;
		container.nextAll('p').each(function(i,a){
			var _that = $(a);
			var isNumbered = _that.hasClass('numbered');
			if(isNumbered){
				_that.find('.number').text(num+'.');
				num++;
			}else{
				return false;
			}
		});
	};

	var escapeRegExp = function(str) {
	  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	};

	var formatLine = function(node){
		var container = node || selectedElement;
		var prev = 		container.prev();
		var text = 		container.text();
		var titles = 	parseTitles(text);

		

		var tags = 	parseTags({
			str:titles.html, 
			type:'tag', 
			start:'#'
		}); 
		var mentions = 	parseTags({
			str:tags.html, 
			type:'mention', 
			start:'@'
		}); 
		var links = 	parseLinks(mentions.html);
		var internals = parseTags({
			str:links.html, 
			type:'internal', 
			start:'[', 
			end:'\\]'
		});

		var todo = 		parseTodo(internals.html, tags.tags);
		var mkdown = parseMarkdown(todo.html);
		var newText = 	mkdown;

		// Apply classes
		var attr = tags.tagString+' '+mentions.tagString;

		// Default empy text
		newText = newText ? newText : "<br/>";

		if(!opening){
			save(container[0]);
		}

		container.html(newText)
		.attr("class", titles.classStr + todo.classStr)
		.attr("data-id", attr);

		// if(todo.classStr==='numbered'){
		// 	reNumber(container, todo.num);
		// }

		if(!opening){
			restore(container[0]);
		}
	};



	var getAllText = function(){
		// return edit[0].innerText;
		var text = [];
		var nodes = edit.find('p');
		nodes.each(function(i, a){
			var node = $(a);
			text.push($.trim(node.text())+'\n');
		});
		return  text.join('');
	};

	var parseAll = function(){
		var nodes = edit.find('p');
		var nodesLength = nodes.length;
		var groupTitle;
		
		var text = '';
		var tagStr = '';
		var oldNode;
		var gt;

		nodes.each(function(i, a){
			var node = $(a);
			var nodeTags;
			var classList = node[0].classList;
			var isTitle = classList.contains('title');
			groupTitle = isTitle ? node : groupTitle;
			if(groupTitle!==oldNode){
				tagStr = '';
				gt = groupTitle;
			}

			text += node.text()+'\n';

			if(!isTitle){
				tagStr += node.attr('data-id')+' ';
			}
			if(gt){
				gt.attr('data-children', $.trim(tagStr));
			}
			oldNode = groupTitle;
		});
		return text;
	};


	var addSearchOptions = function(options){
		// console.log("addSearchOptions");
		if($.isEmptyObject(options[0].tags) && $.isEmptyObject(options[1].tags)){
			// console.log("addSearchOptions:hide");
			$("#search").hide();
			return;
		}
		var html = '', filters;
		
		if(_filtered){
			filters = _filter.split(' ');
		}else{
			filters = [];
		}

		for(var group in options){
			html += '<optgroup label="'+options[group].group+'">';
			for(var key in options[group].tags){
				var tag = options[group].tags[key].id;
				html += '<option value='+tag+' data-type="file" ';
				html += $.inArray(tag, filters)!== -1 ? 'selected' : '';
				html += '>'+tag+'</option>';
			}
			html += '</optgroup>';
		}
		$('.chosen').html(html).trigger("chosen:updated");
		$("#search").show();
	};

	var extractTags = function(){

		var text = 		parseAll();
		
		// updateFileListItem(text);

		var tags = 	parseTags({
					str:text, 
					type:'tag', 
					start:'#'
				}).tags;
		var mentions = 	parseTags({
					str:text, 
					type:'mention', 
					start:'@'
				}).tags;
		// var files = 	[{id:'Welcome...'}, {id:'Today...'}];
		// {group:'Files', tags:files}
		addSearchOptions([{group:'Tags', tags:tags}, {group:'Mentions', tags:mentions}]);

	};



	var filterPage = function(items){
		var html = '#edit p{display:none;} ';
		var htmlTags = '#edit p';
		var htmlTitles = '#edit p';
		_filter = '';
		for(var key in items){
			var tag = items[key].id;
			htmlTags 	+= '[data-id~="'+tag+'"]';
			htmlTitles 	+= '[data-children~="'+tag+'"]';
			_filter += tag+' ';
		}
		html += htmlTags+','+htmlTitles+'{display:block;}\n';
		style.html(html);
		_filtered = true;
	};

	var setAndParse = function(file, clear, restoreCursor){

		if(!file){
			return false;
		}

		var value = $.trim(file.text);


		var currentValue = getAllText();
		if(value===currentValue){
			console.log('updateCancelled');
			return;
		}
		
		style.html('');

		var text, isReset;

		edit.removeClass('empty');

		_filter = '';
		$('.chosen').val('').trigger('chosen:updated');

		
		if(!value){
			text = _default;
			isReset = true;
			edit.addClass('empty');
		}else{
			text = p(value);
			isReset = false;
		}

		opening = true;
		if(restoreCursor){
			save(edit[0]);
		}
		edit.html(text);
		edit.find('p').each(function(i, a){
			formatLine($(a));
		});
		if(restoreCursor){
			restore(edit[0]);
		}
		// edit.trigger('input');
		selectedElement = edit.find('p').eq(0);

		opening = false;

		oldhtml = edit.html();
		if(isReset){
			oldcursor = save(edit[0]);
			
		}
		
		setTimeout(function(){
			if(isReset && !clear && !restoreCursor){
				// console.log(device.mobile());
				if(file.key==='new'){
					
					if(device.mobile()){
						body.removeClass('showMenu');
						setTimeout(function(){
							setCursor();
							
						}, 300);
					}else{
						window.scrollTo(0, 0);
						setCursor();
					}
				}
				
			}
			if(!clear){
				extractTags();
			}

		},1);


	

		if(file.key!=='new'){
			App.storage.store('localcopy', value);
		}
	};

	var setCursor = function(el, pos){
		pos = !pos ? 0 : pos;
		var range = rangy.createRange();
		range.setStart(el ? el.childNodes[0] : edit[0].childNodes[0], pos);
		range.collapse(true);
		var sel = rangy.getSelection();
		sel.setSingleRange(range);
	};


	/* Work out which line is currently in focus */

	var setFocus = function(el){
		edit.find('.active').removeClass('active');
		if($(el).is('p')){
			selectedElement = el;
			selectedElement.addClass('active');
			return false;
		}

		var node = window.getSelection().focusNode;
		oldSelectedElement = selectedElement;

		if(node && !$(node).is('p')){
			node = node.parentNode;
		}

		selectedElement = $(node);
		// Fix for children

		/*if(selectedElement.is('section')){
			selectedElement = oldSelectedElement;
		}else */if(!selectedElement.is('p')){
			selectedElement = selectedElement.parents('p');
		}
		// console.log(selectedElement);
		if(selectedElement){
			selectedElement.addClass('active');
		}
	};

	var prevent = function(e){
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
	};

	var toggleDone = function(e){
		var that = $(this);

		if(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
		}


		var val = that.text();

		// console.log(that[0]);

		var checked = inArr(val+' ', _checkbox_ticked) ? true : false;
		var invalid = inArr(val+' ', _checkbox_invalid) ? true : false;

		
		var parent = that.parents('p');

		var isSelected;
		if(selectedElement[0]===parent[0]){
			isSelected = true;
		}

		save(selectedElement[0]);

		that.replaceWith(checked || invalid ? tick : tock);

		var newP;

		if(!checked && !invalid){
			// add tags
			var date = options.appendDate.value ? moment().format("(MMM,Do HH:mm)") : '';
			newP = $("<p>"+$.trim(parent.text())+" #done "+date+"</p>");
			parent.replaceWith(newP);
		}else{

			var str;
			// remove tags
			if(checked){
				str = parent.text().replace(/#done+(.*?)\((.*?)\)+|#done/g, '');
			}
			if(invalid){
				str = parent.text().replace(/#done+(.*?)\((.*?)\)+|#done| #invalid/g, '');
			}

			newP = $("<p>"+str+"</p>");
			parent.replaceWith(newP);
			
		}

		if(isSelected){
			restore(newP[0]);
		}else{
			restore(selectedElement[0]);
		}

		formatLine(newP);
		setFocus();

		saveFile(true);
		// extractTags();
	};



	var setDefault = function(){
		edit.html(_default);
		edit.addClass('empty');
		setCursor();
	};


	var riotMenu = function(){
		riot.mount('files');
	    riot.mount('shared');
	    riot.mount('info');
	    riot.mount('sharedsmall');
	};

	this.items = [];
	this.currentItem = null;
	this.friends = [];
	this.lastOpened = null;
	this.auth = null;

	var open = function(e){
		var item;
		if(e.item){
			item = e.item;
			// riot.route(item.key);
			// return;
		}else{
			var pos = getByID(App.view.items, e);
			item = App.view.items[pos];
			if(!item){
				return;
			}
		}
		
		if(App.view.currentItem){
			App.view.currentItem.active = false;
		}
		for(var i = 0 ; i < App.view.items.length ; i++){
			App.view.items[i].active = false;
		}
		
		item.active = true;

		riot.update();

		App.view.currentItem = item;


		// .find('option'); //.removeAttr('selected').end().trigger('chosen:updated');//.trigger("chosen:updated");
		// console.log(sel);

		App[adapter].open(item.key);
		App[adapter].getSharers(item.key);
		App.storage.store('last', item.key);

		window.scrollTo(0, 0);
		$('.page').scrollTop(0);
		setAndParse(item);
		riot.update();
		typed();
	};

	var remove = function(e){
		var r = confirm("Are you sure you want to delete this document?");
		if(r){
			body.removeClass('info');
			setTimeout(function(){
				App[adapter].remove();
			},300);
		}

		e.preventDefault();
		e.stopPropagation();
	};

	var info = function(e){
		showInfo();
		e.preventDefault();
		e.stopPropagation();
	};


	var trimmedTitle = function(value){
		var title = $.trim(value.split('\n', 1)[0]);
		title = title.length > 25 ? title.substr(0,25) : title;
		return title || '...';
	};

	var logout = function(){
		App.cloud.logout(setUser);
	};

	return {
		init:init,
		setAndParse:setAndParse,
		setUser:setUser,
		trimmedTitle:trimmedTitle,
		logout:logout,
		items:items,
		currentItem:currentItem,
		friends:friends,
		open:open,
		remove:remove,
		info:info,
		options:options,
		showInfo:showInfo,
		hideInfo:hideInfo,
		removeSharer:removeSharer,
		lastOpened:lastOpened,
		auth:auth,
		add:add,
		typed:typed
	};

})();

