function TransientPrayer(){
	var trans = {};
	this.save = function(){
		localStorage["transient"] = JSON.stringify(trans);
	};
	try{
		trans = JSON.parse(localStorage["transient"]);
	}catch(e){
		this.save();
	}
	this.set = function(key,val){
		trans[key] = val;
		this.save();
	};
	this.get = function(key,expected){
		return trans[key] == null ? expected : trans[key];
	};
	this.reset = function(){
		/** Forces a cleanup of the transients **/
		trans = {};
		localStorage["transient"] = "{}";
	};
	this.toString = function(){
		return JSON.stringify(trans);
	}
}
