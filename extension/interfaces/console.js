var $ = function(elem) {
	if(typeof elem == "string")
		return document.getElementById(elem);
	return elem;
};
function onHashChanged(){
	var hsh = document.location.hash.replace("#","");
	var hashes = ['home','flags','sync','constants','console'];
	if(hsh == "" || hashes.indexOf(hsh) == -1)
		hsh = "home";
	try{
		for(var i = 0; i<hashes.length; i++){
			$("i" + hashes[i]).style.display = "none";
		}
		
	}catch(e){console.log("Load interface error");}
	try{$("i" + hsh).style.display="";}catch(e){};
}

$(window).addEventListener("load",function(){
	$("tinput").onkeydown = function(evt){
		if($("tinput").innerText.length <= 2 && evt.keyCode == 8){
			evt.preventDefault();
		}else{
			
		}
	};
	var a = $("navbar").getElementsByTagName('a');
	for( var n = 0; n < a.length; n++ ){
		var elem = a[n];
		a[n].addEventListener("click",function(){
			document.location.href = this.href;
			onHashChanged();
		});
	}
	onHashChanged();
});