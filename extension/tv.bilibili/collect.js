var $ = function(e){
	return document.getElementById(e);
};
var $c = function(c){
	return document.getElementsByClassName(c);
};

function openPopup(pageURL, title,w,h) {
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2);
	var targetWin = window.open(pageURL, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, width='+w+', height='+h+', top='+top+', left='+left);
	return targetWin;
} 

function addCollectInterface(){
	var tmInfo = $c("tminfo");
	try{
		if(tmInfo != null && tmInfo.length > 0){
			var infoBlock = tmInfo[0];
			var trigger = document.createElement('a');
			trigger.setAttribute("href","javascript:;");
			trigger.style.color = "#f93";
			trigger.addEventListener("click",function(){
				var title = "添加 X 为追番信息？";
				var w = openPopup(chrome.extension.getURL("prompt.html"),title,400,300);
				console.log(w);
			});
			trigger.appendChild(document.createTextNode(
				chrome.i18n.getMessage("content_collect")
			));
			infoBlock.appendChild(trigger);
		}
	}catch(e){
		console.log("[ChottoBilibili]Matcher returned illegal reference.");
	}
}
addCollectInterface();