var $ = function(e){return document.getElementById(e);};
function trimtitle(text){
	text = text.replace(/^\u3010(?:(?!\u3010).)+?\u3011/g, "");
	text = text.replace(/\u3010(?:(?!\u3010).)+?\u3011$/g, "");
	return text;
}

var trans = new TransientPrayer();

window.addEventListener("load", function(){
	var data = trans.get("add.data", null);
	if(data == null){
		document.title = "Error: No Data";
		return;
	}
	document.title = chrome.i18n.getMessage("content_collect_title", trimtitle(data.title));
	$("bangumiNameGuess").innerText = trimtitle(data.title);
	$("bangumiTypeGuess").innerText = "追番列表";
	$("pBangumiName").value = trimtitle(data.title);
	$("pBangumiName").addEventListener("keyup", function(){
		if(this.value.length <= 48){
			$("bangumiNameGuess").innerText = this.value;
		}
		if(this.parentNode == null || this.parentNode.parentNode == null)
			return;
		else{
			if(this.value == "" || this.value.length > 48){
				this.parentNode.parentNode.className = "control-group error";
			}else{
				this.parentNode.parentNode.className = "control-group";
			}
		}
	});
});
