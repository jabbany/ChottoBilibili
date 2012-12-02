/** 
* Stalker Unit for BiliBili
* Registers on open and close of a Bilibili Page 
**/
function callMothership(){
	chrome.extension.sendMessage({
		"method": "biliStalker", 
		"url": document.location.href,
		"event": "onExitPage"
		}, function(resp) {/* Snub it */});
}

function hookStalkModule(){
	var div = document.createElement("div");
	div.addEventListener("click",function(){
		window.addEventListener("beforeunload",function(){
			callMothership();
			return null; /* No Warning */
		});
	});
	div.click(); /* Hook Close tracker! */
	chrome.extension.sendRequest({
		"method": "biliStalker", 
		"url": document.location.href,
		"event": "onEnterPage"
		}, function(resp) {/* Snub it */});	
}

chrome.extension.sendMessage({
		"method": "getSetting",
		"key": "bili.stalker"
	},function(resp){
		if(resp != null && resp.value == "true")
			hookStalkModule();
	}
);