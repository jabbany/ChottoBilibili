//Simpler settings connection unit, since this doesn't have to deal with
//race conditions etc.
function SettingsConnector(){
	var settings = {};
	try{
		settings = JSON.parse(localStorage["settings"]);
	}catch(e){
		localStorage["settings"] = "{}";
	}
	this.get = function(key, def){
		return settings[key] == null ? def : settings[key];
	};
	this.set = function(key, val){
		settings[key] = val;
		localStorage["settings"] = JSON.stringify(settings);
	};
}
