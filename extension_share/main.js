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
				tabref[sender.tab.id] = {
					"url":request.url,
					"pic":request.pic,
					"desc":request.desc,
					"title":request.title
				};
				localStorage['tabref'] = JSON.stringify(tabref);
				sendResponse({});
				return;
			}break;
			default:break;
		}
	}else{
		switch(request.method){
			case "saveScreenshot":{
				console.log("[Log] Save File Init");
				var url = window.webkitURL || window.URL || window.mozURL || window.msURL;
				var saveLink = document.createElement('a');
				saveLink.download = request.filename;
				saveLink.href = request.dataUrl;
				saveLink.dataset.downloadUrl = ['png', saveLink.download, saveLink.href].join(':');
				document.body.appendChild(saveLink);
				saveLink.click();
				document.body.removeChild(saveLink);
				sendResponse({});
				return;
			}break;
			default:break;
		}
	}
	sendResponse({});/* Snub them */
});
