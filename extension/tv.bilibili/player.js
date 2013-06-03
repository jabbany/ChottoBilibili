/** Fix Bilibili Player to use unlicensed player **/
function fixPlayerHTML5(){

}

function fixPlayer(){
	
}

function checkReplace(){
	chrome.extension.sendMessage({
		"method": "getSetting",
		"key": "interface.player.nolicense"
	}, function (resp) {
		if (resp != null && resp.value)	{
			console.log("Replace with non-licensed player. Please respect mainland licensing.");
			fixPlayer();
		}
	});
}

chrome.extension.sendMessage({
	"method": "getSetting",
	"key": "interface.player.html5"
}, function (resp) {
	if (resp != null && resp.value)	{	
		console.log("Using::Experimental HTML5 Player");
		fixPlayerHTML5();
	}else{
		checkReplace();
	}
});
