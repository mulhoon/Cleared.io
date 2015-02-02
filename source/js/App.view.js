App.view = (function () {

	var area, input, debug, li, but, space, curtain, selectedElement;

	var _default = '<p><br/></p>';
	var tick = '<span class="tick">☐</span>';
	var tock = '<span class="tick">☑</span>';
	var done = '<span class="done"> @done</span>';

	var init = function(){
		console.log("All ready!");

		area = $("#area");
		edit = $("#edit");
		debug = $("#debug");
		input = $('#area2 .text');
		li = $("<li/>");
		but = $("<div class='but' />")[0];
		space = $("<div class='space' />")[0];
		curtain = $(".curtain");
		actions();
	};

	var parseTags = function(str) {
		var tags = {};
		var newStr = str.replace(/[#]+[A-Za-z0-9-_():,/]+/g, function(u) {
			var name = u.slice(1).split('(')[0];
			tags[name] = true;
			return "<span class='tag' data-id='"+name+"'>"+u+"</span>";
		});
		return {str:newStr, tags:tags};
	};

	var parseTodo = function(str, tags, el) {
		var isList;
		var start = str.slice(0,2);
		el.removeClass('todo done');

		if(start === '- ' || start === '☐ ' || start === '☑ '){

			if(str.length>=2){
				el.addClass('todo');
			}
			if(tags.done){
				el.addClass('done');
			}

			str = (tags.done ? tock : tick) + " " + str.slice(2);
			isList = true;
		}

		return {text:str, todo:isList};

		// return str.replace(/- |☐/g, function(u) {
		// 	return "<span class='tick'>☐</span>";
		// });
	};


	var currentKey;

	var actions = function(){
		edit.on('keydown', function(e){
			currentKey = e.keyCode;
		});

		// document.onkeyup = setFocus;
		// document.onmouseup = setFocus;

		edit.on(event_down, '.tick', toggle);


		edit.on('DOMSubtreeModified', 'p', formatLine);

		// edit.on('DOMCharacterDataModified', 'p', function(e){
		// 	console.log(e);
		// });
		


		edit[0].addEventListener("paste", function(e) {
		    // cancel paste
		    e.preventDefault();

		    // get text representation of clipboard
		    var text = e.clipboardData.getData("text/plain");

		    text = text
		    .replace(/<br(\s*)\/*>/ig, '\n')
		    .replace(/<[p|div]\s/ig, '\n$0')
		    .replace(/(<([^>]+)>)/ig, "");
		    // insert text manually
		    // document.execCommand("insertHTML", false, text);
		    edit.html(text);
		});
	};


	var setFocus = function(e){
		edit.find('.active').removeClass('active');
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

		var toggle = val==="☐" ? true : false;

		var parent = that.parent();

		

		parent[0].modifying = true;
		that.text(toggle ? '☑' : '☐');
		parent[0].modifying = false;

		// console.log(that[0]);
		// if(true){
		// 	return;

		// }
		parent.toggleClass('done', toggle);


		// that = parent.find('.tick');

		// that.parent().toggleClass('done', toggle);
		if(toggle){
			var date = moment().format("MMM,Do-hh:mm");
			parent.append(" #done("+date+")");
		}else{

			

			// parent[0].modifying = true;
			// var str = parent.text().replace(/ @done/g, '');

			var str = parent.text().replace(/ #done+[A-Za-z0-9-_():,]+| #done/g, '');

			// /[@]+[A-Za-z0-9-_():,/]+/g
			// parent.find(".tag[data-id='done']").text('');
			parent.html(str);
			// parent[0].modifying = false;
			// var trim = $.trim(parent.text());
			// save();
			// parent.removeClass('todo');
			// restore();
			// parent.text("hi");
		}
		// parent[0].modifying = false;
		// update();
		
	};

	// var createDiv = function(style, html, span){
	// 	var div = document.createElement(span ? "span" : "div");
	// 	if(typeof html === 'object'){
	// 		div.appendChild(html ? html : '');
	// 	}else{
	// 		div.innerHTML = html ? html : '';
	// 	}
	// 	div.className = style;
	// 	return div;
	// };

	var makeItTodo = function(e){
		// console.log(this);
		console.log('make it todo');
		// var el = $(selectedElement);
		// if(el.hasClass('active') && el.hasClass('todo')){
		// 	el.text('- ');
		// }
	};

	var setDefault = function(){
		save();
		edit.html(_default);
		restore();
	};

	var checkFormat = function(){
		var oldItem = selectedElement;
		setFocus();
		// requestAnimationFrame(function(){

			// console.log(oldItem[0]);
			// console.log(selectedElement[0]);

			var wasTodo = false;
			if(oldItem){
				wasTodo = oldItem.hasClass('todo');

				// has the user hit return on a blank todo item?
				if($.trim(oldItem.text())==='☐'){
					oldItem.remove();
					selectedElement.removeClass('todo');
					wasTodo = false;
				}
			}
			var text = selectedElement.text();

			if(!text){
				selectedElement.find('.tag').remove();
				if(wasTodo){
					selectedElement.html('- ');
					// update();
					save(2);
					restore();
				}else{
					selectedElement.html('<br/>');
				}
				
			}

			// var lis = list.filter(function() { 
			// 	return parseEmpty(this);
			// });
			// update();
		// });

		
	};

	var formatLine = function(e){

		// console.log('s');
		$('p.active').removeClass('active');
		var el = $(e.currentTarget);
		var next = el.next();
		el.addClass('active');

		// console.log(el[0]);
		// console.log(el[0].modifying);
		if(el[0].modifying){
			return false;
		}
		beginModify(el);


		var offsets = 0;
		var text = el.text();


		console.log(el[0]);

		var tags = parseTags(text);
		var todo = parseTodo(tags.str, tags.tags, el);
		var newText = todo.text;
		

		if(!newText){
			// el.removeClass('todo');
			el.html("<br/>");
			el[0].modifying = false;
			setCursorToEnd(el[0]);
			return;
		}else{
			// modify(el, function(el){
			
			el.html(newText);
			endModify(el, offsets);
			// });
		}
		
		return false;
	};

	// var modify = function(el, callback, offset){
	// 	el[0].modifying = true;
	// 	save(offset || 0);
	// 	callback(el);
	// 	restore();
	// 	el[0].modifying = false;
	// };

	var beginModify = function(el){
		el[0].modifying = true;
		save();
	};

	var endModify = function(el, offset){
		// restore();
		// save();
		restore();
		el[0].modifying = false;
	};

	var oldValue = "";
	var update = function(e){

		checkFormat();
		
		if(selectedElement[0].innerHTML==="<br>"){
			return true;
		}


		newValue = edit.text();

		if(newValue===oldValue){
			console.log("same...");
			if(!newValue){
				console.log("empty...");
				setDefault();
			}else{
				console.log("check...");
				// checkFormat();
			}
			
			// setFocus();
			return false;
		}

		oldValue = newValue;


		var cleansed = false;
		var value = $.trim(edit.text());

		if(!value){
			setDefault();
			cleansed = true;
		}

		if(!cleansed){
			var list = edit.find('p');
			var lis = list.filter(function() { 
				return isTodo(this);
			});
		}
		// setFocus();


	};

	// var removeTags = function(that){
	// 	var tag = $(that).find('.done');
	// 	if(!tag.length){
	// 		return;
	// 	}
	// 	// console.log(tag.text());
	// 	if($.trim(tag.text()) === ""){
	// 		save(-1);
	// 		tag.remove();
	// 		restore();
	// 	}
	// 	return;
	// };


	var up = function(){
		// setFocus();
		// restoreSelection();
	};


	var isTodo = function(that){
		that = $(that);

		var offset = 0;
		var html = that.html(); 
		var text = that.text(); 

		// console.log(text);

		var todo = parseTodo(text, that);
		var newText = todo.text;
		newText = parseTags(newText);

		if(!newText){
			that.removeClass('todo');
			//newText = ' ';
			// offset = direction;
		}else{
			save();
			that.html(newText);
			restore();
		}
		// console.log(direction);

		// if(direction){
		// 	that.html(newText);
		// }else{
			// save(offset);
			// that.html(newText);
			// restore();
		// }


		return true;
	};

	return {
		init:init
	};

})();

