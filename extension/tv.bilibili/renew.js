/** Refreshes the bilibili interface **/
var $f = function(e){return document.getElementsByClassName(e);};
var $t = function(e){return document.getElementsByTagName(e);};
var removeElement = function(e){
	if(e == null)
		return;
	var par = e.parentNode;
	if(par != null)
		par.removeChild(e);
	else{
		if(e != null && e.style != null){
			e.style.display = "none";
		}
	}
}

var adNodeNames = ["ad-e","ad-e1","ad-e2","ad-f","ad-e4","ad-p","ad-c","ad-b","ad-b2","ad-b4","ad-c","ad-c3","ad-c4"];
for(var i = 0; i < adNodeNames.length; i++){
	var adNodes = $f(adNodeNames[i]);
	if(adNodes != null)
		for(var j = 0; j < adNodes.length; j++){
			removeElement(adNodes[j]);
		}
}
removeElement(document.getElementById("taobaoid"));
