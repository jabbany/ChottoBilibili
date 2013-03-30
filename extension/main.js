var Main = new function () {
	this.list = new BangumiList("plugin",new CommitCallback());
	this.settings = new SettingsConnector();
	this.startCheck = function (){
		var createSectTask = function (section){
			var worker = new SectionWorker(section, Main.list);
			if(worker.done(true))
				return; /* Nothing to do! */
				
			var task = jsPoll.create(function(self){
				var xhr = new XMLHttpRequest();
				var local = self.local;
				var inst = self;
				xhr.onreadystatechange = function(){
					if(xhr.readyState == 4){
						try{
							var api = JSON.parse(xhr.responseText);
						}catch(e){
							if(xhr.responseText == "error"){
								console.log("[Err](API)Resp: E_API_ERROR");
								inst.complete();
								return;
							}
							if(local.retryCount < 8){
								local.retryCount++;
								setTimeout(function(){
									jsPoll.push(task);
									inst.complete();
								},500 * Math.pow(2,local.retryCount));
								return;
							}else{
								console.log("[Err](API)Resp: E_LIMIT_OVER");
								/* Flush the worker */
								worker.flush();
								inst.complete();
								return;
							}
						}
						if(api.code != null && api.code != 0){
							console.log("[Err](API):" + api.error);
							if(api.code == -503){
								//Too fast?
								if(local.retryCount < 8){
									local.retryCount++;
									setTimeout(function(){
										jsPoll.push(task);
										inst.complete();
									},1000 * Math.pow(2,local.retryCount));
								}else{
									console.log("[Err](API)Resp: E_LIMIT_OVER");
									/* Flush the worker */
									worker.flush();
									inst.complete();
									return;
								}
							}
							inst.complete();
							return;
						}
						/* Api Data Correctly Read */
						for(var j=0;j < Math.min(parseInt(api.num) - (local.curpage - 1) * 200,200);j++){
							if(api.list["" + j] == null)
								continue;
							worker.matchInstance(api.list["" + j]);
							if(worker.done(true)){
								break;
							}
						}
						local.rempages = parseInt(api.pages) - local.curpage;
						local.curpage++;
						if(!worker.done()){
							if(local.rempages > 0){
								setTimeout(function(){
									jsPoll.push(task);
									inst.complete();
								},500);
							}else{
								worker.flush();
								inst.complete();
							}
						}else{
							/* Worker is done! */
							inst.complete();
						}
						console.log("[Log] Batch " + worker.getSection() + ":" + (local.curpage - 1)); 
					}
				};
				xhr.open("GET", 
				  "http://api.bilibili.tv/list?type=json&appkey=" + Main.settings.getApiKey() + 
				  "&tid=" + worker.getSection() + 
				  "&page=" + local.curpage + 
				  "&pagesize=200&order=default", true);
				xhr.send();
			});

			task.local.curpage = 1;
			task.local.rempages = 1;
			task.local.retryCount = 0;
			/** Set a handler **/
			task.onKill = function(){
				worker.flush();
			};
			/** Push this task **/
			jsPoll.push(task);
		};
		/** Create tasks according to section **/
		var sections = Main.list.getSections();
		for(var i = 0; i < sections.length; i++){
			createSectTask(sections[i]);
		}
		/** Also, add a new task to fetch the bangumidata **/
		var nt = jsPoll.create(function(self){
			var xhr = self.global.xhr;
			xhr.onreadystatechange = function (){
				if(xhr.readyState == 4){
					try{
						var api = JSON.parse(xhr.responseText);
					}catch(e){
						if(xhr.responseText == "error"){
							console.log("[Err](API)Resp: E_API_ERROR");
							self.complete();
							return;
						}
					}
				}
			};
			xhr.open("GET","http://api.bilibili.tv/bangumi?type=json&appkey" + Main.settings.getApiKey() +
			"&btype=2",true);
			xhr.send();
		});
		
		/** Run The jsPoll~ **/
		jsPoll.run();
	};
	this.recache = function(){
		var caches = Main.list.getAllCached();
		var cacheDB = new CacheDB();
		cacheDB.refresh();
		jsPoll.global.xhr = new XMLHttpRequest();
		jsPoll.create(function(self){
		
		});
	};
	this.resumeHold = function(){
		if(localStorage["__suspend"] == null)
			return;
		try{
			var susp = JSON.parse(localStorage["__suspend"]);
		}catch(e){return;}
		for(var i = 0; i < susp.length; i++){
			//Resume task
			if(susp[i].type == "sectworker"){
				
			}
		}
	};
}

