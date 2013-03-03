function SettingsConnector(){
	var abs = {};
	var STSyncCommited = false, STSyncReady = false;
	try{
		abs = JSON.parse(localStorage["settings"]);
	}catch(e){}
	try{
		var ref = this;
		chrome.storage.sync.get("settings",function(items){
			if(items == null || items.settings == null){
				ref.commit();
				return;
			}
			abs = JSON.parse(items.settings);
			localStorage["settings"] = items.settings;
		});
	}catch(e){STSyncReady = false;}
	
	this.commit = function(){
		localStorage["settings"] = JSON.stringify(abs);
		try{
			chrome.storage.sync.set({"settings":JSON.stringify(abs)},function(){
				STSyncCommited = true;
				STSyncReady = true;
			});
		}catch(e){
			console.log("[Err](Storage) Save Settings Failed.");
			STSyncReady = false;
		}
	};
	this.getApiKey = function(){
		if(this.get("api.key") == null)
			return "30d25295cbcfeedc";
		return this.get('api.key');
	};
	this.get = function (key) {
		if(key == null)
			return null;
		k = key.split(".");
		var curObj = abs;
		for(var i = 0; i < k.length; i++){
			if(curObj[k[i]] != null)
				curObj = curObj[k[i]];
			else
				return null;
		}
		return curObj;
	};
	this.set = function (key, value) {
		if(key == null)
			return;
		k = key.split('.');
		var curObj = abs;
		for(var i = 0; i < k.length - 1; i++){
			if(curObj[k[i]] != null)
				curObj = curObj[k[i]];
			else{
				curObj[k[i]] = {};
				curObj = curObj[k[i]];
			}
		}
		curObj[k[k.length - 1]] = value;
		return;
	};
}