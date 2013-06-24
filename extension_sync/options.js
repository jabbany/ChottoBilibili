var $ = function ( e ){ return document.getElementById(e); }
var _ = function ( type, init, inner ){
	var elem = document.createElement(type);
	for(var i in init){
		if(i != 'style'){
			elem[i] = init[i];
		}else{
			for(var j in init[i]){
				elem['style'][j] = init[i][j];
			}
		}
	}
	if(typeof inner == "string")
		elem.appendChild(document.createTextNode(inner));
	else if(typeof inner != "undefined" && inner != null)
		elem.appendChild(inner);
	return elem;
}

function createTile(eps){
	var tile =_("div",{"className":"clearbox"});
	var imgwrp = _("div",{"className":"img-wrap ll"});
	var img = _("img",{"src":eps.subject.images.grid, "className":"b-icon"});
	var nm = document.createTextNode(eps.name);
	var status = document.createTextNode("当前进度：" + eps.ep_status);
	imgwrp.appendChild(img);
	tile.appendChild(imgwrp);
	tile.appendChild(nm);
	tile.appendChild(_("br",{}));
	tile.appendChild(status);
	tile.appendChild(_("div",{"style":{"clear":"both"}}));
	return tile;
}


var SC = new SettingsConnector();
var BGM = new BangumiCore(SC);
BGM.loadAuth();

window.addEventListener('load', function(){
	$("sPassword").value = SC.get("bgm.password", "");
	$("sUserName").value = SC.get("bgm.user", "");
	if(BGM.getUID() >= 0){
		$("uUserId").innerText = BGM.getUID();
		$("uNickname").innerText = BGM.getNickname();
		$("uAvatar").src = BGM.getAvatar("large");
	}
	$("sPassword").addEventListener("keyup",function(){
		SC.set("bgm.password", this.value);
	});
	
	$("sUserName").addEventListener("keyup",function(e){
		SC.set("bgm.user", this.value);
		if(e != null && e.keyCode == 13){
			
		}
	});
	
	$("sUserName").addEventListener("blur",function(){
		if(BGM.getUID() >= 0)
			return;
		BGM.authenticate(SC.get("bgm.user"),SC.get("bgm.password"),function(response){
			if(response.status == 200){
				$("uUserId").innerText = BGM.getUID();
				$("uNickname").innerText = BGM.getNickname();
				$("uAvatar").src = BGM.getAvatar("large");
				BGM.saveAuth();
			}else{
				$("uNickname").innerText = "认证失败";
				$("uAvatar").src = "assets/user.gif";
				$("uUserId").innerText = -1;
			}
		});
	});
	
	/** Load the section info -- uncached parings -- **/
	if(BGM.getToken() != null){
		BGM.api("/user/" + BGM.getLogin() + "/collection", true, {}, {"cat":"watching"}, function(results){
			var bgml = $("uListsBgm");
			if(bgml == null) return;
			if(results == null){
				bgml.innerHTML = "【载入失败，请确定您的信息正确】";
				return;
			}
			bgml.innerHTML = "";
			if(results != null){
				for(var i = 0; i < results.length; i++){
					bgml.appendChild(createTile(results[i]));
				}
				bgml.appendChild(_("div",{"className":"clear"}));
			}
		});
	}
});
