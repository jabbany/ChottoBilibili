function get_option(settingName){
	if(localStorage['ext_options'] == null){
		localStorage['ext_options'] = "{}";
	}
	var settings = JSON.parse(localStorage['ext_options']);
	if(settingName != null){
		return settings[settingName];
	}else{
		return settings;
	}
}

function set_option(settingName,newValue){
	if(newValue!=null){
		var settings = fetchSetting();
		settings[settingName] = newValue;
		localStorage['ext_options'] = JSON.stringify(settings);
	}
}

function is_undef(val,def){
	if(typeof val == "undefined" || val == null)
		return def;
	return val;
}

function is_true(val,t,f){
	if(val == true)
		return t;
	else
		return f;
}