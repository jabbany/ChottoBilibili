var bilividata = {
	"title":"",
	"pic":"",
	"desc":""
}

//Find the title
var infoblock = document.getElementsByClassName("info");
if(infoblock != null && infoblock.length > 0){
	var title = infoblock[0].getElementsByTagName("h2");
	if(title != null && title.length > 0){
		bilividata.title = title[0].innerText + " - 嗶哩嗶哩";
	}
}

//Find description
var introblock = document.getElementsByClassName("intro");
if(introblock != null && introblock.length > 0){
	bilividata.desc = introblock[0].innerText;
}

//Find thumbnail
var metablocks = document.getElementsByTagName("meta");
if(metablocks != null)
	for(var i = 0; i < metablocks.length; i++){
		if(metablocks[i].getAttribute("rel") == "media:thumbnail" || 
			metablocks[i].getAttribute("itemprop") == "thumbnailUrl"){
			bilividata.pic = metablocks[i].content;
		}
	}

chrome.extension.sendMessage({
	"method": "sharePageAction",
	"url": document.location.href,
	"pic": bilividata.pic,
	"desc": bilividata.desc,
	"title": bilividata.title
}, function(resp) {/* Snub it */});
