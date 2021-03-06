
var options = {};
var grokfaster_running = false;
var grokfaster_shutting_down = false;
var grokfaster_paused = false;
var delay =  60/300*1000;
var grokfaster = {
	calculate_additional_delay: function(word){
		if(options.pause_sentence_time > 0 && word.match(/\."?'?(\s+|)?$/) !== null){
			return options.pause_sentence_time;
		}else if(options.pause_other_time && word.match(/(;|,|:)$/) !== null){
			return options.pause_other_time;
		}
		return 0;
	},
	format_word: function(word){
		if(!options.focal_point){
			return word;
		}
		var len = word.length;
		var focal_point = Math.ceil(len / 4.0);

		if(len === 1 || focal_point === 0){
			return ['&nbsp;', word.charAt(0), word.substr(1)]
		}else{
			var suffix = (focal_point+1>=len) ? '' : word.substr(focal_point+1);
			return [word.substr(0,focal_point), word.charAt(focal_point), suffix]
		}
	},
	prepare_next_word: function(words){
		var word = '';
		while(word === ''){
			word = words.shift();
			if(word === undefined){return false;}
			word = word.replace(/\s/gm,'');
		}
		return grokfaster.format_word(word);
	},
	grok: function(text){
		if(grokfaster_running){return;}

		var container_el = document.createElement('div');
		var prev_word_el =  document.createElement('div');
		var next_word_el =  document.createElement('div');
		var word_el = document.createElement('div');

		if(options.focal_point){
			var word_part_1 = document.createElement('span');
			var word_part_2 = document.createElement('span');
			var word_part_3 = document.createElement('span');

			word_part_1.setAttribute('class', 'grokWordPrefix');
			word_part_2.setAttribute('class', 'grokWordHighlight');
			word_part_3.setAttribute('class', 'grokWordSuffix');

			next_word_el.appendChild(word_part_1);
			next_word_el.appendChild(word_part_2);
			next_word_el.appendChild(word_part_3);
		}

		var bg_el = document.createElement('div');
		var words = text.replace(/\r|\n|\s+/gm, ' ');
		words = words.split(' ');

		if(words.length<2){return;}
		grokfaster_running = true;
		delay = 60/options.wpm*1000;

		bg_el.setAttribute('id','grokFadeBG');
		container_el.setAttribute('id', 'grokReader');
		container_el.style['text-align'] = options.focal_point ? 'left' : 'center';
		prev_word_el.setAttribute('id', 'grokPreviousWord');
		next_word_el.setAttribute('id', 'grokNextWord');
		word_el.setAttribute('id', 'grokCurrentWord');



		if(options.show_additional){
			container_el.appendChild(prev_word_el);
		}
		container_el.appendChild(word_el);
		if(options.show_additional){
			container_el.appendChild(next_word_el);
		}
		
		prev_word_el.innerHTML = '&nbsp;';
		word_el.innerHTML = '&nbsp;';
		//next_word_el.innerHTML = '&nbsp;';
		if(options.dim_background){
			document.body.appendChild(bg_el);
		}
		document.body.appendChild(container_el);

		var grokfaster_kill = function(){
			if(!grokfaster_running){return;}
			grokfaster_shutting_down = true;
			grokfaster_running = false;
			if(options.dim_background){
				document.body.removeChild(bg_el);
			}
			document.body.removeChild(container_el);
			document.removeEventListener('keydown', handle_key_events);
			grokfaster_running = false;
			grokfaster_paused = false;
			grokfaster_shutting_down = false;
		}

		var grokfaster_pause = function(){
			if(!grokfaster_running){return;}
			if(!grokfaster_paused){
				grokfaster_paused = true;
			}else{
				grokfaster_paused = false;
				grokfaster_run();	
			}
		}

		var handle_key_events = function(e){
			if(!grokfaster_running){return;}
			e = e || window.event;
    		if (e.keyCode === 27) {
    			grokfaster_shutting_down = true;
    			grokfaster_kill();
    		}else if(e.keyCode == 32){
				e.preventDefault();
				grokfaster_pause();
    		}
		}

		bg_el.addEventListener('click', grokfaster_kill);

		document.addEventListener('keydown', handle_key_events);

		var nextWord = '';
		var first = true;
		var word_tmp = '';
		var grokfaster_run = function(){
			if(!grokfaster_running||grokfaster_shutting_down||grokfaster_paused){return;}
			var additional_delay = 0;
			if(first){
				first = false;
				if(options.focal_point){
					word_tmp = grokfaster.prepare_next_word(words);
					word_part_1.innerHTML = word_tmp[0];
					word_part_2.innerHTML = word_tmp[1];
					word_part_3.innerHTML = word_tmp[2];
					word_el.innerHTML = next_word_el.innerHTML;
					word_tmp = grokfaster.prepare_next_word(words);
					word_part_1.innerHTML = word_tmp[0];
					word_part_2.innerHTML = word_tmp[1];
					word_part_3.innerHTML = word_tmp[2];
				}else{
					word_el.innerHTML=grokfaster.prepare_next_word(words);
					next_word_el.innerHTML=grokfaster.prepare_next_word(words);
				}
				additional_delay = grokfaster.calculate_additional_delay(word_el.textContent || word_el.innerText);
				setTimeout(grokfaster_run, delay+additional_delay);
				return;
			}
			nextWord = grokfaster.prepare_next_word(words);
			prev_word_el.innerHTML = word_el.innerHTML;
			word_el.innerHTML=next_word_el.innerHTML;
			if(!nextWord){
				next_word_el.innerHTML = '&nbsp;';
				grokfaster_shutting_down = true;
				setTimeout(grokfaster_kill,delay+1000);
				return;
			}
			if(options.focal_point){
				word_part_1.innerHTML = nextWord[0];
				word_part_2.innerHTML = nextWord[1];
				word_part_3.innerHTML = nextWord[2];
			}else{
				next_word_el.innerHTML = nextWord;
			}
			additional_delay = grokfaster.calculate_additional_delay(word_el.textContent || word_el.innerText);
			curWord=nextWord;
			setTimeout(grokfaster_run, delay+additional_delay);
		}

		grokfaster_run();
	}
	
};

document.addEventListener('DOMContentLoaded', function () {
	chrome.runtime.onMessage.addListener(
	  function(request, sender, sendResponse) {
	  	switch (request.action){ 
	  		case 'grok_start':
	  			chrome.runtime.sendMessage({action: "options"}, function(response) {
					options = response;
		  			grokfaster.grok(window.getSelection().toString());
				});
	  			
		    	break;
		}
	  }
	);
});

