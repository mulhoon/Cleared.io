App.view = (function () {

	var area, input, debug, li, but, space, curtain, selectedElement, tagEl, style,

	_tags = {}, 
	_mentions = {};

	var _default = '<p><br/></p>';
	var tick = '<span class="mark tick">☐</span>';
	var tock = '<span class="mark tick">☑</span>';
	var invalid = '<span class="mark invalid">☒</span>';
	var done = '<span class="done"> @done</span>';

	var init = function(){
		console.log("All ready!");

		App.storage.init();

		style = $('#style');
		area = $("#area");
		edit = $("#edit");
		tagEl = $("#tags");
		debug = $("#debug");
		input = $('#area2 .text');
		li = $("<li/>");
		but = $("<div class='but' />")[0];
		space = $("<div class='space' />")[0];
		curtain = $(".curtain");
		actions();
	};

	var parseTags = function(str, notags) {
		var tags = {};
		var newStr = str.replace(/[#]+[A-Za-z0-9-_():,/]+/g, function(u) {
			var name = u.slice(1).split('(')[0];
			tags[name] = "<span class='tag' data-id='"+name+"'>"+u+"</span>";
			return notags ? "" : tags[name];
		});
		return {str:newStr, tags:tags};
	};

	var parseMentions = function(str, notags) {
		var mentions = {};
		var newStr = str.replace(/[@]+[A-Za-z0-9-_():,/]+/g, function(u) {
			var name = u.slice(1).split('(')[0];

			mentions[name] = "<span class='mention' data-id='"+name+"'>"+u+"</span>";
			return notags ? "" : mentions[name];
		});
		return {str:newStr, mentions:mentions};
	};

	var parseTodo = function(str, tags, el) {
		var classStr = '';
		var start = str.slice(0,2);
		// el.removeClass('todo done invalid');

		if(start === '- ' || start === '☐ ' || start === '☑ ' || start === '☒ '){

			var tickEl = '';
			if(str.length>=2){
				// el.addClass('todo');
				tickEl = tick;
			}
			if(tags.done){
				// el.addClass('done');
				tickEl = tock;
			}
			if(tags.invalid){
				// el.addClass('invalid');
				tickEl = invalid;
			}

			str = tickEl + " " + str.slice(2);
			classStr = 'todo';
		}

		return {text:str, todo:classStr};

		// return str.replace(/- |☐/g, function(u) {
		// 	return "<span class='tick'>☐</span>";
		// });
	};

	var parseTitles = function(str, el){
		var end = str.slice(-1);
		return {str:str, classStr: end===':' ? ' title' : ''};
	};


	var shortcuts = {
		'68': function(){ // Option+D
			selectedElement.find('.mark').trigger(event_down);
		}
	};

	var currentKey;

	var actions = function(){
		edit.on('keydown', function(e){
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
				}
			}
			requestAnimationFrame(function(){
				setFocus();
			});
			
		}).on('keyup', function(){
			currentKey = null;
			setFocus();
		});

		// document.onkeyup = setFocus;
		document.onmouseup = setFocus;

		edit.on(event_down, '.mark', toggle);
		edit.on('DOMSubtreeModified', 'p', formatLine);
		tagEl.on(event_down, '.tag', toggleTag);

		// setAndParse();
		App.storage.load();

		var tagDelay;
		edit.on('input', function(e){
			App.storage.save();
			clearTimeout(tagDelay);
			tagDelay = setTimeout(function(){
				extractTags();
			}, 500);
		});
		


		edit[0].addEventListener("paste", function(e) {
		    // cancel paste
		    e.preventDefault();

		    // get text representation of clipboard
		    var text = e.clipboardData.getData("text/plain");

		    // console.log(text);
		    text = p(text).replace('<p></p>','').replace('<p><br></p>','');
		    // console.log(text);
		    // text = text
		    // .replace(/<br(\s*)\/*>/ig, '\n')
		    // .replace(/<[p|div]\s/ig, '\n$0')
		    // .replace(/(<([^>]+)>)/ig, "");
		    // insert text manually
		    document.execCommand("insertHTML", false, text);
		    setAndParse(null, true);
		    // edit.html(text);
		});
	};

	var p = function(t){
	    t = t.trim();
	    return (t.length>0?'<p>'+t.replace(/\r?\n/g,'</p><p>')+'</p>':null);
	};

	var extractTags = function(){
		var text = edit[0].innerText;
		var tags = parseTags(text, true).tags;
		var mentions = parseMentions(text, true).mentions;

		var html;
		if(tags){
			html = 'Tags:<div class="tags">';
			for(var tag in tags){
				html += tags[tag];
			}
			html += "</div>";
		}
		if(mentions){
			html += 'Mentions:<div class="mentions">';
			for(var mention in mentions){
				html += mentions[mention];
			}
			html += "</div>";
		}
		tagEl.html(html);
		// console.log(tags);
	};

	var toggleTag = function(e){
		var that = $(this);
		var toggle = !that.hasClass('active');
		var id = that.data().id;
		that.toggleClass('active', toggle);
		hideItems();
	};

	var hideItems = function(ids){
		
		var activeItems = tagEl.find('.tag.active');
		if(!activeItems.length){
			style.html('');
			return;
		}
		var html = '#edit p{display:none;} #edit p';
		$(activeItems).each(function(i, a){
			var that = $(this);
			html += '.'+that.data().id;
			// html += '#edit p.title:not(p.'+that.data().id+' ~ p.title){display:block;}\n';
		});
		html += '{display:block;}\n';

		style.html(html);
		console.log(html);
	};

	var setAndParse = function(value, nofocus){
		if(!nofocus){
			edit.focus();
		}
		if(value){
			save();
			edit.html(value);
			restore();
		}
		

		// save();
		edit.find('p').trigger('DOMSubtreeModified');
		setCursorToEnd(edit.find('p').last()[0]);
		extractTags();
		// 
	};


	var setFocus = function(el, force){
		edit.find('.active').removeClass('active');
		
		// if(force){
		// 	selectedElement = el;
		// 	selectedElement.addClass('active');
		// 	return;
		// }
		// if(el.type !== 'mouseup'){
		// 	selectedElement = el;
		// 	selectedElement.addClass('active');
		// 	return;
		// }
		// if(typeof el === 'object'){
		// 	selectedElement = el;
		// 	selectedElement.addClass('active');
		// 	return;
		// }
		selectedElement = window.getSelection().focusNode.parentNode;

		// Fix for new line breaks
		var anchor = window.getSelection().anchorNode;
		if(anchor.innerHTML=== "<br>"){
			selectedElement = anchor;
		}

		// while (selectedElement.parentNode.contentEditable !== 'true') {
		// 	selectedElement = selectedElement.parentNode;
		// }
		selectedElement = $(selectedElement);
		// console.log(selectedElement[0]);

		// Fix for tag spans
		if(!selectedElement.is('p')){
			selectedElement = selectedElement.parents('p');
		}
		selectedElement.addClass('active');
	};


	var toggle = function(e){
		var that = $(this);

		if(e){
			e.preventDefault();
			e.stopPropagation();
		}
		

		var val = that.text();

		var checked = val==="☑" ? true : false;
		var invalid = val==="☒" ? true : false;

		var parent = that.parents('p');

		// parent.focus();


		// var mark = val;

		save();

		parent[0].modifying = true;
		that.replaceWith(checked || invalid ? tick : tock);
		parent[0].modifying = false;


		parent.toggleClass('done', checked);
		parent.toggleClass('invalid', invalid);

		
		var newP;

		if(!checked && !invalid){
			var date = moment().format("MMM,Do-hh:mm");
			// parent.append(" #done("+date+")");
			// parent.append(" #done");
			newP = $("<p>"+parent.text()+" #done</p>");
			newP[0].modifying = false;

			parent.replaceWith(newP);
			// parent.html(parent.text());
		}else{

			// parent[0].modifying = true;
			// var str = parent.text().replace(/ @done/g, '');
			var str;

			if(checked){
				str = parent.text().replace(/ #done+[A-Za-z0-9-_():,]+| #done/g, '');
			}
			if(invalid){
				str = parent.text().replace(/ #done+[A-Za-z0-9-_():,]+| #invalid/g, '');
			}
			// /[@]+[A-Za-z0-9-_():,/]+/g
			// parent.find(".tag[data-id='done']").text('');
			
			// save();
			// beginModify(parent);
			// parent[0].modifying = true;

			newP = $("<p>"+str+"</p>");
			newP[0].modifying = false;
			parent.replaceWith(newP);
			// parent.html(str);
			// parent[0].modifying = false;
			// endModify(parent);
			// restore();
			
		}
		// parent = newP;
		// parent[0].modifying = false;

		// restore();
		restore();

		requestAnimationFrame(function(){
			newP.trigger('DOMSubtreeModified');
		});

		App.storage.save();


	};



	var setDefault = function(){
		save();
		edit.html(_default);
		restore();
	};


	var formatLine = function(e){
		// $('p.active').removeClass('active');
		var el = $(e.currentTarget);
		var next = el.next();
		// var prev = el.prev();
		// el.addClass('active');

		// console.log("oh");
		// console.log(el[0].modifying);
		// if(currentKey.keyCode===13){
		// 	console.log("whooo");
		// 	return false;
		// }

		if(el[0].modifying){
			return false;
		}

		beginModify(el);

		var text = el.text();
		var titles = parseTitles(text, el);
		var tags = parseTags(titles.str);
		var mentions = parseMentions(tags.str);
		var todo = parseTodo(mentions.str, tags.tags, el);
		var newText = todo.text;


		// Apply classes for item
		var tagStr = titles.classStr + todo.todo;
		for(var tag in tags.tags){
			tagStr += ' '+tag;
		}
		el.attr("class", tagStr);

		// var preTitle = el.prevAll('p.title').first();
		// if(preTitle){
		// 	preTitle.attr("class", "title "+tagStr);
		// }

		if(!newText){
			el.html("<br/>");
			el[0].modifying = false;

			endModify(el);
			if(currentKey){
				if(currentKey.metaKey && currentKey.keyCode===86){

				}else{
					setCursorToEnd(el[0]);
				}
			}else{
				setCursorToEnd(el[0]);
			}
			return;
		}else{
			el.html(newText);
			endModify(el);
		}
		
		return false;
	};

	var beginModify = function(el){
		el[0].modifying = true;
		save();
	};

	var endModify = function(el, offset){
		restore();
		el[0].modifying = false;
	};


	return {
		init:init,
		setAndParse:setAndParse
	};

})();

