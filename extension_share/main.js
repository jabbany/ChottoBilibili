var parentExtensionId = "pgcobehcmjndpjmglaeiipckahfmmpga";

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(sender.tab){
		switch(request.method){
			case "sharePageAction":{
				chrome.pageAction.show(sender.tab.id);
				try{
					var tabref = JSON.parse(localStorage['tabref']);
				}catch(e){
					var tabref = {};
				}
				tabref[sender.tab.id] = request.url;
				localStorage['tabref'] = JSON.stringify(tabref);
				sendResponse({});
				return;
			}break;
			default:break;
		}
	}else{
		switch(request.method){
			default:break;
		}
	}
	sendResponse({});/* Snub them */
});