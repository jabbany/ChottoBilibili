function CacheDB(){
	//Caching Database uses ChromeStorage Local Storage
	var storage = chrome.storage.local;
	var db = {};
	var pool = 0;
	var addPool = [];
	var saveInProgress = false;
	this.commit = function(){
		if(pool == 0)
			return;
		if(saveInProgress){
			console.log("[War](CacheDB)Commit during save.");
			return;
		}
		saveInProgress = true;
		chrome.storage.local.set({cachedb:db}, function(){
			pool = 0;
			saveInProgress = false;
		});
	};
	this.checkCommit = function(){
		//Commits the current pool if it gets too full
		if(pool > 5) this.commit();
	};
	this.write = function(index,record){
		db[index] = record;
		pool++;
		this.checkCommit();
	};
	this.get = function(index){
		return db[index];
	};
	this.search = function(colname,filter){
		var r = [];
		for(elm in db){
			if(db[elm][colname] != null){
				if(filter(db[elm][colname]))
					r.push(db[elm]);
			}
		}
		return r;
	};
	this.reduce = function(foldFunction, baseCase){
		var foldResult = baseCase;
		for(elm in db){
			foldResult = foldFunction(db[elm],foldResult);
		}
		return foldResult;
	};
	this.map = function(mapFunction){
		for(elm in db){
			db[elm] = mapFunction(elm,db[elm]);
			pool++;
		}
		this.checkCommit();
	};
	this.getIndex = function(index){
		var list = [];
		for(elm in db){
			list.push(elm);
		}
		return list;
	};
	this.truncate = function(chk){
		if(chk == null)
			chk = function(key,value){return true;}
		for(elm in db){
			if(chk(elm,db[elm])){
				delete db[elm];
				pool++;
			}
		}
	};
	this.refresh = function(callback){
		var slf = this;
		chrome.storage.local.get("cachedb",function(items){
			if(items != null && items.cachedb != null){
				var tdb = items.cachedb;
				/** Make sure the root is clean or else force a commit **/
				var needCommit = (pool == 0);
				for(titm in tdb){
					if(db[titm] == null)
						db[titm] = tdb[titm];
					else
						needCommit = true;
				}
				if(needCommit)
					slf.commit();
			}else{
				slf.commit();
			}
			if(callback != null)
				try{
					callback();
				}catch(e){
					console.log("[Err](CacheDB) Callback failed");
				}
		});
	};
}

