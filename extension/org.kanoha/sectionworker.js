/** 
	Section Worker - Depends on CacheDB and Tools 
	Author: Jabbany
**/
function SectionWorker(boundSection,bgmlist){
	var bgml = bgmlist;
	var boundSection = boundSection;
	var refreshList = bgml.getRulesBySection(boundSection);
	var createCache = function (rule,cacheLength){
		var cache = [];
		for(var i = 0; i < cacheLength; i++){
			if(typeof rule.cache[i] == "string")
				cache.push(rule.cache[i]);
			else
				caceh.push("");
		}
		rule.cache = cache;
	};
	this.matchInstance = function (inst){
		/** Matches the Data to commit **/
		for(var i = 0; i < refreshList.length; i++){
			try{
				if(typeof refreshList[i].matcher == "string"){
					var matcher = new RegExp(refreshList[i].matcher);
					var ret = matcher.exec(inst.title);
					if(ret != null && ret.length > 1){
						var episodeNumber = Tools.parseTextNumber(ret[1]);
						if(refreshList[i].watched < episodeNumber){
							var rIdx = episodeNumber - refreshList[i].watched - 1;
							if(refreshList[i].cache == null)
								refreshList.cache = [];
							if(refreshList[i].cache != null && refreshList[i].cache[rIdx] == null){
								refreshList[i].cache[rIdx] = "av" + inst.aid;
								CachedDB.add
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