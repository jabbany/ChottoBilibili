/**
* BangumiList class for maintaining the invariant of the follow list.
*   Part of the Bilibili Plugin
* Author : Jabbany
* Version : 2012-11-24 
**/
function BangumiList(ctx, ccbo){
	var context = "plugin";
	var totalCutoffs = 
	  [10,11,12,13,20,21,22,23,24,25,30,31,32,33,34,35,36,37,38,45,55,65,75,
	  80,90,100,105,110,115,120,125,130,140,150,170,190,200,220,250,300];
	if(ctx != null)
		context = ctx;
	var abstraction = {};
	var ready = false;
	var onhooks = {
		"add":function(o){return o;},
		"reorder":function(o){return o;}
	};
	var commitCallbackObject = null;
	if(ccbo != null){
		commitCallbackObject = ccbo;
		ccbo.bind(this);
	}
	var callEventListener = function(evt,data){
		if(onhooks[evt] != null){
			try{
				onhooks[evt](data);
			}catch(e){}
		}
	};
	
	this.addEventListener = function(evt,listener){
		/** Add an event listener.
		  Listeners are stacked so beware of call stack overflow **/
		if(onhooks[evt] != null){
			var oldListener = onhooks[evt];
			onhooks[evt] = function(e){
				try{
					var returnval = listener(e);
				}catch(e){var returnval = e;}
				if(returnval != null){
					try{
						oldListener(returnval);
					}catch(e){}
				}
			};
		}else{
			onhooks[evt] = listener;
		}
	};
	this.refresh = function () {
		/** Refreshes the abstraction **/
		if(context == "plugin"){
			try{
				abstraction = JSON.parse(localSotrage["bangumiList"]);
			}catch(e){
				abstraction = this.create();
				localStorage["bangumiList"] = JSON.stringify(abstraction);
			}
			ready = true;
		}else{
			chrome.extension.sendMessage({"method": "getBangumiList"}, function(response) {
				abstraction = response;
				ready = true;
			});
		}
	};
	this.commit = function () {
		/** Commits changes of the abstraction to file **/
		if(context == "plugin"){
			localStorage['bangumiList'] = JSON.stringify(abstraction);
		}else{
			chrome.extension.sendMessage({"method": "setBangumiList", "value": abstraction}, function(response) {
			});
		}
		if(commitCallbackObject != null)
			commitCallbackObject.onCommit();
	};
	this.merge = function (){
		/** Perform a diff between two abstract lists **/
		
	};
	this.query = function (id){
		for(var i = 0; i < abstraction.sections.length; i++){
			for(var j = 0; j < abstraction["s:" + abstraction.sections[i]].length; j++){
				if(abstraction["s:" + abstraction.sections[i]][j].id == id)
					return abstraction["s:" + abstraction.sections[i]][j];
			}
		}
		return null;
	};
	this.remove = function (id){
		for(var i = 0; i < abstraction.sections.length; i++){
			for(var j = 0; j < abstraction["s:" + abstraction.sections[i]].length; j++){
				if(abstraction["s:" + abstraction.sections[i]][j].id == id)
					abstraction["s:" + abstraction.sections[i]].splice(j,1);
			}
			if(abstraction["s:" + abstraction.sections[i]].length == 0){
				delete abstraction["s:" + abstraction.sections[i]];
				abstraction.sections.splice(i,1);
			}
		}
		callEventListener("remove",id);
	};
	this.inSection = function (name,section){
		if(typeof abstraction["s:" + section] == "undefined" || abstraction["s:" + section] == null)
			return false;
		for(var i = 0; i < abstraction["s:" + section].length;i++){
			if(abstraction["s:" + section][i].name == name){
				return true;
			}
		}
		return false;
	};
	this.add = function (data,section){
		abstraction["lastId"]++;
		data.id = abstraction["lastId"];
		data.cache = [];
		if(typeof abstraction["s:" + section] == "undefined" || abstraction["s:" + section] == null){
			if(abstraction.sections.indexOf(section) < 0)
				abstraction.sections.push(section);
			abstraction["s:" + section] = [];
		}
		abstraction["s:" + section].push(data);
		callEventListener("add",data);
	};
	this.create = function (){
		return {
			sections: [],
			lastId: 0
		};
	};
	this.needsRefresh = function(rule){
		if(rule.total == null || rule.current = null)
			return false;
		if(rule.type != 1){
			if(rule.type == 2){
				var timediff = Math.floor((new Date()).getTime()/1000) - rule.last;
				if(timediff >= rule.interval)
					return true;
				return false;
			}
			return false;
		}
		if(rule.total - rule.current - rule.cache.length > 0)
			return true;
		else if(rule.cache.length + rule.current > rule.total){
			/* Bad cache - Clear and redo */
			rule.cache = [];
			return true;
		}
		return false;
	};
	this.findClosestTotal = function(current){
		/** Estimate a good total-eps value **/
		var i = 0;
		while(totalCutoffs[i] <= current && i < totalCutoffs.length)
			i++;
		if(totalCutoffs[i] > current)
			return totalCutoffs[i];
		return -1;
	};
	this.newRule = function(name,type,matcher,excluder,current,total) {
		if(type == 1){
			if(current == null)
				current = 0;
			if(total == null)
				total = findClosestTotal(current);
			return {
				name : name,
				type : 1,
				matcher : matcher,
				current : current,
				total : total
			}
		}else if(type == 2){
			/** Type 2 is for weekly **/
			if(current == null)
				current = 0;
			if(total == null)
				total = findClosestTotal(current);
			return {
				name : name,
				type : 2,
				matcher : matcher,
				current : current,
				total : total,
				last: 0,
				interval: 432000
			}
		}
	};
	this.getRulesBySection = function(sect,isSafe){
		/** Create a list of rules that need to be checked by section
			Will only return a safe array if isSafe is set to true.
		**/
		var refreshList = [];
		if(isSafe != true){
			var sect = abstraction["s:" + abstraction.sections[i]];
			if(sect == null) return refreshList;
			for(var j = 0; j < sect.length; j++){
				if(this.needsRefresh(sect[j])){
					refreshList.push(sect[j]);
				}
			}
			return refreshList;
		}else{
			/** Not implemented. Too lazy **/
			return [];
		}
	};
	this.getSections = function(){
		/** Gets a safe implementation of sections **/
		return abstraction.sections.slice(0);
	};
	/* Loading Fin */
	this.refresh();
	/* Refreshd */
};