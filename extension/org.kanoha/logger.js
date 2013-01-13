function Logger(len){
	var log = [];
	var maxLength = len;
	var save = function(){
		localStorage['debuglog'] = JSON.stringify(log);
	};
	this.log = function(data){
		if(maxLength < 1) return;
		if(log.length < maxLength)
			log.push(data);
		else{
			log.shift();
			log.push(data);
		}
		save();
	};
	this.createAdapter = function(){
		var self = this;
		return function(data){
			self.log(data);
		};
	};
	this.clear = function(){
		this.log = [];
		save();
	};
}