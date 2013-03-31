/**
	Section Worker
	Deps: cachedb.js, tools.js
	Author: Jabbany
**/
function SectionWorker(boundSection,bgmlist){
	var bgml = bgmlist;
	var boundSection = boundSection;
	var excludeRaws = false;
	var refreshList = bgml.getRulesBySection(boundSection);
	var cacheDB = new CacheDB();
	var createCache = function (rule,cacheLength){
		var cache = [];
		for(var i = 0; i < cacheLength; i++){
			if(typeof rule.cache[i] == "string")
				cache.push(rule.cache[i]);
			else
				cache.push("");
		}
		rule.cache = cache;
	};
	this.setRawsMode = function(mode){
		excludeRaws = mode;
	};
	this.cacheRefresh = function(rule){
		/** Checks the refresh cache to work **/
		if(rule.cache == null)
			rule.cache = [];
		if(rule.cache.length > rule.total - rule.current){
			rule.cache = rule.cache.slice(rule.cache.length - rule.total + rule.current);
		}
	};
	this.isEnd = function(title){
		/** Test to see if this is the end of a series **/
		if(/\u5B8C\u7ED3/.test(title) || 
			/\u3010fin\u3011/i.test(title) || 
			/\(fin\)/i.test(title) ||
			/\[fin\]/i.test(title) || 
			/fin\s*$/i.test(title)){
			return true; /* Wanjie or fin */
		}
		return false;
	};
	this.matchInstance = function (inst){
		/** Matches the Data to commit **/
		try{
			if(FlagCatcher != null && FlagCatcher.get("debug.outputIterations",false)){
				console.log("[Log] (av" + inst.aid + ") " + inst.title);
			}
		}catch(e){}
		for(var i = 0; i < refreshList.length; i++){
			try{
				if(typeof refreshList[i].matcher == "string"){
					var matcher = new RegExp(refreshList[i].matcher);
				}else{
					var matcher = new RegExp(refreshList[i].matcher["m"]);
					if(refreshList[i].matcher["e"] != null && refreshList[i].matcher["e"] != ""){
						var excluder = new RegExp(refreshList[i].matcher["e"]);
					}
				}
				var ret = matcher.exec(inst.title);
				
				if(ret != null && ret.length > 1){
					if(excludeRaws && /\u751F\u8089/.test(inst.title))
						continue; // sheng rou
					if(excluder != null && excluder.test(inst.title))
						continue; // Found exclusion
					var episodeNumber = Tools.parseTextNumber(ret[1]);
					console.log("[Log] Found Match " + episodeNumber + ":" + refreshList[i].current);
					if(refreshList[i].current < episodeNumber){
						var rIdx = episodeNumber - refreshList[i].current - 1;
						if(refreshList[i].total != -1 && episodeNumber >= refreshList[i].total){
							if(!this.isEnd(inst.title)){
								refreshList[i].total = bgml.findClosestTotal(episodeNumber);
							}else{
								refreshList[i].total = episodeNumber;
							}
						}
						this.cacheRefresh(refreshList[i]);
						if(cacheDB.get("img:" + refreshList[i].aid) == null){
							cacheDB.write("img:" + refreshList[i].aid, inst.pic);
						}
						if(refreshList[i].cache != null){
							if(refreshList[i].cache[rIdx] == null){
								refreshList[i].cache[rIdx] = "av" + inst.aid;
								cacheDB.write("av" + inst.aid, inst);
								cacheDB.commit();
							}else if(refreshList[i].cache[rIdx] != "av" + inst.aid && 
								refreshList[i].cache[rIdx] != "-av" + inst.aid){
									refreshList[i].cache[rIdx] = "av" + inst.aid;
								cacheDB.write("av" + inst.aid, inst);
								cacheDB.commit();
							}else
								refreshList.splice(i,1);
						}
					}else{
						/* Watched and recorded */
						refreshList.splice(i,1);
					}
					break;
				}
				
			}catch(e){
				/* Wrong Rules. */
				console.log("[War](Worker)Rule Error");
			}
		}
	};
	this.getSection = function (){
		return boundSection;
	};
	this.done = function(nc){
		/** Check if done. 
			If given nc = true will NOT invoke commit */
		if(refreshList.length == 0){
			if(nc == true)
				return true;
			bgml.commit();
			cacheDB.commit();
			return true;
		}
		return false;
	};
	this.flush = function(){
		/** Force writing contents back, due to end-of-list 
			Not used here. Only to log unexpected ends.
		**/
		console.log("[Log](Worker)Flushed!");
		bgml.commit();
		cacheDB.commit();
	};
}
