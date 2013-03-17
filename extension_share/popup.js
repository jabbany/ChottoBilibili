var $ = function(e){return document.getElementById(e);}
chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function (tabs){
	if(tabs == null || tabs.length == 0){
		console.log('[Err]Tabs permission failed');
		return; //Failed
	}
	console.log(tabs[0]);
	try{
		var tabref = JSON.parse(localStorage['tabref']);
	}catch(e){
		console.log('[Err]Tabref parse error');
		localStorage['tabref'] = '{}';
	}
});