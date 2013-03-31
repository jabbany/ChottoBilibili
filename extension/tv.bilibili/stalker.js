/** 
* Stalker Unit for BiliBili
* Registers on open and close of a Bilibili Page 
**/
function callMothership(duration){
	chrome.extension.sendMessage({
		"method": "biliStalker", 
		"url": document.location.href,
		"duration": duration,
		"section": 0
	}, function(resp) {/* Snub it */});
}

function hookStalkModule(){
	var hookTime = Math.round((new Date()).getTime() / 1000);
	var div = document.createElement("div");
	div.addEventListener("click",function(){
		window.addEventListener("beforeunload",function(){
			var dur = Math.round((new Date()).getTime / 1000) - hookTime;
			callMothership(dur);
			return null; /* No Warning */
		});
	});
	div.click(); /* Hook Close tracker! */
}

chrome.extension.sendMessage({
		"method": "getSetting",
		"key": "privacy.history.allow"
	},function(resp){
		if(resp != null && resp.value == "true")
			hookStalkModule();
	}
);
