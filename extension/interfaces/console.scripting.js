var ScriptingEngine = new function(){
	var terminal = null;
	var vars = {};
	var history = [];
	var stdin = null;
	var hpos = 0;
	var macroMode = false;
	var macroName = "";
	var macro = [];
	var tokenize = function(string){
		var tokens = string.split(" ");
		for(var i = 0; i < tokens.length; i++){
			if(tokens[i].substring(tokens[i].length-1) == "\\"){
				if(tokens.length > i+1){
					tokens[i] = tokens[i].substring(0, tokens[i].length - 1) 
									+ " " + tokens[i+1];
					tokens.splice(i+1,1);
					i--;
				}
			}
		}
		return tokens;
	};
	var prettyPrint = function(obj,lineIndent){
		if(lineIndent == null){
			lineIndent = 0;
		}
		var indent = "";
		for(var i = 0; i <= lineIndent; i++){
			indent += "  ";
		}
		print("{",true);
		for(var x in obj){
			print(indent + "\"" + x + "\" : ");
			print(obj[x], true, lineIndent+1);
		}
		print(indent.substring(2) + "}");
	};
	var print = function(text,inline, indent){
		if(terminal != null){
			if(text == null){
				print("null");
				return;
			}
			if(!inline)
				terminal.appendChild(document.createElement("br"));
			if(typeof text == "string")
				terminal.appendChild(document.createTextNode(text.replace(/\s/g,"\u00a0")));
			else if(typeof text == "number"){
				terminal.appendChild(document.createTextNode(text));
			}else if(typeof text == "function"){
				print("[function Native]",true);
			}else if (typeof text == "boolean"){
				print(text ? "true" : "false",true);
			}else{
				prettyPrint(JSON.parse(JSON.stringify(text)),indent);
			}
			terminal.scrollTop = terminal.scrollHeight;
		}
	};
	var createVar = function (v,d){
		if(/^\d+$/.test(d)){
			try{
				d = parseInt(d);
			}catch(e){}
		}
		vars[v] = d;
	};
	this.execute = function(text){
		var command = tokenize(text);
		if(command.length == 0)
			return;
		history.push(text);
		hpos = history.length;
		if(macroMode){
			macro.push(text);
		}
		switch(command[0]){
			case "clear":{
				terminal.innerHTML = "";
				return;
			}
			case "get":{
				if(command.length < 2){
					print("usage: get [type] [key]");
					print("  [type] can be any one of \"setting\", \"transient\",\"cache\",\"var\"");
					print("  [key] is a representation of the structured data type, if key is not given, the entire object is returned");
				}else{
					if(command.length == 2)
						command.push("");
					switch(command[1]){
						case "setting":
							if(command[2] != ""){
								var s = new SettingsConnector();
								print(s.get(command[2]));
							}else{
								print(JSON.parse(localStorage['settings']));
							}
						break;
						case "transient":
							var t = new TransientPrayer();
							if(command[2] == "")
								print(t.toString());
							else
								print(t.get(command[2]));
						break;
						case "cache":
							print("Cache not supported");
						break;
						case "var":
							if(command[2] != ""){
								print(vars[command[2]]);
							}else
								print(vars);
						break;
						default:
							print("What do you want?");
						break;
					}
				}
				return;
			}break;
			case "let":
			case "var":{
				if(command.length != 3 && !(command.length == 4 && command[2] == "=")){
					print("usage: var [name] [value]");
					print("    creates temporary variable");
					return;
				}
				if(command[2] == "=")
					command.splice(2,1);
				createVar(command[1],command[2]);
				print(command[1] + " : " + typeof vars[command[1]]);
				return;
			}break;
			case "json":{
				if(command.length != 2 || command[1] == "--help"){
					print("usage: json [variable_name]");
					print("    parses a json value stored in a variable and updates such variable");
					return;
				}
				if(vars[command[1]] == null)
					return print("* Undefined Variable");
				if(typeof vars[command[1]] != "string")
					return print("* Not a string");
				try{
					vars[command[1]] = JSON.parse(vars[command[1]]);
					print("Done.");
				}catch(e){
					print("JSON Format Error: Could not parse.");
				}
				return;
			}
			case "console":{
				if(command.length != 4){
					print("usage: console [action] [key] [value]");
					print(" expected 3 parameters, got " + (command.length - 1));
					return;
				}
				if(command[1] == "set"){
					switch(command[2]){
						case "color":{
							terminal.style.color = command[3];
							stdin.style.color = command[3];
							break;
						}
						case "font":{
							terminal.style.fontFamily = command[3];
							stdin.style.fontFamily = command[3];
							break;
						}
						case "size":{
							terminal.style.fontSize = command[3];
							stdin.style.fontSize = command[3];
							break;
						}
						case "background":{
							terminal.style.background = command[3];
							break;
						}
					}
				}else{
					print("Action not supported.");
				}
				return;
			}
			case "reset":{
				if(command.length != 2){
					print("usage : reset [something]");
					print("  reset some system value, usually this means clearing the value");
					print("please make sure that you know what you are doing and that you ",true);
					print("have backups!",true);
					print("");
					print("  [Something]: settings, settings-head, transients, cache");
				}
				switch(command[1]){
					case "settings":{
						//This is noisy!
						if(confirm("!!WARNING!!\n Are you sure you wish to CLEAR ALL SETTINGS ?\n\n THERE IS NO TURNING BACK IF YOU CONFIRM THIS ACTION")){
							localStorage["settings"] = "{\".head\":0}";
							print("Settings cleared.");
						}else
							print("Cancelled.");
					}break;
					case "transients":{
						localStorage["transient"] = "{}";
						print("Cleared.");
					}break;
					case "settings-head":{
						if(confirm("!!ATTENTION!! The settings head value is for locking async changes to prevent race conditions. \nResetting this value may make sync behave weirdly and \nWILL CAUSE current pending transactions to FAIL.\n Are you sure you wish to proceed ? ")){
							var set = JSON.parse(localStorage["settings"]);
							set[".head"] = 0;
							localStorage["settings"] = JSON.stringify(set);
							print("Reset settings head to 0");
						}else{
							print("Cancelled");
						}
						return;
					};
					default:
						print("Cannot clear that. What is it?");
				}
				return;
			}
			case "record":{
				if(macroMode){
					macroMode = false;
					var s = new SettingsConnector();
					macro.pop(); //Pop out last command
					s.set("console.macros." + macroName, macro);
					print("recording finished");
					if(!s.commit()){
						print("[err] macro save failed!");
					}
					return;
				}
				if(command.length != 2){
					print("usage: record [macro-name]");
					print(" record a macro, end by command 'record end'");
					return;
				}
				macroMode = true;
				macroName = command[1].replace(/[^a-zA-Z0-9]/g,"");
				print("> RECORDING MACRO <");
				return;
			}
			case "help":{
				var commands = [
					"help : displays this help",
					"var : creates temporary variable",
					"json : parses json within a variable",
					"get : get system value",
					"set : set system value",
					"console : changes how this console behaves",
					"record : records a macro",
					"reset : dumps stuff [dangerous]"
				];
				print("Available commands: ");
				for(var i=0; i < commands.length; i++){
					print(commands[i]);
				}
				return;
			}
			default:{
				if(command.length == 1){
					if(vars[command[0]] != null){
						print(vars[command[0]]);
						return;
					}
				}
				if(command[0].substring(0,1) == "$"){
					if(command.length == 1){
						print(vars[command[0].substring(1)]);
					}else if (command.length == 3){
						if(command[1] == "="){
							createVar(command[0].substring(1),command[2]);
							print(command[0].substring(1) + " : " + (typeof vars[command[0].substring(1)]));
							return;
						}else if(command[1] == "==" || command[1] == ">" || command[1] == "<"){
							var a = vars[command[0].substring(1)];
							if(command[2].substring(0,1) == "$")
								var b = vars[command[2].substring(1)];
							else{
								createVar("_tmp",command[2]);
								var b = vars["_tmp"];
							}
							if(typeof a == typeof b){
								if(command[1] == "==")
									print(a == b);
								else if (command[1] == "<"){
									if(typeof a != "number")
										print("Illegal operation, comparison on non-numbers");
									else
										print(a < b);
								}else{
									if(typeof a != "number")
										print("Illegal operation, comparison on non-numbers");
									else
										print(a > b);
								}
							}else{
								print("Type mismatch, [" + (typeof a) + " $param1] - " +
									" [" + (typeof b) + " $param2]"); 
							}
						}
					}
					return;
				}
				print(text + " : Not found");
				return;
			}
		}
	};
	this.hookTerminal = function(term){
		terminal = term;
	};
	this.hookInput = function(term){
		stdin = term;
	};
	this.getHistory = function(){
		hpos--;
		if(hpos >= 0)
			return history[hpos];
		hpos = 0;
		return "";
	};
};
