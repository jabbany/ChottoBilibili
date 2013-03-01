var FlagCatcher = new function(){
	var flags = {};
	try{
		flags = JSON.parse(localStorage["flags"]);
	}catch(e){
		localStorage["flags"] = "{}";
	}
	this.get = function(key,def){
		if(typeof flags[key] == "undefined"){
			return def;
		}
		return flags[key];
	};
	this.toString = function(){
		return JSON.stringify(flags);
	}
}