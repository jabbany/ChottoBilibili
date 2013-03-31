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
			var sectData = infoBlock.getElementsByTagName('a');
			var section = "";
			for(var n = 0;n < sectData.length; n++){
				if(n != 0)
					section += "_" + sectData[n].innerText;
				else
					section = sectData[n].innerText;
			}
			var trigger = document.createElement('a');
			trigger.setAttribute("href","javascript:;");
			trigger.style.color = "#f93";
			trigger.addEventListener("click",function(){
				var avid = /av(\d+)/.exec(document.location.pathname);
				var title = "";
				var tbox = document.getElementsByClassName('info');
				if(tbox.length >0){
					var titles = tbox[0].getElementsByTagName('h2');
					if(titles.length > 0){
						var titleElem = titles[0];
						var title = titleElem.innerText;
						title = title.replace(/\s»$/,'');
						title = title.replace(/^«\s/,'');
					}
				}
				chrome.extension.sendMessage({
					"method":"addFollowDlg",
					"title":title,
					"section":section,
					"avid":avid
				},function(response){
					if(response.accepted){
						var w = openPopup(chrome.extension.getURL("addprompt.html"),"",600,480);
					}else{
						alert(chrome.i18n.getMessage("add_match_not_found"));
					}
				});
			});
			trigger.appendChild(document.createTextNode(
				chrome.i18n.getMessage("content_collect")
			));
			infoBlock.appendChild(trigger);
		}
	}catch(e){
		console.log("[ChottoBilibili] Matcher returned illegal reference.");
	}
}

addCollectInterface();
