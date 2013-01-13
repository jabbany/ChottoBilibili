function OpenACGSync(host){
	var remote = host;
	var client_string = "JSOACGSync Connector Generic - v0.8";
	var client_protocol_version = 1;
	var generateSalt = function(){
		return Math.round(Math.random() * 65536);
	};
	var generateTimestamp = function(){
		var d = new Date();
		var ts = "";
		ts += d.getFullYear() + "-" + ((d.getMonth() + 1) > 9 ? d.getMonth() + 1 : ("0" + (d.getMonth() + 1)));
		ts += "-" + (d.getDate() > 9 ? d.getDate() : ("0" + d.getDate())) + " ";
		ts += (d.getHours() > 9 ? d.getHours() : ("0" + d.getHours())) + ":";
		ts += (d.getMinutes() > 9 ? d.getMinutes() : ("0" + d.getMinutes())) + ":";
		ts += (d.getSeconds() > 9 ? d.getSeconds() : ("0" + d.getSeconds())) + " ";
		ts += "GMT" + (d.getTimezoneOffset() > 0 ? ("+" + (d.getTimezoneOffset() / 60)) : (d.getTimezoneOffset() / 60));
		return ts;
	};
	var createSessionToken = function(authkey, salt){
		
	};
	this.createRequest = function(type, param){
		var request = {
			method: type,
			data: param,
			head: ["Time: " + generateTimestamp(),
				"Client: " + client_string,
				"Protocol: " + client_protocol_version]
		};
		return request;
	};
	this.insertHeader = function(request, headerName, headerValue){
		request.head.push(headerName + ": " + headerValue);
	};
	this.authRequest = function(request, uid, authkey){
		request.auth = {};
		request.auth.uiid = uid;
		request.auth.session = createSessionToken(authkey, generateSalt());
	}
}