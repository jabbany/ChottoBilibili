var $ = function(elem) {
	if(typeof elem == "string")
		return document.getElementById(elem);
	return elem;
};

function createBackup(){
	//This creates a backup of the entire file
	var backup = "BLBK:1:" + Math.round((new Date()).getTime() / 1000) + ":";
	var compiledFlags = knCrypto.base64_encode(FlagCatcher.toString());
	var compiledSettings = knCrypto.base64_encode(localStorage["settings"]);
	var compiledBangumiList = knCrypto.base64_encode(localStorage["bangumi"]);
	var payload = "P:" + compiledFlags + ":" + compiledSettings + ":" + compiledBangumiList + ":P";
	var checksum = knCrypto.sha1(payload);
	backup += checksum + ":" + payload + ":END";
	var blb = new Blob([backup],{"type":"application/octet-stream"});
	chrome.tabs.create({"url":window.URL.createObjectURL(blb)});
}

function loadPage(pageIdent){
	if(pageIdent == null) return;
	switch(pageIdent){
		case "flags":{
			if(FlagCatcher == null)
				return;
		}break;
		
	}
}

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
	try{
		$("i" + hsh).style.display="";
		loadPage(hsh);
	}catch(e){
	
	};
}

$(window).addEventListener("load",function(){

	$("btnClearTransient").addEventListener("click",function(){
		if(confirm("You are about to clear the Transient State store. Are you sure?")){
			var t = new TransientPrayer();
			t.reset();
			alert("Transient Prayers cleared");
			try{
				var ntn = document.createTextNode("Transients Dump: " + t.toString());
				$("tinput").appendChild(document.createElement("br"));
				$("tinput").appendChild(ntn);
			}catch(e){}
		}
	});
	
	$("btnBackup").addEventListener("click",function(){
		createBackup();
	});
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