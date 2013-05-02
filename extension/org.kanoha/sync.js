function SyncList(){
	this.add = function(action, ident, data){
		try{
			var l = JSON.parse(localStorage["synclist"]);
		}catch(e){
			var l = [];
		}
		l.push("A:" + action + "|I:" + ident + "|D:" + data);
		localStorage["synclist"] = JSON.stringify(l);
	}
	
	this.getAll = function(){
		try{
			return JSON.parse(localStorage["synclist"]);
		}catch(e){
			return [];
		}
	}
}
