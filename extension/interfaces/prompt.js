var trans = new TransientPrayer();
window.addEventListener("load", function(){
	var data = trans.get("add.data", null);
	if(data == null){
		document.title = "Error: No Data";
		return;
	}
	document.title = chrome.i18n.getMessage("content_collect_title", data.title);
});
