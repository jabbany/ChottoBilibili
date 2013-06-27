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

function toggle(elem, className){
	var classNames = elem.className.split(" ");
	for(var i = 0; i < classNames.length; i++){
		if(classNames[i] == className){
			classNames.splice(i,1);
			elem.className = classNames.join(" ");
			return;
		}
	}
	classNames.push(className);
	elem.className = classNames.join(" ");
	return;
}

function bgmToTile(eps){
	return {
		image: eps.subject.images.grid,
		title: eps.name,
		current: eps.ep_status,
		total: eps.subject.eps,
		type: "bangumi"
	};
}

function biliToTile(eps){
	return {
		image: eps.cover,
		title: eps.name,
		current: eps.current,
		total: eps.total,
		type: "bili"
	}
}

function createTile(epst){
	var tile =_("div",{"className":"clearbox"});
	var imgwrp = _("div",{"className":"img-wrap ll " + epst.type});
	var img = _("img",{"src":epst.image, "className":"b-icon"});
	var nm = document.createTextNode(epst.title);
	var status = document.createTextNode("当前进度：" + epst.current + " / " + epst.total);
	imgwrp.appendChild(img);
	tile.appendChild(imgwrp);
	tile.appendChild(nm);
	tile.appendChild(_("br",{}));
	tile.appendChild(status);
	tile.appendChild(_("div",{"style":{"clear":"both"}}));
	tile.addEventListener("click", function(){
		toggle(this, "selected");
	});
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
					console.log(results[i]);
					bgml.appendChild(createTile(bgmToTile(results[i])));
				}
				bgml.appendChild(_("div",{"className":"clear"}));
			}
		});
	}
	
	/** Check to see if we're already installed **/
	if(!SC.get("binding.installed", false)){
		//Initiate Install
		installPlugin(function(){
			if(SC.get("binding.installed", false))
				window.location.reload();
			else{
				alert("Install plugin failed! Please accept at prompt");
			}
		});
	}else{
		//We can fetch the watchlist
		try{
			chrome.runtime.sendMessage(SC.get("parent.id",""), {
				"method":"get-folist"
			},function(response){
				if(response == null || response.code == 401){
					SC.set("binding.installed", false);
					alert("Main plugin disabled binding!");
				}else if(response.code == 200){
					//We will recieve the list here
					var bili = $("uListsBili");
					if(bili == null) return;
					bili.innerHTML = "";
					for(var i = 0; i < response.bangumi.length; i++){
						bili.appendChild(createTile(biliToTile(response.bangumi[i])));
					}
					console.log(response.bangumi);
				}else{
					alert("Error " + response.code + " : " + response.error);
				}
			});
		}catch(e){
			SC.set("binding.installed", false);
			alert("Main plugin disabled binding!");
		}
	}
});
