/** Base Toolkit **/
var $ = function(e){ 
	if(e == null) return document; 
	return document.getElementById(e);
};
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
function _t(text){
	return document.createTextNode(text);
}
function clearElem(e){
	while(e.children.length > 0)
		e.removeChild(e.children[0]);
	e.innerText = "";
}
/** End Base Toolkit **/
var bgml = new BangumiList("plugin",null);
var tp = new TransientPrayer();
var cachedb = new CacheDB();

var MenuItem = new function(){
	var menuitems = {
		follow:function(){},
		wish:function(){},
		news:function(){}
	};
	var select = function(e){};
	this.bindSelect = function(func){
		select = func;
	};
	this.onSelect = function(elem){
		if(typeof select == "function")
			select(elem);
	};
	this.bindMenu = function(id,func){
		menuitems[id] = func;
	};
	this.hookItems = function(){
		for(var x in menuitems){
			if($(x)!=null){
				var me = this;
				$(x).addEventListener("click",function(){
					me.setSelected(this.id);
					
				});
			}
		}
	};
	this.setSelected = function(elem){
		for(var m in menuitems){
			if(m != elem && $(m) != null){
				$(m).className = "";
			}else if(m == elem && $(m) != null){
				$(m).className = "selected";
			}
		}
		try{
			menuitems[elem]();
		}catch(e){console.log("MenuData Error");}
		this.onSelect(elem);
	};
};
function genFunc (vid, rid){
	return function(){
		var obj = this;
		chrome.tabs.create({
			url:"http://www.bilibili.tv/video/" + vid + "/",
			active:false
		});
		chrome.extension.sendMessage({
			"method":"updateProgress",
			"avid":vid,
			"id":((typeof rid == "number")? rid : null)
		},function(resp){
			if(resp.status == 200){
				obj.className = "bar bar-warning";
			}
		});
	};
}

function genFuncDesc (vid, desc, img){
	return function(){
		try{
			var v = cachedb.get(vid);
			desc.innerHTML = "";
			desc.appendChild(_t(v.description));
			desc.appendChild(_t(" "));
			desc.style.display="";
			var nseen = _("a",{"href":"#"},_t(chrome.i18n.getMessage("popup_tag_seen")));
			var nwatch = _("a",{"href":"#"},_t(chrome.i18n.getMessage("popup_tag_watched")));
			
			
			desc.appendChild(nseen);
			desc.appendChild(_t(" "));
			desc.appendChild(nwatch);
			if(v.pic != null)
				img.src = v.pic;
		}catch(e){}
	};
}

function loadRule(c, rule){
	var container = _("div",{className:"selectable opt"},null);
	var pvimg = _("img",{src:"",className:"preview"},null);
	if(rule.cover != null){
		pvimg.src = rule.cover;
	}else{
		var cdb = new CacheDB();
		var vidid = rule.videos[rule.videos.length - 1];
		if(vidid != null && vidid.substring(0,1) == "-")
			vidid = vidid.substring(1);
		cdb.refresh(function(){
			var video = cdb.get(vidid);
			pvimg.src = video != null ? video.pic : "";
		});
	}
	container.appendChild(pvimg);
	container.appendChild(_t(rule.title + " (" + rule.current + "/" + rule.total + ")"));
	var desc = _("div",{
		"className":"desc-tag",
		"style":{"display":"none"}
	},_t("" + rule.desc));
	var bar = _("div",{"className":"progress"},null);
	for(var i = 0; i < rule.videos.length; i++){
		var otherName = "";
		if(rule.total - rule.current - rule.videos.length > 3) 
			var smartDisplay = 1 / (rule.videos.length);
		else
			var smartDisplay = 1 / (rule.total - rule.current);
		if(rule.current + i + 1 == rule.total){
			//This is the end
			otherName = " bar-warning";
		}
		if(rule.videos[i] == null){
			var track = _("div",{
				"className":"bar bar-danger",
				"title":"Error",
				"style":{"width":((smartDisplay) * 100) + "%"}},
			_t(rule.current + i + 1));
			bar.appendChild(track);
			continue;
		}else{
			if(rule.videos[i].substring(0,1) == "-")
				otherName += " bar-success";
		}
		var vid = rule.videos[i].substring(0,1) == "-" ? rule.videos[i].substring(1) : rule.videos[i];
		var track = _("div",{
			"id":"bar-r" + rule.id + "-v" + (rule.current + i + 1),
			"className":"bar" + otherName,
			"title":cachedb.get(vid).title,
			"style":{"width":((smartDisplay) * 100) + "%"}},
		_t(rule.current + i + 1));
		
		bar.appendChild(track);
		
		track.addEventListener("dblclick",genFunc(vid, rule.id));
		track.addEventListener("click",genFuncDesc(vid, desc, pvimg));
	}
	container.appendChild(bar);
	container.appendChild(desc);
	container.appendChild(_("div",{className:"clear"},null));
	c.appendChild(container);
};

window.addEventListener('load',function(){
	MenuItem.bindSelect(function(elem){
		tp.set("popup.menuitem",elem);
	});
	MenuItem.bindMenu("follow",function(){
		clearElem($("output"));
		var bgms = bgml.getAllCached("object");
		for(var i = 0; i < bgms.length; i++){
			loadRule($("output"), bgms[i]);
		}
	});
	MenuItem.bindMenu("news",function(){
		clearElem($("output"));
	});
	MenuItem.bindMenu("wish",function(){
		clearElem($("output"));
		$("output").innerText = "WishList -Preload";
	});
	MenuItem.hookItems();
	MenuItem.setSelected(tp.get("popup.menuitem","follow"));
});
