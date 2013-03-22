var $ = function(e){return document.getElementById(e);}

window.addEventListener("load",function(){
	chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function (tabs){
		if(tabs == null || tabs.length == 0){
			console.log('[Err]Tabs permission failed');
			return; //Failed
		}
		try{
			var tabref = JSON.parse(localStorage['tabref']);
		}catch(e){
			console.log('[Err]Tabref parse error');
			localStorage['tabref'] = '{}';
			return;
		}
		try{
			if(tabref[tabs[0].id] == null){
				console.log("Tab not found. Yikes!");
				$("share").innerHTML = "<p>" + chrome.i18n.getMessage("error_no_url") + "</p>";
				return;
			}
			var refobj = tabref[tabs[0].id];
			refobj.desc += " 【分享自ちょっと嗶哩嗶哩插件】";
			$("share_xn").addEventListener("click",function(){
				var rrShareParam = {
					resourceUrl: refobj.url,
					srcUrl: refobj.url,
					pic: refobj.pic,
					title: refobj.title,
					description: refobj.desc
				};
				rrShareOnclick(rrShareParam);
			});
		}catch(e){
			console.log("[Err] Send binding error");
		}
	});
});
