/** 
	Section Worker - Depends on CacheDB and Tools 
	Author: Jabbany
**/
function SectionWorker(boundSection,bgmlist){
	var bgml = bgmlist;
	var boundSection = boundSection;
	var refreshList = bgml.getRulesBySection(boundSection);
	var cacheDB = new CacheDB();
	cacheDB.refresh(function(){
		cacheDB.commit();
	});
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
		if(/\u5B8C\u7ED3/.test(title) || /fin/i.test(title)){
			return true; /* Wanjie or fin */
		}
		return false;
	};
	this.matchInstance = function (inst){
		/** Matches the Data to commit **/
		if(FlagCatcher != null && FlagCatcher.get("debug.outputIterations",false)){
			console.log("[Log] (av" + inst.aid + ") " + inst.title);
		}
		for(var i = 0; i < refreshList.length; i++){
			try{
				if(typeof refreshList[i].matcher == "string"){
					var matcher = new RegExp(refreshList[i].matcher);
					var ret = matcher.exec(inst.title);
					if(ret != null && ret.length > 1){
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
							if(refreshList[i].cache != null){
								if(refreshList[i].cache[rIdx] == null){
									refreshList[i].cache[rIdx] = "av" + inst.aid;
									cacheDB.write("av" + inst.aid, inst);
								}else if(refreshList[i].cache[rIdx] != "av" + inst.aid && 
									refreshList[i].cache[rIdx] != "-av" + inst.aid){
									refreshList[i].cache[rIdx] = "av" + inst.aid;
									cacheDB.write("av" + inst.aid, inst);
								}else
									refreshList.splice(i,1);
							}
						}else{
							/* Watched and recorded */
							refreshList.splice(i,1);
						}
						break;
					}
				}else{
					var matcher = refreshList[i].matcher;
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
	};
}