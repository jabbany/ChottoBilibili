function TransientPrayer(){
	var tp = {};
	var save = function(){
		localStorage["transient"] = JSON.stringify(tp);
	};
	try{
		tp = JSON.parse(localStorage["transient"]);
	}catch(e){
		save();
	}
	this.set = function(key,val){
		tp[key] = val;
		save();
	};
	this.get = function(key,expected){
		return tp[key] == null ? expected : tp[key];
	};
	this.reset = function(){
		/** Forces a cleanup of the transients **/
		localStorage["transient"] = "{}";
	};
	this.toString = function(){
		return JSON.stringify(tp);
	}
}