function CacheDB(dbName){
	//Caching Database uses ChromeStorage Local Storage
	var databaseName = dbName != null ? dbName : "cachedb";
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
		var dbObject = {};
		dbObject[databaseName] = db;
		chrome.storage.local.set(dbObject, function(){
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
		chrome.storage.local.get(databaseName,function(items){
			if(items != null && items[databaseName] != null){
				var tdb = items[databaseName];
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

function ReadOnlyCacheDB(dbName){
	//Creates a read only queryable cache db better in memory usage
	if(dbName == null) dbName = "cachedb";
	var db = {};
	var eventDispatcher = {
		"onloaded":function(){},
		"onerror":function(){}
	};
	var dispatchEvent = function(eventName, eventObject){
		if(eventDispatcher[eventName] != null)
			eventDispatcher[eventName](eventObject);
	};
	this.query = function(filter, shouldRetain){
		chrome.storage.local.get(dbName,function(items){
			if(items != null && items.cachedb != null){
				for(var x in items.cachedb){
					if(filter(x,items.cachedb[x]))
						db[x] = items.cachedb[x];
				}
				dispatchEvent("onloaded",db);
			}else{
				dispatchEvent("onerror",db);
			}
		});
	};
	this.lastQuery = function(){
		return db;
	};
	this.addEventListener = function(event, listener){
		if(typeof listener != "function")
			return;
		if(eventDispatcher[event] != null){
			var oldFunction = eventDispatcher[event];
			eventDispatcher[event] = function(e){
				listener(e);
				oldFunction(e);
			}
		}
	};
	this.clearEventListeners - function(event){
		if(eventDispatcher[event] != null)
			eventDispatcher[event] = function(){};
	}
}

function PQueue(){
	var pq = [];
	var size = 0;
	var compare  = function(a, b){
		if(a.p > b.p) return 1;
		else if (a.p < b.p) return -1;
		return 0;
	};
	this.setComparator = function(f){
		compare = f;
	};
	this.insertWithPriority = function(i, p){
		pq.push({"p":p, "item": i});
		var idx = pq.length - 1;
		while(true){
			if(idx == 0)
				break;
			if(compare(pq[idx],pq[Math.floor((idx - 1)/2)]) > 0){
				var tmp = pq[Math.floor((idx - 1)/2)];
				pq[Math.floor((idx - 1)/2)] = pq[idx];
				pq[idx] = tmp;
				idx = Math.floor((idx - 1)/2);
			}else{
				break;
			}
		}
		size ++;
	};
	this.poll = function (){
		if(size == 0)
			return null;
		size--;
		if(size == 0){
			return pq.pop().item;
		}
		var r = pq[0].item;
		pq[0] = pq.pop();
		var idx = 0;
		while(true){
			if(idx * 2 + 1 >= size)
				break;
			if(idx * 2 + 2 >= size){
				if(compare(pq[idx * 2 + 1], pq[idx]) > 0){
					var tmp = pq[idx];
					pq[idx] = pq[idx * 2 + 1];
					pq[idx * 2 + 1] = tmp;
					break;
				}else{
					break;
				}
			}
			if(compare(pq[idx * 2 + 1], pq[idx * 2 + 2]) > 0){
				if(compare(pq[idx * 2 + 1], pq[idx]) > 0){
					var tmp = pq[idx];
					pq[idx] = pq[idx * 2 + 1];
					pq[idx * 2 + 1] = tmp;
					idx = idx * 2 + 1;
				}else
					break;
			}else{
				if(compare(pq[idx * 2 + 1], pq[idx]) > 0){
					var tmp = pq[idx];
					pq[idx] = pq[idx * 2 + 2];
					pq[idx * 2 + 2] = tmp;
					idx = idx * 2 + 2;
				}else
					break;
			}
		}
		return r;
	};
	this.peek = function (){
		if(pq.length == 0)
			return null;
		return pq[0].item;
	};
	this.size = function(){
		return size;
	};
}
