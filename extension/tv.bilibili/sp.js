/** Works for adding specials **/
function fetchData(){
	var data = {
		title:"",
		aliases:[]
	};
	var title = document.getElementsByTagName("h1");
	if(title != null && title.length > 0){
		data.title = title[0].innerText;
	}
	var jpnTitle = document.getElementsByClassName("tag");
	if(jpnTitle != null && jpnTitle.length > 0){
		var tags = jpnTitle[0].getElementsByTagName("i");
		if(tags != null)
			for(var i = 0; i < tags.length; i++){
				data.aliases.push(tags[i].innerText);
			}
	}
	var d = document.createElement("div");
	d.onclick = function(){return window;}
	var windowObj = d.click();
	if(windowObj != null)
		data.spid = windowObj.spid;
	return data;
}

var elems = document.getElementsByClassName("g");
if(elems != null && elems.length > 0){
	if(elems[0] != null && elems[0].tagName.toUpperCase() == "A"){
		var onclickf = elems[0].onclick;
		elems[0].onclick = function(){};
		elems[0].addEventListener("click",function(){
			var d = fetchData();
			alert("你真的要追" + d.title + "么！");
		});
	}
}