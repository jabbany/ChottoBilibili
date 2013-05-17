function _(type,init,inner){
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
function maxLength (text, len){
	if(text.length <= len)
		return text;
	else 
		return text.substring(0, len-3) + "...";
}
function _e(e){ return document.getElementById(e); }
function _t(t) { return document.createTextNode(t); }
function is_true(bool, t ,f){return bool ? t : f;}
var SC = {
	cdb:new CacheDB(),
	bgmlist:null,
	opt:new SettingsConnector(),
	states:{
		"formEdited":false,
		"currentForm":"SettingsHome"
	},
	menu:[
		{name:"SettingsHome",fname:"fSettingsHome"},
		{name:"SettingsConnection",fname:"fSettingsConnection"},
		{name:"SettingsSite",fname:"fSettingsSite"},
		{name:"SettingsSync",fname:"fSettingsSync"},
		{name:"FollowBangumi",fname:"fFollowBangumi"},
		{name:"FollowUser",fname:"fFollowUser"},
		{name:"ServiceConnect",fname:"fServiceConnect"},
		{name:"ServiceDonate",fname:"fServiceDonate"},
	],
	menuHook:function(m,r){
		return function(){
			if(SC.func[r]()){
				for(var k = 0;k<SC.menu.length;k++){
					if(SC.menu[k].name != m){
						$("#menu" + SC.menu[k].name).parent().removeClass("active");
					}else{
						$("#menu" + m).parent().addClass('active');
					}
				}
			}
			return false;
		};
	},
	insertRow:function(table, id, rule, sid){
		var row = table.insertRow(id);
		var r_id = row.insertCell(0);
		var r_desc = row.insertCell(1);
		var r_expr = row.insertCell(2);
		var r_actions = row.insertCell(3);
		row.className = "";
		r_id.appendChild(document.createTextNode(rule.id != null ? rule.id : "0"));
		if(rule["__disabled"]){
			var icon = _("i",{
				"className":"icon-exclamation-sign",
				"title":chrome.i18n.getMessage("bangumi_disabled"),
				"data-toggle":"tooltip"
			},null);
			r_id.appendChild(icon);
			icon.addEventListener("mouseover",function(){
				$(this).tooltip({"placement":"bottom"});
				$(this).tooltip("toggle");
			});
			icon.addEventListener("dblclick", function(){
				delete rule["__disabled"];
				$(this).hide();
				SC.states.formEdited = true;
			});
		}
		r_desc.className = "follow-record";
		var img = _("img",{src:"", className:"follow-image"}, null);
		if(rule.img != null)
			img.src = rule.img;
		else{
			if(SC.cdb == null)
				SC.cdb = new CacheDB();
			if(rule.cache != null){
				if(rule.cache.length == 0){
					var prev = SC.cdb.get("img:" + rule.id);
					img.src = prev == null ? "/assets/img/noexist.png" : prev;
				}else{
					var vidid = rule.cache[rule.cache.length - 1];
					try{
						var video = SC.cdb.get(vidid);
						img.src = video != null ? video.pic : "";
					}catch(e){
						console.log("[Err] Image URL not in DB");
					};
				}
			}
		}
		r_desc.appendChild(img);
		r_desc.appendChild(_("div",{className:"follow-image-shadow"},_("div")));
		var info = _("div",{className:"follow-info"},null);
		var title = _("p",{className:"title"},
				_("span",{className:"label label-info"},
						document.createTextNode(SC.bgmlist.lookupSectionName(sid))));
		title.appendChild(document.createTextNode(" " + rule.name + " "));
		info.appendChild(title);
		if(rule.desc != null){
			var mt = /^\[(.+)\]/.exec(rule.desc);
			if(mt != null)
				title.appendChild(_("small",{}, document.createTextNode("(" + mt[1] + ")")));
			info.appendChild(_("p",{className:"descr"},
				document.createTextNode(rule.desc.replace(new RegExp("^\\[(.+)\\]"),""))));
		}
		var progress = _("div",{className:"progress min-margin"});
		info.appendChild(progress);
		progress.appendChild(_("div",{
					"className":"bar bar-watchlist bar-success", 
					"style":{
						width:(rule.total <= 25 ? (rule.current * 100 / rule.total) : 40) + "%"
					},
					"title":rule.current + "/" + rule.total
					},
				document.createTextNode(rule.current + "/" + rule.total)));
		try{
			var genFunction = function (vid){
				if(vid != null)
					vid = vid.substring(0,1) == "-" ? vid.substring(1) : vid;
				return function(){
					$(this).tooltip("toggle");
					if(vid == null)
						return;
					var vidData = SC.cdb.get(vid);
					if(vidData != null){
						img.src = vidData.pic;
					}
				};
			}
			var genClickFunction = function (vid){
				var videoId = vid.substring(0,1) == "-" ? vid.substring(1) : vid;
				return function(){
					var obj = this;
					chrome.tabs.create({
						url:"http://www.bilibili.tv/video/" + videoId + "/",
						active:false
					});
					//Also mark this as saved, send a message to main extension
					chrome.extension.sendMessage({
						"method":"updateProgress",
						"avid":videoId
					},function(resp){
						if(resp.status == 200){
							obj.className = "bar bar-watchlist bar-success";
						}
					});
				}
			};
			for(var i = 0; i < rule.cache.length; i++){
				var vdata = rule.cache[i] != null ? SC.cdb.get(rule.cache[i]) : null;
				var displayText = true;
				if(rule.total > 25 && rule.total - rule.current > 15)
					displayText = false;
				var appStyle = "";
				if(rule.cache[i] == null){
					appStyle = " bar-danger";
				}else if(rule.cache[i] != null && rule.cache[i].substring(0,1) == "-"){
					appStyle = " bar-success";
				}else if(i != rule.cache.length - 1)
					appStyle = " bar-warning";
				var b = _("div",{
							"title":(vdata != null ? vdata.title : (rule.cache[i] != null ? rule.cache[i] : "Error")),
							"data-toggle":"tooltip",
							"className":"bar bar-watchlist" + appStyle, 
							"style":{width:(rule.total > 25 ? 60 / (rule.total - rule.current):(100 / rule.total)) + "%"}
						},displayText ? document.createTextNode(rule.current + i + 1) : null);
				if(rule.cache[i] != null){
					b.addEventListener("mouseover",genFunction(rule.cache[i]));
					b.addEventListener("click",genClickFunction(rule.cache[i]));
				}else{
					b.addEventListener("mouseover",genFunction(null));
				}
				progress.appendChild(b);
			}
		}catch(e){console.log("Cache Error");}
		r_desc.appendChild(info);
		
		// Add regex
		var regx = _("p",{},document.createTextNode("匹配式："));
		var rexcl = _("p",{},document.createTextNode("排除式："));
		r_expr.appendChild(regx);
		r_expr.appendChild(rexcl);
		regx.appendChild(_("code",{},document.createTextNode(
			maxLength(rule.matcher.m == null ? rule.matcher : rule.matcher.m, 12))));
		rexcl.appendChild(_("code",{},document.createTextNode(
			maxLength(rule.matcher.e == null ? "" : rule.matcher.e, 12))));
		if(rule.type == 2){
			var housou = _("p",{},document.createTextNode("周期："));
			housou.appendChild(_("code",{},_t(rule.interval == null ? "0" : ("" + (rule.interval / (3600 * 24))) )));
			r_expr.appendChild(housou);
		}
		
		// Add buttons
		var btngrp = _("div",{className:"btn-group"}, null);
		var edit = _("a",{className:"btn btn-small"},document.createTextNode(
			chrome.i18n.getMessage("general_edit")));
		var del = _("a",{className:"btn btn-danger btn-small"},document.createTextNode(
			chrome.i18n.getMessage("general_delete")));
		
		edit.addEventListener("click",function(){
			SC.states.formEdited = true;
			$("#editDlg").modal("toggle");
		});
		del.addEventListener("click",function(){
			if(rule.id != null && typeof rule.id == "number"){
				SC.states.formEdited = true;
				SC.bgmlist.remove(rule.id);
			}else{
				//Give this rule a temporary id
				var alloc = 4000;
				while(SC.bgmlist.query(alloc) != null) alloc++;
				rule.id = alloc;
				SC.bgmlist.remove(rule.id);
				SC.states.formEdited = true;
			}
			table.deleteRow(row.rowIndex);
		});
		
		
		btngrp.appendChild(edit);
		btngrp.appendChild(del);
		
		r_actions.appendChild(btngrp);
	},
	func:{
		"null":function(){return true;},
		"settingsInit":function(arr){
			for(var x in arr){
				var opt = SC.opt.get(arr[x].key);
				if(typeof opt != "undefined" && opt != null)
					$("#" + arr[x].elem).each(function(index,val){
						switch(val.type){
							case "text":{
								val.value = opt;
							}break;
							case "radiobox":
							case "checkbox":{
								val.checked = opt ? "true" : null;
								if(opt)
									val.setAttribute("checked", "true");
								else
									val.removeAttribute("checked");
							}break;
						}
						var handler = function(){
							if(this.type =="text" && this.value != opt){
								SC.states.formEdited = true;
							}else if(this.type !="text" && this.checked != opt){
								SC.states.formEdited = true;
							}
						};
						val.addEventListener('click',handler);
						val.addEventListener('change',handler);
						val.addEventListener('keydown',handler);
					});
				else{
					$("#" + arr[x].elem).each(function(i,v){
						if(v.type == "text")
							v.value = arr[x].def;
						else{
							v.checked = arr[x].def ? "true" : null;
							if(arr[x].def)
								v.setAttribute("checked","true");
							else
								v.removeAttribute("checked");
						}
						var opt = arr[x].def;
						var handler = function(){
							if(this.type =="text" && this.value != opt){
								SC.states.formEdited = true;
							}else if(this.type != "text" && this.checked != opt){
								SC.states.formEdited = true;
							}
						};
						v.addEventListener('click',handler);
						v.addEventListener('change',handler);
						v.addEventListener('keydown',handler);
					});
				}
			}
		},
		"checkCanMove":function(){
			if(SC.states.formEdited == true){
				//Raise a Modal Dialog Prompt
				SC.states.formEdited = !confirm("是否放弃现在的更改？");
				if(SC.states.formEdited)
					return false;
				SC.bgmlist.refresh(); //Reload the BGMlist
				SC.opt.reload(); //Reload the settings
				return true;
			}
			return true;
		},
		"hideAllBut":function(form){
			var animate = SC.opt.get("interface.animate");
			if(animate){
				for(var i = 0; i< SC.menu.length;i++){
					if(SC.menu[i].name != form){
						$('#view' + SC.menu[i].name).hide();
					}
				}
				$('#view' + form).show(400);
			}else{
				for(var i = 0; i< SC.menu.length;i++){
					if(SC.menu[i].name == form){
						$('#view' + form).css('display','');
					}else{
						//$('#view' + SC.menu[i].name).hide(400);
						$('#view' + SC.menu[i].name).css("display","none");
					}
				}
			}
		},
		"setNewForm":function(f){
			if(f != null && f != ""){
				SC.states.currentForm = f;
			}else
				SC.states.currentForm = "notLoaded";
		},
		"fSettingsHome":function(){
			if(!SC.func.checkCanMove())
				return false;
			var hdr = _e("homeHdr");
			if(hdr != null){
				var pq = new PQueue();
				SC.cdb.reduce(function(record, base){
					if(record.pic != null){
						if(record.aid == null)
							record.aid = 0;
						pq.insertWithPriority(record.pic, parseInt(record.aid));
						if(pq.size() > 30){
							pq.poll();
						}
					}
				}, null);
				var l = [];
				while(pq.size() > 0){
					l.push(pq.poll());
				}
				while(hdr.childNodes.length > 0){
					hdr.removeChild(hdr.childNodes[0]);
				}
				for(var j, x, i = l.length; i; j = parseInt(Math.random() * i), x = l[--i], l[i] = l[j], l[j] = x);
				for(var i = 0; i < l.length; i++){
					hdr.insertBefore(_("img",{"className":"pull-right","src":l[i]}), 
						hdr.childNodes[0]);
				}
			}
			SC.func.setNewForm("SettingsHome");
			SC.func.hideAllBut("SettingsHome");
			return true;
		},
		"fSettingsConnection":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("SettingsConnection");
			SC.func.hideAllBut("SettingsConnection");
			SC.func.settingsInit([
				{key:"api.key",elem:"sApiKey",def:""},
				{key:"timers.refresh",elem:"sRefreshRate",def:60},
				{key:"timers.sync",elem:"sSyncInterval",def:60},
			]);
			return true;
		},
		"fSettingsSite":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("SettingsSite");
			SC.func.hideAllBut("SettingsSite");
			SC.func.settingsInit([
				{key:"watchlist.autoupdate.enabled",elem:"sProgressUpdateEnable",def:false},
				{key:"watchlist.autoupdate.delay",elem:"sProgressUpdateDelay",def:5},
				{key:"watchlist.hideRaws.series",elem:"sNoRaws",def:false},
				{key:"watchlist.hideRaws.tags",elem:"sNoRawsTag",def:false},
				{key:"interface.player.nolicense",elem:"sFixPlayer",def:true},
				{key:"interface.player.html5",elem:"sHTML5",def:false},
				{key:"privacy.history.allow",elem:"sAllowTracking",def:false},
				{key:"interface.pnToggle",elem:"sPrevNextToggle",def:true},
				{key:"interface.contextMenu.enabled",elem:"sClickSearchEnabled",def:true}
			]);
			return true;
		},
		"fSettingsSync":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("SettingsSync");
			SC.func.hideAllBut("SettingsSync");
			SC.func.settingsInit([
				{key:"sync.enabled",elem:"sSyncEnabled",def:false},
				{key:"sync.server",elem:"sSyncServer",def:""},
				{key:"sync.key",elem:"sSyncKey",def:""},
				{key:"sync.deviceId",elem:"sSyncDevice",def:""},
			]);
			$("#sSyncServer").typeahead({
				source:["sync.railgun.in","api.maimoe.net/sync/chottobilibili","tools.kanoha.org/dev/sync"]
			});
			return true;
		},
		"fFollowBangumi":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("FollowBangumi");
			SC.func.hideAllBut("FollowBangumi");
			var tbl = $("#flBangumiTbl")[0];
			if(tbl != null){
				while(tbl.rows.length > 1){
					tbl.deleteRow(1);
				}
				if(SC.bgmlist == null)
					SC.bgmlist = new BangumiList();
				var sections = SC.bgmlist.getSections();
				var index = 1;
				for(var i = 0; i < sections.length; i++){
					var rules = SC.bgmlist.getRulesBySection(sections[i], true);
					for(var j = 0; j < rules.length; j++){
						SC.insertRow(tbl, index++, rules[j], sections[i]);
					}
				}
			}
			return true;
		},
		"fFollowUser":function() {
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("FollowUser");
			SC.func.hideAllBut("FollowUser");
			return true;
		},
		"fServiceConnect":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("ServiceConnect");
			SC.func.hideAllBut("ServiceConnect");
			//Load the table
			var tbl = _e("pluginTbl");
			if(tbl != null){
				while(tbl.rows.length > 1){
					tbl.deleteRow(1);
				}
				//Add everything back in
				if(Plugins != null)
					var plug = Plugins.getAll();
				else
					var plug = [];
				for(var i = 0; i < plug.length; i++){
					var row = tbl.insertRow(i+1);
					var r_name = row.insertCell(0);
					var r_ver = row.insertCell(1);
					var r_key = row.insertCell(2);
					var r_priv = row.insertCell(3);
					var r_action = row.insertCell(4);
					r_name.appendChild(_t(plug[i].name));
					r_ver.appendChild(_t(plug[i].version));
					r_key.appendChild(_t(plug[i].id));
					console.log(plug[i]);
					for(var j = 0; j < plug[i].permissions.length; j++)
						r_priv.appendChild(_t("+" + plug[i].permissions[j] + "\u00a0"));
					r_action.appendChild(_t(chrome.i18n.getMessage("general_delete")));
				}
			}
			return true;
		},
		"fServiceDonate":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("ServiceDonate");
			SC.func.hideAllBut("ServiceDonate");
			return true;
		}
	}
};
$(document).ready(function(){
	//Hook All Buttons
	$("button").click(function(){
			return false;
	});
	//Hook all the interfaces
	for(var i=0;i<SC.menu.length; i++){
		var lf = SC.menu[i].fname;
		var ln = SC.menu[i].name;
		$("#menu" + ln).click(SC.menuHook(ln,lf));
	}
	$("#btnEnterBangumi").click(function(){
		SC.menuHook("FollowBangumi","fFollowBangumi");
	});
	var aboutMode = 0;
	$("#home-nav").click(function(){
		if(aboutMode == 1){
			$("#about-page").hide(400,function(){
				$("#home-page").show(400,function(){
					aboutMode = 0;
				});
			});
			$("#home-nav").parent().toggleClass("active");
			$("#about-nav").parent().toggleClass("active");
			aboutMode = -1;
		}
	});
	$("#about-nav").click(function(){
		if(aboutMode == 0){
			$("#home-page").hide(400,function(){
				$("#about-page").show(400,function(){
					aboutMode = 1;
				});
			});
			$("#home-nav").parent().toggleClass("active");
			$("#about-nav").parent().toggleClass("active");
			aboutMode = -1;
		}
	});
	$("#btnSaveFollow").click(function(){
		if(SC.states.currentForm == "FollowBangumi"){
			if(SC.bgmlist != null)
				SC.bgmlist.commit();
			SC.states.formEdited = false;
			alert(chrome.i18n.getMessage("general_save_success"));
		}
	});
	
	$("#editHide").click(function(){
		$("#editDlg").modal('hide');
	});
	
	$("#editCancel").click(function(){
		$("#editDlg").modal('hide');
	});
	
	$("#editSave").click(function(){
		$("#editDlg").modal('hide');
	});
	
	try{
		SC.func.fSettingsHome();
	}catch(e){
		console.log("Unloaded Default loader");
	}
	var keys = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38];
	$(document).keydown(function(e){
		if(e.keyCode == keys[keys.length - 1]){
			keys.pop();
		}else{
			keys = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38]; //Reset
		}
		if(keys.length == 0){
			if(prompt(chrome.i18n.getMessage("dialog_enter_console")) == "hiddenhand"){
				document.location.href = "console.html";
			}else{
				keys = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38];
			}
		}
		//Also take care of keyboard navigated pageswitching
		if(e.keyCode == 40){
			for(var i = 0; i < SC.menu.length; i++){
				if(SC.menu[i].name == SC.states.currentForm){
					if(i+1 < SC.menu.length && !SC.states.formEdited){
						$("#menu" + SC.menu[i+1].name).trigger("click");
						break;
					}
				}
			}
		}else if (e.keyCode == 38){
			for(var i = 0; i < SC.menu.length; i++){
				if(SC.menu[i].name == SC.states.currentForm ){
					if(i-1 >= 0  && !SC.states.formEdited){
						$("#menu" + SC.menu[i-1].name).trigger("click");
						break;
					}
				}
			}
		}
	});
});

$
