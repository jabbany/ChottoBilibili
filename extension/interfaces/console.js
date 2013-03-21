var $ = function(elem) {
	if(typeof elem == "string")
		return document.getElementById(elem);
	return elem;
};
var inst = {
	settings:new SettingsConnector()
}

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
			if(FlagCatcher == null){
				console.log("[Err] Flags interface uninitialized");
				return;
			}
		}break;
		case "sync":{
			if(inst.settings == null)
				inst.settings = new SettingsConnector();
			var enabled = inst.settings.get("sync.enabled");
			var lastmsg = inst.settings.get("sync.lastMessage");
			if(!enabled){
				$("sync_data").innerText = "Disabled";	
			}else{
				$("sync_data").innerText = lastmsg;
			}
		}
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

function writeToConsole(text){
	var div = $("tinput");
	div.appendChild(document.createElement("br"));
	div.appendChild(document.createTextNode(text));
	div.scrollTop = div.scrollHeight;
}

$(window).addEventListener("load",function(){
	try{
		var SE = new ScriptingEngine();
	}catch(e){};
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
	$("btnRestore").addEventListener("click",function(){
		try{
			$("restore-div").style.display = ($("restore-div").style.display != "none" ? "none" : "");
		}catch(e){}
	});
	$("command-line").addEventListener("keydown",function(e){
		if(e.keyCode == 13){
			//try{
				if($("command-line").value != ""){
					SE.execute($("command-line").value);
				}
			//}catch(e){
			//	writeToConsole("[Error] Scripting command raised exception!");
			//}
			$("command-line").value = "";
		}else if(e.keyCode == 38){
			try{
				$("command-line").value = SE.getHistory();
			}catch(e){}
		}
	});
	try{
		SE.hookTerminal($('tinput'));
		SE.hookInput($("command-line"));
	}catch(e){console.log("Scritping Engine Hook Error");}
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
