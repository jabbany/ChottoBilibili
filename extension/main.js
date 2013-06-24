var Main = new function () {
	this.list = new BangumiList("plugin",new CommitCallback());
	this.settings = new SettingsConnector();
	this.updateBadge = function(){
		this.list.refresh();
		var num = this.list.countUnwatched();
		if(num > 0){
			chrome.browserAction.setBadgeText({text:"" + num});
		}else{
			chrome.browserAction.setBadgeText({text:""});
		}
	};
	this.startCheck = function (){
		Main.settings.reload();
		Main.list.refresh();
		var maxIterations = Main.settings.get("watchlist.disableCutoff");
		if(maxIterations == null)
			maxIterations = 60;
		if(Main.settings.get("logs.logNext")){
			var logger = new Logger(4096);
			Main.settings.set("logs.logNext", false);
			if(!Main.settings.commit()){
				console.log("[War]UnsetLog:Failed");
				logger.log("[War](Logger)UnsetLog:Failed");
			}
		}
		var createSectTask = function (section){
			var worker = new SectionWorker(section, Main.list);
			if(Main.settings.get("watchlist.hideRaws.series"))
				worker.setRawsMode(true);
			if(logger!= null)
				worker.hookLogger(logger);
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
								worker.flush();
								inst.complete();
								return;
							}
							if(local.retryCount < 8){
								local.retryCount++;
								if(logger != null)
									logger.log("[War](API)Hit Limit(" + local.retryCount + ")");
								setTimeout(function(){
									jsPoll.push(task);
									inst.complete();
								},500 * Math.pow(2,local.retryCount));
								return;
							}else{
								if(logger != null)
									logger.log("[Err](API)E_LIMIT_OVER");
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
									if(logger != null)
										logger.log("[War](API)Hit Limit(" + local.retryCount + ")");
								}else{
									if(logger != null)
										logger.log("[Err](API)E_LIMIT_OVER");
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
								if((local.curpage - 1) > maxIterations){
									worker.markAsBad();
									worker.flush();
									inst.complete();
									Main.updateBadge();
									return;
								}
								if(local.retryCount > 0)
									local.retryCount--;
								setTimeout(function(){
									jsPoll.push(task);
									inst.complete();
								},500);
							}else{
								Main.updateBadge();
								worker.flush();
								inst.complete();
							}
						}else{
							/* Worker is done! */
							Main.updateBadge();
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
			task.onkill = function(){
				worker.flush();
				task.complete();
			};
			task.onsuspend = function(){
				worker.flush();
				try{
					var suspends = JSON.parse(localStorage["__suspend"]);
				}catch(e){
					var suspends = [];
				}
				suspends.push({
					"type":"sectionworker",
					"curpage":task.local.curpage,
					"rempages":task.local.rempages,
					"section":section,
					"unfinished":worker.getRemRules()
				})
				localStorage["__suspend"] = JSON.stringify(suspends);
				task.complete();
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
			xhr.open("GET","http://api.bilibili.tv/bangumi?type=json&appkey=" + Main.settings.getApiKey() +
			"&btype=2",true);
			xhr.send();
		});
		
		/** Run The jsPoll~ **/
		jsPoll.run();
	};
	this.recache = function(missingList){
		if(missingList != null){
			var caches = missingList;
		}else{
			var caches = Main.list.getAllCached();
		}
		var cacheDB = new CacheDB();
		var createTask = function (avid){
			var task = jsPoll.create(function(self){
				var inst = self;
				console.log(avid);
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function(){
					if(xhr.readyState == 4){
						try{
							var data = JSON.parse(xhr.responseText);
						}catch(e){
							console.log("[Err]Parse failed for recache of " + avid);
							inst.complete();
							return;
						}
						if(data.code != null && data.code != 0){
							console.log("[Err]" + data.code + ":" + data.error);
							if(task.local.retryCount > 5){
								inst.complete();
								return;
							}
							if(data.code == -503){
								jsPoll.push(task);
								setTimeout(function(){
									inst.complete();
								},1000 * Math.pow(2, task.local.retryCount));
								task.local.retryCount++;
							}else
								inst.complete();
							return;
						}else{
							try{
								data.aid = parseInt(avid);
							}catch(e){}
							cacheDB.write("av" + avid, data);
							cacheDB.commit();
							setTimeout(function(){
								inst.complete();
							},500);
							return;
						}
					}
				}
				xhr.open("GET","http://api.bilibili.tv/view?type=json&appkey=" + Main.settings.getApiKey() + "&id=" + avid,true);
				xhr.send();
			});
			task.local.retryCount = 0;
			jsPoll.push(task);
		}
		for(var i = 0; i < caches.length; i++){
			if(caches[i] == null)
				continue;
			createTask(caches[i].replace(/^-{0,1}av/,""));
		}
		jsPoll.run();
	};
	this.cacheClean = function(options){
		/** Cleans the cache and removes unused cache or/may fix **/
		if(options == null){
			options = {
				remove: false,
				autofix: {
					missing: false,
					broken: false
				}
			};
		}
		var missing = [];
		var broken = [];
		var unlinked = [];
		var c = Main.list.getAllCached("flat");
		var cdb = new CacheDB();
		for(var i = 0; i < c.length; i++){
			if(cdb.get(c[i]) == null){
				missing.push(c[i]);
				continue;
			}
			var cachedItem = cdb.get(c[i]);
			if(cachedItem.title == null ||
				cachedItem.pic == null){
				broken.push(c[i]);
				continue;
			}
		}
		var idx = cdb.getIndex();
		for(var j = 0; j < idx.length; j++){
			if(idx[j].indexOf("av") != 0)
				continue;
			if(c.indexOf(idx[j])<0){
				unlinked.push(idx[j]);
			}
		}
		if(options.autofix.missing){
			Main.recache(missing);
		}
		if(options.autofix.broken){
			Main.recache(broken);
		}
		return {
			"missing": missing,
			"broken": broken,
			"gc": unlinked 
		};
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
				
			}else{
				
			}
		}
		localStorage["__suspend"] = "[]";
	};
}

