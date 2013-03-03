/** Plugin manager **/
var Plugins = new function(){
	var plugins = {};
	try{
		JSON.parse(localStorage["settings"]);
	}catch(e){
		localStorage["settings"] = "{}";
	}
	var commit = function(){
		localStorage["settings"] = JSON.stringify(plugins);
	};
	var checkValid = function(p){
		if(typeof p.key != "string" || typeof p.name != "string")
			return false;
		if(typeof p.version != number)
			return false;
		if(typeof p.permissions == "object" && Array.isArray){
			if(!Array.isArray(p.permissions))
				return false;
			if(p.permissions.length == 0)
				return true;
			for(var i = 0; i < p.permissions.length; i++){
				if(typeof p.permissions[i] != "string")
					return false;
			}
			return true;
		}else
			return false;
	};
	var checkKey = function(pKey){
		//Checks the key of the plugin
		
	};
	this.install = function(plugin){
		if(plugin == null || plugin.id == null)
			return false;
		if(this.exists(plugin.id)){
			return false;
		}else{
			if(checkValid(plugin)){
				plugins[plugin.id] = {
					"name":plugin.name,
					"key":plugin.key,
					"version":plugin.version,
					"permissions":plugin.permissions
				};
				return true;
			}else{
				return false;
			}
		}
	};
	this.getPriv = function(pluginId){
		return plugins[pluginId].permissions;
	};
	this.exists = function(pluginId){
		return plugins[pluginId] != null;
	};
}