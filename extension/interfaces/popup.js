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
		//try{
			menuitems[elem]();
		//}catch(e){console.log("MenuData Error");}
		this.onSelect(elem);
	};
};

function loadRule(c, rule){
	var container = _("div",{className:"selectable opt"},null);
	var pvimg = _("img",{src:"",className:"preview"},null);
	if(rule.cover != null){
		pvimg.src = rule.cover;
	}else{
		var cdb = new CacheDB();
		var vidid = rule.videos[rule.videos.length - 1];
		cdb.refresh(function(){
			var video = cdb.get(vidid);
			pvimg.src = video != null ? video.pic : "";
		});
	}
	container.appendChild(pvimg);
	container.appendChild(_t(rule.title + " (" + rule.current + "/" + rule.total + ")"));
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