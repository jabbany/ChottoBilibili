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
	if(inner!=null)
		elem.appendChild(inner);
	return elem;
}
function _e(e){ return document.getElementById(e); }

var SC = {
	cdb:null,
	cdbReady:false,
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
		r_desc.className = "follow-record";
		var img = _("img",{src:"", className:"follow-image"});
		if(rule.img != null)
			img.src = rule.img;
		else{
			if(SC.cdb == null)
				SC.cdb = new CacheDB();
			if(rule.cache != null){
				var vidid = rule.cache[rule.cache.length - 1];
				if(!SC.cdbReady){
					SC.cdb.refresh(function(){
						var video = SC.cdb.get(vidid);
						img.src = video != null ? video.pic : "";
						SC.cdbReady = true;
					});
				}else{
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
					className:"bar bar-watchlist bar-success", 
					style:{
						width:(rule.current * 100 / rule.total) + "%"
					}},
				document.createTextNode(rule.current + "/" + rule.total)));
		try{
			var genFunction = function (vid){
				return function(){
					if(SC.cdbReady){
						var vidData = SC.cdb.get(vid);
						if(vidData != null){
							img.src = vidData.pic;
						}
					}
				};
			}
			for(var i = 0; i < rule.cache.length; i++){
				var b = _("div",{
						className:"bar bar-watchlist" + (i == rule.cache.length - 1 ? "" : " bar-warning"), 
						style:{width:(100 / rule.total) + "%"}
						},document.createTextNode(rule.current + i + 1));
				b.addEventListener("mouseover",genFunction(rule.cache[i]));
				progress.appendChild(b);
			}
		}catch(e){console.log("Cache Error");}
		r_desc.appendChild(info);
		console.log(rule);
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
								val.selected = is_true(opt,"true",null);
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
						else
							v.checked = is_true(arr[x].def,"true",null);
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
				if(!SC.cdbReady){
					if(SC.cdb == null)
						SC.cdb = new CacheDB();
					SC.cdb.refresh(function(){
						var pq = new PQueue();
						SC.cdb.reduce(function(record, base){
							pq.insertWithPriority(record.pic, parseInt(record.aid));
							if(pq.size() > 30){
								pq.poll();
							}
						}, null);
						var l = [];
						while(pq.size() > 0){
							l.push(pq.poll());
						}
						for(var j, x, i = l.length; i; j = parseInt(Math.random() * i), x = l[--i], l[i] = l[j], l[j] = x);
						for(var i = 0; i < l.length; i++){
							hdr.insertBefore(_("img",{"className":"pull-right","src":l[i]}), 
								hdr.childNodes[0]);
						}
						SC.cdbReady = true;
					});
				}else{
					var pq = new PQueue();
					SC.cdb.reduce(function(record, base){
						pq.insertWithPriority(record.pic, parseInt(record.aid));
						if(pq.size() > 30){
							pq.poll();
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
				{key:"ApiKey",elem:"sApiKey",def:""},
				{key:"CheckInterval",elem:"sRefreshRate",def:60},
				{key:"SyncInterval",elem:"sSyncInterval",def:60},
			]);
			return true;
		},
		"fSettingsSite":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("SettingsSite");
			SC.func.hideAllBut("SettingsSite");
			return true;
		},
		"fSettingsSync":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("SettingsSync");
			SC.func.hideAllBut("SettingsSync");
			$("#sSyncServer").typeahead({
				source:["sync.railgun.in","api.mymoe.com/sync/chottobilibili","tools.kanoha.org/dev/sync"]
			});
			return true;
		},
		"fFollowBangumi":function(){
			if(!SC.func.checkCanMove())
				return false;
			SC.func.setNewForm("FollowBangumi");
			SC.func.hideAllBut("FollowBangumi");
			var tbl = $("#flBangumiTbl")[0];
			if(tbl != null && tbl.rows.length > 1){
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
