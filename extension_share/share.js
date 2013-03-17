chrome.extension.sendMessage({
	"method": "sharePageAction",
	"url": document.location.href
}, function(resp) {/* Snub it */});