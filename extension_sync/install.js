if(!SC)
	var SC = new SettingsConnector();
if(SC.get("parent.id", "") == ""){
	var PARENT_ID = "imnpnkekmhafpbpdalpikoenniilllcj";
}else{
	var PARENT_ID = SC.get("parent.id","");
}

function installPlugin(callback){
	//Sends an installation request to the host plugin
	if(PARENT_ID == null){
		console.error("PARENT_ID undefined. Cannot Proceed");
		return;
	}
	try{
		chrome.runtime.sendMessage(PARENT_ID, {
			"method":"prompt-install",
			"name":chrome.i18n.getMessage("extension_name"),
			"key":"[placeholder]",
			"permissions":["offer-data","shared-settings","query-watchlist","modify-watchlist"],
			"version":0.9
		},function(response) {
			if(response == null || response.error != null){
				SC.set("binding.installed", true);
			}else{
				SC.set("binding.installed",
					(response.installed || 
						(!response.installed && response.code == 409)) ? true : false);
			}
			if(callback != null)
				callback();
		});
	}catch(e){
		//This means we do not have the main plugin installed
		SC.set("binding.installed", false);
		if(callback != null)
			callback();
	}
}
