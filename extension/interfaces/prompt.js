var $ = function(e){return document.getElementById(e);};
function trimtitle(text, soft){
	if(!soft){
		text = text.replace(/^\u3010(?:(?!\u3010).)+?\u3011/g, "");
	}
	text = text.replace(/\u3010(?:(?!\u3010).)+?\u3011$/g, "");
	text = text.replace(/\s»$/,"");
	text = text.replace(/^«\s/,"");
	return text;
}

function match(title){
	var found = [];
	var masterMatcher = /\u7B2C([\u96F6\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343\u4E07]+)[^\u5B63]/g;
	while(m = masterMatcher.exec(title)){
		found.push([m.index,m[1],0]);
	}
	//Another master matcher
	var secondaryMatcher = /(\d+)(?![\u6708\u5E74\d])/g;
	while(n = secondaryMatcher.exec(title)){
		var sid = parseInt(n[1]);
		if(sid < 1000 && 
			!(new RegExp("(\u7B2C){0,1}\\s*" + n[1] + "\\s*\u5B63").test(title)) && 
			!(new RegExp(n[1] + "\\s*\u5E74").test(title)) &&
			!(new RegExp("\u5168.*?\u96C6").test(title))){
			//This is not a season number or year
			found.push([n.index,n[1],1]);
		}
	}
	return found;
}

var trans = new TransientPrayer();
var bgml = new BangumiList();
var data = trans.get("add.data", null);

window.addEventListener("load", function(){	
	if(data == null){
		document.title = "Error: No Data";
		return;
	}
	document.title = chrome.i18n.getMessage("content_collect_title", trimtitle(data.title));
	$("bangumiNameGuess").innerText = trimtitle(data.title);
	$("bangumiTypeGuess").innerText = "追番列表";
	$("pBangumiName").value = trimtitle(data.title);
	$("pBangumiName").addEventListener("keyup", function(){
		if(this.value.length <= 48){
			$("bangumiNameGuess").innerText = this.value;
		}
		if(this.parentNode == null || this.parentNode.parentNode == null)
			return;
		else{
			if(this.value == "" || this.value.length > 48){
				this.parentNode.parentNode.className = "control-group error";
			}else{
				this.parentNode.parentNode.className = "control-group";
			}
		}
	});
	
	var found = match(data.title);
	if(found.length == 0){
		//Could Not even find a suitable thing
		$("cg_regex").className = "control-group error";
		$("cg_msg").innerText = "无法确定匹配式，请手动输入！"
	}else{
		//Populate the data
		var current = Tools.parseTextNumber(found[0][1]);
		var guessTotal = bgml.findClosestTotal(current);
		
		$("pProgress").value = current;
		$("pTotal").value = guessTotal;
		
		//Create the rule
		var modTitle = trimtitle(data.title, true);
		var _temp_fore = modTitle.substr(0,found[0][0]);
		var _temp_back = modTitle.substr(found[0][0]+found[0][1].length);
		var _temp_fore_rule = _temp_fore.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		var _temp_back_rule = _temp_back.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		var rule = _temp_fore_rule;
		if(found[0][2] == 0){
			rule += "([\u96F6\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343\u4E07]+)";
		}else{
			rule += "(\\d+)";
		}
		rule += _temp_back_rule;
		
		$("pRegexp").value = rule;
	}
});
