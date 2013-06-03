var parentExtensionId = "imnpnkekmhafpbpdalpikoenniilllcj";
function bindToParent(callback){
	if(localStorage["bindParent"] != null)
		var bind = localStorage["bindParent"];
	else
		var bind = parentExtensionId;
	//Create binding
	
	chrome.runtime.sendMessage(bind, {
		method:"prompt-install",
		name:chrome.i18n.getMessage("extension_name"),
		key:"",
		permissions:["offer-data","shared-settings"],
		version:0.9
	},function(response) {
		console.log(response);
		if(response == null || response.error != null){
			localStorage["isBound"] = "false";
		}else{
			localStorage["isBound"] = 
				(response.installed || 
					(!response.installed && response.code == 409)) ? "true" : "false";
		}
		if(callback != null)
			callback();
	});
}

window.addEventListener("load",function(){
	if(localStorage["isBound"] == "true"){
		var t = document.getElementById("bindState");
		t.innerText = chrome.i18n.getMessage("msg_bind_success");
		t.style.background = "#6cc644";
	}else{
		var t = document.getElementById("bindState");
		t.innerText = chrome.i18n.getMessage("msg_bind_fail");
		t.style.background = "#bd2c00";
		t.style.cursor = "pointer";
		t.addEventListener("click",function(){
			bindToParent(function(){
				window.location.reload();
			});
		});
	}
	//Bind rechecker
	var rc = document.getElementById("recheck");
	rc.addEventListener("click",function(e){
		bindToParent(function(){
			window.location.reload();
		});
		if(e != null && e.preventDefault != null)
			e.preventDefault(); 
	});
});