/** ADD INSTALL HOOK TO MANAGE CONTEXT MENUS **/
chrome.runtime.onInstalled.addListener(function() {
	if(Main == null)
		var Main = {};
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
	}
});

chrome.contextMenus.onClicked.addListener(function(clickData, tab){
	if(clickData.menuItemId != "default-menu")
		return;
	var settings = new SettingsConnector();
	var matchers = settings.get("interface.contextMenu.matchers");
	var selection = clickData.selectionText;
	if(matchers != null){
		for(var i in matchers){
			var m = (new RegExp(i)).exec(selection);
			if(m != null && m.length > 0){
				var addr = matchers[i];
				for(var i = 0; i < m.length; i++){
					addr = addr.replace("{" + i + "}", m[i]);
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

/** ADD LISTENERS FOR INCOMING REQUESTS **/
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.method == null){
		console.log("[War](Msg)Illegal Msg.Intern");
		sendResponse({});//Snub it
		return;
	}
	switch(request.method){
		case "refreshSettings":{
			if(Main.settings != null){
				Main.settings.reload();
			}else{
				Main.settings = new SettingsConnector();
			}
			sendResponse({});
			return;
		}break;
		case "addFollowDlg":{
			var trans = new TransientPrayer();
			var matchingSection = Main.settings.get("matcher.tid");
			trans.set("add.data",{
				"title":request.title,
				"section": Tools.sectionToId(matchingSection, request.section),
				"avid":request.avid
			});
			sendResponse({"accepted":true});
			return;
		}break;
		case "biliStalker":{
			if(request.url != null && /av\d+/.test(request.url)){
				var sectId = (request.section == "" ? 0 : 
								Tools.sectionToId(Main.settings.get("matcher.tid"), request.section));
				var allotZone = "";
				switch(sectId){
					case 33:
						allotZone = "bangumi";
						break;
					case 1:
					case 24:
					case 25:
					case 26:
					case 27:
						allotZone = "douga";
						break;
					case 28:
					case 29:
					case 30:
					case 31:
					case 3:
						allotZone = "music";
						break;
					case 11:
					case 15:
					case 32:
						allotZone = "collection";
						break;
					default:
						allotZone = "other";
				}
				
				Main.settings.reload();
				var curval = Main.settings.get("privacy.history." + allotZone);
				if(curval == null)
					curval = 0;
				if(typeof request.duration != "number" || request.duration < 0)
					request.duration = 0; 
				Main.settings.set("privacy.history." + allotZone, curval + request.duration);
				Main.settings.commit();
			}
			sendResponse({});
			return;
		}break;
		case "getSetting":{
			var sObj = (Main == null) ? new SettingsConnector() : Main.settings;
			var val = sObj.get(request.key);
			sendResponse({value:val});
			return;
		}break;
		case "invokeCheck":{
			if(Main.settings == null) Main.settings = new SettingsConnector();
			else Main.settings.reload(); 
			//Makes sure the settings are fresh, since this is only manually called
			Main.settings.set("logs.lastStartCheck", (new Date()).getTime());
			Main.settings.commit();
			Main.startCheck();
			sendResponse({});
			return;
		}break;
		case "invokeSync":{
			//Invoke a sync operation
			sendResponse({});
			return;
		}break;
		case "invokeRecache":{
			if( request.isConservative == true){
				//Only fix what is necessary
				Main.cacheClean({
					remove:false,
					autofix:{missing:true, broken:true}
				});
				sendResponse({});
				return;
			}else{
				Main.recache();
				sendResponse({});
			}
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
		case "updateProgress":{
			if(typeof request.id == "number"){
				Main.list.refresh();
				var rule = Main.list.query(request.id);
				if(rule != null){
					//Found
					if(request.avid === null){
						//Match & Find
					}else{
						if(rule.cache !== null){
							for(var i = 0; i < rule.cache.length; i++){
								if(rule.cache[i] == null){
									continue;
								}
								if(rule.cache[i] == request.avid){
									rule.cache[i] = "-" + rule.cache[i];
									while(rule.cache[0] != null && rule.cache[0].substring(0, 1) == "-"){
										rule.cache.splice(0,1);
										rule.current++;
									}
									Main.list.commit();
									Main.updateBadge();
									sendResponse({"status":200});
									return;
								}
							}
						}
					}
				}
				sendResponse({"status":301});
				return;
			}
			if(typeof request.section == "number"){
				//Search by section
				Main.list.refresh();//Just to be safe since we are editing
				var rules = Main.list.getRulesBySection(request.section);
				for(var i = 0; i < rules.length; i++){
					if(request.avid != null && 
						rules[i].cache != null && 
						rules[i].cache.indexOf(request.avid) >= 0){
						//Found! Heh!
						var index = rules[i].cache.indexOf(request.avid);
						if(index != 0){
							if(rules[i].cache[index].substring(0,1) == "-"){
								sendResponse({"status":304}); // Unchanged
								return;
							}
							rules[i].cache[index] = "-" + rules[i].cache[index];
							Main.list.commit();//Save data
							sendResponse({"status":304}); // Unchanged
							return;
						}else{
							//Delete from the cache and progress the rule's curr
							while(rules[i].cache[0].substring(0,1) == "-"){
								rules[i].cache.splice(0,1);
								rules[i].current++;
							}
							sendResponse({"status":200});
							return;
						}
					}else if(request.avid == null){
						//No avid to work with, damn
						//We must then match with the rule to find progress
						var titl = request.title;
						var matcher = rules[i].matcher;
						if(matcher == null)
							continue; //Eh
						if(typeof matcher == "string"){
							
						}else if(typeof matcher == "object"){
							//Find and match
						}
					}
				}
			}else if(request.avid != null){
				//Check avid
				sendResponse({"status":200});
				return;
			}
			sendResponse({"status":404});
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
			return;
		}break;
	}
	sendResponse({});/* Snub them */
});

/** Allow other extensions to connect **/
chrome.extension.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		var blacklist = Main.settings.get('plugins.blocked');
		if (blacklist != null && blacklist.indexOf(sender.id) >= 0)
			return;
		if(request.method == null)
			sendResponse({"error":"Method not provided"});
		switch(request.method){
			case "prompt-install":{
				var status = Plugins.install({
					"id" : sender.id,
					"name" : request.name,
					"key" : request.key,
					"permissions" : request.permissions,
					"version" : request.version
				});
				sendResponse({
					"installed": status.success,
					"code": status.id
				});
			}return;
			case "has-permission":{
				if(Plugins.exists(sender.id)){
					sendResponse({
						code:200,
						has:Plugins.checkPerm(sender.id, request["permission"])
					});
					return;
				}
				sendResponse({code:200,has:false});
			}return;
			default:{
				if(!Plugins.exists(sender.id)){
					sendResponse({
						"code":401,
						"error":"Not Authorized"
					});
					return;
				}else{
					sendResponse({
						"code":200,
						"message":"No-Operation."
					});
				}
			}
		}
	});

/** Create the timers or alarms **/
if(!chrome.runtime){
	/* Include support for legacy chrome */
	var duration = Main.settings.get('timers.refresh');
	duration = (duration == null ? 15 : duration);
	setInterval(function(){
		Main.startCheck();
	},duration * 60000); 
}else{
	Main.updateBadge();
	chrome.alarms.get("refresh", function(alarm){
		if(typeof alarm == "undefined"){ 
			var delay = Main.settings.get("timers.refresh");
			delay = (delay == null ? 15 : delay);
			chrome.alarms.create('refresh',{periodInMinutes: delay});
		}
	});
	chrome.alarms.onAlarm.addListener(function(a){
		if(a.name == "refresh"){
			Main.settings.set("logs.lastStartCheck", (new Date()).getTime());
			if(!Main.settings.commit()){
				console.log("[Err]TimeLog Concurrency");
				Main.settings.reload();
				Main.settings.set("logs.lastStartCheck", (new Date()).getTime());
				Main.settings.commit();
			}
			Main.startCheck();
		}else if(a.name == "resume"){
			chrome.alarms.clear("resume");
			Main.resumeHold();
		}else if(a.name == "sync"){
			if(!Main.settings.get("sync.enabled"))
				return;
			Main.settings.set("logs.lastSyncInit", (new Date()).getTime());
			Main.settings.commit();
		}
	});
	chrome.runtime.onSuspend = function(){
		/** Remember unfinished state **/
		Main.settings.set("logs.lastSuspSig", (new Date()).getTime());
		Main.settings.commit();
		chrome.alarms.create("resume",{delayInMinutes: 2});
		jsPoll.suspendall();
	};
}
