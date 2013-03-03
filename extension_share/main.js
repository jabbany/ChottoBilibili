var parentExtensionId = "pgcobehcmjndpjmglaeiipckahfmmpga";
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(sender.tab){
		switch(request.method){
			case "sharePageAction":{
				chrome.pageAction.show(sender.tab.id);
				sendResponse({});
				return;
			}break;
		}
	}else{
		
	}
	sendResponse({});/* Snub them */
});