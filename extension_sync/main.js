chrome.extension.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		var settings = new SettingsConnector();
		var whitelist = settings.get("security.enforceWhitelist", null);
		switch(request.method){
			case "on-watchfo":{
				var bgm = new BangumiCore(settings);
				if(bgm.followIdExists(request["fo-id"])){
					bgm.updateEpisode(bgm.getId(request["fo-id"]),
						request["episode"],
						{"source":request["avid"]});
				}else{
					//Note that this should rarely happen if it happens at all
					//Main causes would be manual debugging of followList
					//Other updates would invoke event
					var foId = request["fo-id"];
					var pos = request["episode"];
					var src = request["avid"];
					bgm.syncFollow(function(e){
						/*
							States: 1 - Success, 0 - Fail 
						*/
						if(e.state == 1){
							bgm.updateEpisode(bgm.getId(foId),pos,{"source":src});
						}else{
							//This failed
							console.log("[Err] Sync with main plugin failed.");
						}
					});
				}
				sendResponse({});
			}return;
			case "has-permission":{
				if(Plugins.exists(sender.id)){
					var Priv = Plugins.getPriv(sender.id);
					sendResponse({
						has:(Priv.indexOf(request["permission"]) >= 0)
					});
					return;
				}
				sendResponse({has:false});
			}return;
		}
	});
