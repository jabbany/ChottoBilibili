var SC = {
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
		{name:"FollowTag",fname:"null"},
		{name:"FollowUser",fname:"null"},
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
	func:{
		"null":function(){return true;},
		"settingsInit":function(arr){
			for(var x in arr){
				var opt = get_option(arr[x].key);
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
			for(var i = 0; i< SC.menu.length;i++){
				if(SC.menu[i].name == form){
					$('#view' + form).css('display','');
				}else{
					$('#view' + SC.menu[i].name).css("display","none");
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
					$("#flBangumiTbl")[0].deleteRow(1);
				}
				//Load data unto the table
			}
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
	//Hook all the interfaces
	for(var i=0;i<SC.menu.length; i++){
		var lf = SC.menu[i].fname;
		var ln = SC.menu[i].name;
		$("#menu" + ln).click(SC.menuHook(ln,lf));
		//Hook All Buttons
		$("button").click(function(){
			return false;
		});
	}
	var keys = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38];
	$(document).keydown(function(e){
		if(e.keyCode == keys[keys.length - 1]){
			keys.pop();
		}else{
			keys = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38]; //Reset
		}
		if(keys.length == 0){
			if(prompt("进入管理后台，请输入密码：") == "hiddenhand"){
				document.location.href = "console.html";
			}else{
				keys = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38];
			}
		}
	});
});

$