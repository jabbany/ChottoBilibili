/** 
 * Stalker Unit for BiliBili
 * Registers on open and close of a Bilibili Page
 **/

function callMothership(dur, section) {
    chrome.extension.sendMessage({
        "method": "biliStalker",
        "url": document.location.href,
        "duration": dur,
        "section": section
    }, function (resp) { /* Snub it */ });
}

function hookStalkModule() {
    var hookTime = Math.round((new Date()).getTime() / 1000);
    var div = document.createElement("div");
    div.addEventListener("click", function () {
        window.addEventListener("beforeunload", function () {
            var dur = Math.round((new Date()).getTime() / 1000) - hookTime;
            var section = "";
            
            var tmInfo = document.getElementsByClassName("tminfo");
            if(tmInfo != null && tmInfo.length > 0){
		        var infoBlock = tmInfo[0],sectData = infoBlock.getElementsByTagName('a');
		        for (var n = 0; n < sectData.length; n++) {
		            if (n != 0)
		                section += "_" + sectData[n].innerText;
		            else
		                section = sectData[n].innerText;
		        }
            }
            callMothership(dur, section);
            return null; /* No Warning */
        });
    });
    div.click(); /* Hook Close tracker! */
}

chrome.extension.sendMessage({
    "method": "getSetting",
    "key": "privacy.history.allow"
}, function (resp) {
    if (resp != null && resp.value)
        hookStalkModule();
});
