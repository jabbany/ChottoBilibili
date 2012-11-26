function CacheDB(){
	var mode = 1;
	var db = {};
	if(window != null && window.indexedDB != null){
		var request = window.indexedDB.open("bilicache","Cache for bilibili videos");
		request.onsuccess = function(e){
			db = request.result || e.result;
			mode = 0;
			/* Fix inserts between interval if they happen */
		};
		request.onerror = function(){
			mode = 1;
		}
	}
	var __commit = function (){
		if(mode == 1)
			localStorage["bilicache"] = JSON.stringify(db);
	};
	var __sync = function (){
		if(mode == 1)
			db = JSON.parse(localStorage["bilicache"]);
	};
	var _insert_idxdb = function(key,value){
		
	};
	var _find_idxdb = function(key){
	
	};
	var _update_idxdb = function(key,newValue){
	
	};
	
	this.insert = function(key,value){
		if(mode == 0)
			_insert_idxdb(key,value);
		else if(mode == 1){
			db[key] = value;
			__commit();
		}
	};
	this.update = function(key,value){
		if(mode == 0)
			_update_idxdb(key,value);
		else if(mode == 1){
			db[key] = value;
			__commit();
		}
	};
	
	this.find = function(index){
		/** Find a value by index, guaranteed fast **/
		if(mode == 1){
			__sync();
			return db[index];
		}
	};
	this.search = function(idx,value){
		/** Filter all records, not guaranteed fast **/
		if(mode == 1){
			
		}
	};
}

