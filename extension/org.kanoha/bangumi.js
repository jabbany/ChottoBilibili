/**
 * BangumiList class for maintaining the invariant of the follow list.
 *   Part of the Bilibili Plugin
 * Author : Jabbany
 * Version : 2012-11-24
 **/

function BangumiList(ctx, ccbo) {
    var context = "plugin", 
        abstraction = {}, 
        ready = false, 
        totalCutoffs = [10, 11, 12, 13, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 
                        35, 36, 37, 38, 45, 55, 65, 75, 80, 90, 100, 105, 110, 115, 
                        120, 125, 130, 140, 150, 170, 190, 200, 220, 250, 300],
        onhooks = {
            "add": function (o) {
                return o;
            },
            "reorder": function (o) {
                return o;
            }
        },
        commitCallbackObject = null;
    
    if (ctx != null) {
        context = ctx;
    }
    if (ccbo != null) {
        commitCallbackObject = ccbo;
        ccbo.bind(this);
    }
    var callEventListener = function (evt, data) {
        if (onhooks[evt] != null) {
            try {
                onhooks[evt](data);
            } catch (e) {}
        }
    };
	this.getVersion = function (){
		return abstraction["version"];
	};
    this.addEventListener = function (evt, listener) {
        /** Add an event listener.
		  Listeners are stacked so beware of call stack overflow **/
        if (onhooks[evt] != null) {
            var oldListener = onhooks[evt];
            onhooks[evt] = function (e) {
                try {
                    var returnval = listener(e);
                } catch (e) {
                    var returnval = e;
                }
                if (returnval != null) {
                    try {
                        oldListener(returnval);
                    } catch (err) {}
                }
            };
        } else {
            onhooks[evt] = listener;
        }
    };
    this.refresh = function () {
        /** Refreshes the abstraction **/
        if (context == "plugin") {
            try {
                abstraction = JSON.parse(localStorage["bangumi"]);
            } catch (e) {
                abstraction = this.create();
                localStorage["bangumi"] = JSON.stringify(abstraction);
            }
            ready = true;
        } else {
            chrome.extension.sendMessage({
                "method": "getBangumiList"
            }, function (response) {
                abstraction = response;
                ready = true;
            });
        }
    };
    
    this.checkLatest = function(){
    	try{
    		var tmp = JSON.parse(localStorage["bangumi"]);
    		if(tmp.version != null && tmp.version != this.getVersion()){
    			return false;
    		}
    		return true;
    	}catch(e){
    		return true;
    	}
    }
    
    this.commit = function (overrides) {
        /** Commits changes of the abstraction to file **/
        if(!overrides && !this.checkLatest()){
        	console.log("[War]VersionConflict:BangumiList");
        	return false;
        }
        abstraction.version = (typeof abstraction.version == "number") ? abstraction.version + 1 : 1; 
        if (context == "plugin") {
            localStorage['bangumi'] = JSON.stringify(abstraction);
        } else {
            chrome.extension.sendMessage({
                "method": "setBangumiList",
                "value": abstraction
            }, function (response) {});
        }
        if (commitCallbackObject != null)
            commitCallbackObject.onCommit();
        return true;
    };
    this.merge = function (abst1, abst2) {
        /** Perform a diff between two abstract lists **/
		if(!abst2)
			abst2 = abstraction;
		
		for(var x in abst1){
			if(abst2[x] == null){
				
			}
		}
    };
    this.query = function (id) {
        for (var i = 0; i < abstraction.sections.length; i++) {
            for (var j = 0; j < abstraction["s:" + abstraction.sections[i]].length; j++) {
                if (abstraction["s:" + abstraction.sections[i]][j].id == id)
                    return abstraction["s:" + abstraction.sections[i]][j];
            }
        }
        return null;
    };
    this.remove = function (id) {
        for (var i = 0; i < abstraction.sections.length; i++) {
            for (var j = 0; j < abstraction["s:" + abstraction.sections[i]].length; j++) {
                if (abstraction["s:" + abstraction.sections[i]][j].id == id)
                    abstraction["s:" + abstraction.sections[i]].splice(j, 1);
            }
            if (abstraction["s:" + abstraction.sections[i]].length == 0) {
                delete abstraction["s:" + abstraction.sections[i]];
                abstraction.sections.splice(i, 1);
            }
        }
        callEventListener("remove", id);
    };
    this.inSection = function (name, section) {
        if (typeof abstraction["s:" + section] == "undefined" || abstraction["s:" + section] == null)
            return false;
        for (var i = 0; i < abstraction["s:" + section].length; i++) {
            if (abstraction["s:" + section][i].name == name) {
                return true;
            }
        }
        return false;
    };
    this.add = function (data, section) {
        abstraction["lastId"]++;
        data.id = abstraction["lastId"];
        data.cache = [];
        if (typeof abstraction["s:" + section] == "undefined" || abstraction["s:" + section] == null) {
            if (abstraction.sections.indexOf(section) < 0)
                abstraction.sections.push(section);
            abstraction["s:" + section] = [];
        }
        abstraction["s:" + section].push(data);
        callEventListener("add", data);
    };
    this.create = function () {
        return {
        	version: 1,
            sections: [],
            lastId: 0
        };
    };
    this.getAllCached = function (mode) {
        /** Runs thru the list to get all caches **/
        if (mode == null)
            mode = "flat";
        var ret = [];
        for (var i = 0; i < abstraction.sections.length; i++) {
            var s = abstraction["s:" + abstraction.sections[i]];
            if (s == null)
                continue;
            for (var j = 0; j < s.length; j++) {
                var rule = s[j];
                if (rule.cache.length > 0) {
                    if (mode == "object") {
                        ret.push({
                            title: rule.name,
                            id: rule.id,
                            cover: rule.img,
                            current: rule.current,
                            total: rule.total,
                            videos: rule.cache.slice(0)
                        });
                    } else if (mode == "nested") {
                        ret.push(rule.cache.slice(0));
                    } else {
                        ret = ret.concat(rule.cache);
                    }
                }
            }
        }
        return ret;
    };
    this.countUnwatched = function (){
    	var cached = this.getAllCached();
    	var count = 0;
    	for(var i = 0; i < cached.length; i++){
    		if(cached[i] != null && cached[i].substring(0,1) != "-"){
    			count++;
    		}
    	} 
    	return count;
    };
    this.needsRefresh = function (rule) {
        if (rule.total == null || rule.current == null)
            return false;
        if (rule.type == 3 || rule.type > 10)
            return false; // 10 and above are designated as managed by other plugins
        if (rule.type == 8)
        	return true; // 8 is managed internally in the worker
		if (rule["__disabled"])
			return false;
		if (rule.type != 1) {
            if (rule.type == 2) {
                var timediff = (Math.floor((new Date()).getTime() / 1000) - rule.last);
                if (timediff >= rule.interval)
                    return true;
                return false;
            }
            return false;
        }
        if ((rule.total - rule.current - rule.cache.length) > 0) {
            return true;
        } else if ((rule.cache.length + rule.current) > rule.total) {
            /* Bad cache - Clear and redo */
            rule.cache = [];
            return true;
        }
        for (var i = 0; i < rule.cache.length; i++) {
            if (rule.cache[i] == null)
                return true;
        }
        return false;
    };
    this.findClosestTotal = function (current) {
        /** Estimate a good total-eps value **/
        var i = 0;
        while (totalCutoffs[i] <= current && i < totalCutoffs.length)
            i++;
        if (totalCutoffs[i] > current)
            return totalCutoffs[i];
        return -1;
    };
    this.lookupSectionName = function (sect_id) {
        if (SettingsConnector == null)
            return "?";
        var SC = new SettingsConnector();
        var tids = SC.get("matcher.tid");
        if (typeof tids != "object")
            return;
        for (var x in tids) {
            if (tids[x] == sect_id)
                return x;
        }
        return "?";
    };
    this.newRule = function (rname, type, matcher, current, total) {
        if (type == 1) {
            /** Type 1 is traditional **/
            if (current == null)
                current = 0;
            if (total == null)
                total = this.findClosestTotal(current);
            return {
                "name": rname,
                "type": 1,
                "matcher": matcher,
                "current": current,
                "total": total
            }
        } else if (type == 2) {
            /** Type 2 is for weekly **/
            if (current == null)
                current = 0;
            if (total == null)
                total = this.findClosestTotal(current);
            return {
                "name": rname,
                "type": 2,
                "matcher": matcher,
                "current": current,
                "total": total,
                "last": 0,
                "interval": 432000
            }
        } else if (type == 3) {
            /** Type 3 is for  **/
        }
    };
    this.getRulesBySection = function (sect, noCheck) {
        /** Create a list of rules that need to be checked by section
			Will return everything
		**/
        var refreshList = [];
        var sct = abstraction["s:" + sect];
        if (sct == null) return refreshList;
        for (var j = 0; j < sct.length; j++) {
            if (noCheck || this.needsRefresh(sct[j])) {
                refreshList.push(sct[j]);
            }
        }
        return refreshList;
    };
    this.getSections = function () {
        /** Gets a safe implementation of sections **/
        return abstraction.sections.slice(0);
    };
    
    this.flatten = function(){
    	/** Produces an array of everything **/
    	var x = [];
    	for(var k in abstraction){
    		if(k.substring(0,2) == "s:" && 
    			abstraction[k] != null){
    			for(var m in abstraction[k])
    				x.push(abstraction[k][m]);
    		}
    	}
    	return x;
    };
    
    this.filterFor = function(filter){
    	/** Does a primitive search filter **/
    	var everything = this.flatten();
    	var results = [];
    	
    	for(var i = 0; i < everything.length; i++){
    		var curr = everything[i];
    		var desc = curr.name + " " + (curr.desc != null ? curr.desc : "");
    		/** Tests to see if this hits filter **/
    		if(filter.dregex != null){
    			for(var j = 0; j < filter.dregex.length; j++){
    				
    				if((new RegExp(filter.dregex[j])).test(desc)){
    					results.push(curr);
    					curr = null;
    					break;
    				}
    			}
    			if(curr == null)
    				continue;
    		}
    		
    		if(filter.tags != null){
    			for(var j = 0; j < filter.tags.length; j++){
    				if(curr.tags != null && 
    					curr.tags.indexOf(filter.tags[j]) >= 0){
    					results.push(curr);
    					curr = null;
    					break;
    				}
    			}
    			if(curr == null)
    				continue;
    		}
    	}
    	
    	return results;
    };
	this.reassignId = function (node) {
		/** Reassigns the id for the node **/
		var oldId = node.id;
		abstraction["lastId"]++;
		node.id == abstraction["lastId"];
		callEventListener("reorder", {
			"node":node,
			"oldId":oldId,
			"newId":node.id
		});
	};
	this.getSp = function (){
		if(abstraction.special != null)
			return abstraction.special.slice(0);
		else
			return [];
	}
	this.removeSp = function(spid){
		if(abstraction.special == null)
			return;
		for(var i = 0; i < abstraction.special.length; i++){
			if(abstraction.special[i] != null){
				var s = abstraction.special[i];
				if(s.spid == spid){
					abstraction.splice(i,1);
					return;
				}
			}
		}
		return;
	}
    /* Loading Fin */
    this.refresh();
    /* Refreshd */
};
