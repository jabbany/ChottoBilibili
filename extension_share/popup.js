var $ = function(e){return document.getElementById(e);}
function cleanUp ( text ){
	text = text.replace(/\u3010.+?\u3011/g, "");
	text = text.replace(/\s»$/,"");
	text = text.replace(/^«\s/,"");
	text = text.replace(/\s*$/,"");
	text = text.replace(/\d+\s*$/,"");
	text = text.replace(/\s*$/,"");
	text = text.replace(/\u7B2C.+?$/,"");
	return text;
}

function getSimpleDate(){
	var d = new Date();
	return Math.round(d.getTime() / 1000);
}

var dataURIToBlob = function(dataURI, mimetype) {
	var BASE64_MARKER = ';base64,';
	var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
	var base64 = dataURI.substring(base64Index);
	var raw = window.atob(base64);
	var rawLength = raw.length;
	var uInt8Array = new Uint8Array(rawLength);

	for (var i = 0; i < rawLength; ++i) {
	uInt8Array[i] = raw.charCodeAt(i);
	}

	var bb = new this.BlobBuilder();
	bb.append(uInt8Array.buffer);
	return bb.getBlob(mimetype);
};

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
			$("share_screenshot").addEventListener("click", function(){
				$("tmp").innerHTML = "";
				chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {
					format:"png"
				},function (dataUrl){
					//Data url save invoke
					if(!dataUrl || dataUrl === ""){
						return;
					}
					try{
						chrome.extension.sendMessage({
							"method": "saveScreenshot",
							"dataUrl": dataUrl,
							"filename": "screenshot-" + cleanUp(refobj.title) + "-" + getSimpleDate()
						}, function(resp) {/* Snub it */});
					}catch(e){
						console.log(e);
					}
				});
			});
			refobj.desc += " 【分享自ちょっと嗶哩嗶哩插件】";
			$("share_xn").addEventListener("click",function(){
				var rrShareParam = {
					resourceUrl: refobj.url,
					srcUrl: refobj.url,
					pic: refobj.pic,
					title: refobj.title  + " - 嗶哩嗶哩",
					description: refobj.desc
				};
				rrShareOnclick(rrShareParam);
			});
		}catch(e){
			console.log("[Err] Send binding error");
		}
	});
});