/** ADD INSTALL HOOK TO MANAGE CONTEXT MENUS **/
chrome.runtime.onInstalled.addListener(function() {
	if(Main == null)
		Main = {};
	if(Main.settings == null)
		Main.settings = new SettingsConnector();
	if(Main.settings.get("interface.contextMenu.enabled")){
		chrome.contextMenus.create({
			"id":"default-menu",
			"title":chrome.i18n.getMessage("context_menu_search"),
			"contexts":["selection"]
		},function(){
			if(chrome.extension.lastError != undefined &&
				chrome.extension.lastError != null){
				Main.settings.set("interface.contextMenu.enabled",false);
				Main.settings.set("interface.contextMenu.error",chrome.extension.lastError.message);
			}else{
				/** Successfully added the menu item
					We probably needn't add it again anymore
				 **/
			}
		});
		chrome.contextMenus.onClicked.addListener(function(clickData, tab){
			if(clickData.menuItemId != "default-menu")
				return;
			var matchers = Main.settings.get("interface.contextMenu.matchers");
			var selection = clickData.selectionText;
			if(matchers != null){
				for(var i in matchers){
					var m = (new RegExp(i)).exec(selection);
					if(m != null && m.length > 0){
						var addr = matchers[i];
						for(var i = 0; i < m.length; i++){
							addr.replace("{" + i + "}", m[i]);
						}
						//Navigate to address
						chrome.tabs.create({
							url:addr
						});
						return;
					}
				}
			}
			//Not found or no matchers
			chrome.tabs.create({
				url:"http://www.bilibili.tv/search?keyword=" + encodeURIComponent(selection) + "&orderby=&formsubmit="
			});
		});	
	}
});

/** ADD LISTENERS FOR INCOMING REQUESTS **/
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(sender.tab){
		if(request.method == null){
			console.log("[War](Msg)Illegal Msg.Intern");
			sendResponse({});//Snub it
			return;
		}
		switch(request.method){
			case "biliStalker":{
				sendResponse({});
				return;
			}break;
			case "getSetting":{
				var sObj = (Main == null) ? new SettingsConnector() : Main.settings;
				var val = sObj.get(request.key);
				sendResponse({value:val});
				return;
			}break;
			case "invokeSync":{
				//Invoke a sync operation
				sendResponse({});
				return;
			}break;
			case "getBangumiList":{
				try{
					var bgml = JSON.parse(localStorage["bangumi"]);
					sendResponse(bgml);
				}catch(e){
					sendResponse({});
				}
				return;
			}break;
			case "quickUpdate":{
				//Quick Updates
				sendResponse({"status":200});
				return;
			}break;
			case "quickCheck":{
				//Invoke a quick action check
				sendResponse({"status":404});
			}break;
		}
	}else{
		
	}
	sendResponse({});/* Snub them */
});

/** Allow other extensions to connect **/
chrome.extension.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		var blacklist = Main.settings.get('plugins.blocked');
		if (blacklist != null && blacklist.indexOf(sender.id) < 0)
			return;
		if(request.method == null)
			sendResponse({"error":"Method not provided"});
		switch(request.method){
			case "prompt-install":{
				var success = Plugins.install({
					id:sender.id,
					name:request.name,
					key:request.key,
					permissions:request.permissions,
					version:request.version
				});
				sendResponse({
					installed: success
				});
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

/** Create the timers or alarms **/
if(!chrome.runtime){
	/* Include support for legacy chrome */
	var duration = Main.settings.get('timers.refresh');
	duration = (duration == null ? 15 : duration);
	setInterval(duration * 60000, function(){
		//Main.startCheck();
	}); 
}else{
	var delay = Main.settings.get("timers.refresh");
	delay = (delay == null ? 15 : delay);
	chrome.alarms.create('refresh',{periodInMinutes: delay});
	chrome.alarms.onAlarm.addListener(function(a){
		if(a.name == "refresh"){
			//Main.startCheck();
		}else if(a.name == "resume"){
			chrome.alarms.clear("resume");
			Main.resumeHold();
		}
	});
	chrome.runtime.onSuspend = function(){
		/** Remember unfinished state **/
		chrome.alarms.create("resume",{periodInMinutes: 2});
	};
}
