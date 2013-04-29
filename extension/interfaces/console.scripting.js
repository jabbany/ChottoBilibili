var ScriptingEngine = function(iv){
	this.depth = 0;
	var terminal = null;
	var vars = {};
	if(typeof iv == "object"){
		//Copy over initialization vectors
		for(var x in iv){
			vars[x] = iv[x];
		}
	}
	var history = [];
	var stdin = null;
	var hpos = 0;
	
	var defun = null;
	var defunCtr = 0;
	
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
	var print = function( text ,inline , indent){
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
	var print_r = function(r){
		if(r == null){
			print(":= null");
			return;
		}
		if(typeof r == "string"){
			print(":= \"" + r + "\"");
		}else if(typeof r == "number"){
			print(":= " + r + "");
		}else if(typeof r == "boolean"){
			print(":= " + (r ? "true" : "false"));
		}else{
			print(r);
		}
	};
	var replaceVariables = function(cmd){
		if(cmd.length <= 1)
			return cmd;
		for(var i = 1; i < cmd.length; i++){
			if(cmd[i].substring(0,1) == "$"){
				var vname = cmd[i].substring(1);
				if(vars[vname] != null){
					//Exists
					cmd[i] = vars[vname];
				}
			}else if(/^\d+$/.test(cmd[i])){
				cmd[i] = parseInt(cmd[i]);
			}
		}
		return cmd;
	};
	var createVar = function (v,d){
		if(typeof d != "string")
			vars[v] = d;
		if(/^\d+$/.test(d)){
			try{
				d = parseInt(d);
			}catch(e){}
		}
		vars[v] = d;
	};

	this.execute = function(text, quiet){
		if(this.depth > 20){
			print("Call stack depth exceeded.");
			return;
		}
		var command = tokenize(text);
		command = replaceVariables(command);
		if(command.length == 0)
			return;
		history.push(text);
		hpos = history.length;
		if(defun != null){
			var delim = "";
			if(command[0] != "nufed"){
				for(var x = 0; x < defunCtr; x++)
					delim += " ";
				defun.record(text);
				if(!quiet)
					print(">" + delim + text);
				if(command[0] == "defun")
					defunCtr++;
			}else{
				defunCtr--;
				for(var x = 0; x < defunCtr; x++)
					delim += " ";
				if(!quiet)
					print(">" + delim + "nufed;");
				if(defunCtr == 0)
					defun = null;
				else
					defun.record("nufed");
			}
			return;
		}
		if(!quiet){
			print("# " + text);
		}
		switch(command[0]){
			case "clear":{
				terminal.innerHTML = "";
				return;
			}
			case "logout":
			case "exit":{
				print("Logging out.");
				window.location.href = "options.html";
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
						case "settings":
							if(command[2] != ""){
								var s = new SettingsConnector();
								print(s.get(command[2]));
							}else{
								print(JSON.parse(localStorage['settings']));
							}
						break;
						case "transients":
							var t = new TransientPrayer();
							if(command[2] == "")
								print(t.toString());
							else
								print(t.get(command[2]));
						break;
						case "cache":
							print("Cache not supported");
						break;
						case "vars":
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
					print("  reset some system value, usually this means clearing the value\n");
					print("please make sure that you know what you are doing and that you ",true);
					print("have backups!",true);
					print("");
					print("  [Something]: settings, settings-head, defaults, transients, cache");
					return;
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
					case "defaults":{
						if(confirm("!!ATTENTION!!\n This will reset all settings to factory presets. \nYou will lose all personal settings. \nResetting to defaults can in most cases restore the plugin to a working state if you messed up.")){
							if(typeof CONSOLE_FIX_DEFAULTS == "object"){
								localStorage["settings"] = JSON.stringify(CONSOLE_FIX_DEFAULTS["settings"]);
								localStorage["transient"] = JSON.stringify(CONSOLE_FIX_DEFAULTS["transient"]);
								localStorage["flags"] = JSON.stringify(CONSOLE_FIX_DEFAULTS["flags"]);
								print("Reset to defaults complete. Please reload the plugin to see results.");
							}else{
								alert("Error! Defaults cannot be read. Nothing was done.");
								print("Cancelled");
							}
						}else{
							print("Cancelled.");
						}
						return;
					}
					default:
						print("Cannot clear that. What is it?");
				}
				return;
			}
			case "if":{
				if(command.length != 4 && command.length != 6){
					print("construct: if [bool] then <function> (else <function>)");
					print(" if the bool is true then execute the function, else execute the other function");
					return;
				}
				if(typeof command[1] == "boolean" && command[1]){
					vars[command[3]].run([]);
				}else if(command.length == 6 && command[4] == "else"){
					vars[command[5]].run([]);
				}
				return;
			}
			case "defun":{
				if(command.length < 2 || command[1] == ""){
					print("construct: defun - defines a function");
					print("  takes the form of defun <functionName> [param1] [param2] .. [paramn]");
					print("  to end definition, type \"nufed\"");
					return;
				}
				var parentDepth = this.depth;
				vars[command[1]] = new function(){
					/** Init Parameters **/
					var heap = [];
					var se = null;
					this.run = function(parameters){
						var x = {};
						for(var n in vars)
							x[n] = vars[n];
						for(var i = 0; i < parameters.length; i++){
							x["params:" + i] = parameters[i];
						}
						se = new ScriptingEngine(x);
						se.hookTerminal(terminal);
						se.hookInput(stdin);
						se.depth == parentDepth + 1;
						for(var i = 0; i < heap.length; i++){
							se.execute(heap[i], true);
						}
					};
					this.record = function(command){
						heap.push(command);
					};
				};
				defun = vars[command[1]];
				defunCtr = 1;
				return;
			}
			case "ls":{
				if(command.length > 1){
					if(command[1] == "-a")
						print(".\t..\t.bilibox");
					else if(command[1] == "-l"){
						print("total 3");
						print("dr-xr-xr-x .");
						print("dr-xr-xr-x ..");
						print("lr-xr-xr-x .bilibox => system-coreutils");
					}	
				}else{
					print(".\t..");
				}
				return;
			}
			case "nasu":{
				if(command[1] == "--help" || command[1] == "-h"){
					print("nasu - its a mini-game. Catch the falling eggplant");
					print(" -n : no guideline");
					return;
				}else if(command[1] == "-n"){
					var guide = false;
				}else
					var guide = true;
				var lr = function(e){
					if(e.keyCode == 37)
						p = Math.max(p -1, 0);
					else if(e.keyCode == 39)
						p = Math.min(p +1, 19);
					else if(e.keyCode == 27){
						terminal.innerHTML = "";
						clearInterval(iv);
						print("Exited Game",true);
						stdin.removeEventListener(lr);
					}
				}
				var r = 0.1, adv = 0;
				var slotsH = 20, slotsV = 13, p = 10;
				var score = 0, mt = 0;
				var items = [];
				for(var i = 0; i < slotsV; i++) items[i] = [];
				//Output the playing field
				var iv = setInterval(function(){
					terminal.innerHTML = "";
					print("Score: " + score + " r: " + Math.round(r * 100),true);
					print("");
					mt++;
					if(mt == 10)
						mt = 0;
					if(mt == 0 && Math.random() < r){
						items[0][Math.floor(Math.random() * slotsH)] = 1;
						r -= adv;r += 0.01;adv = 0;
					}else if(mt == 0){
						r += 0.05;adv+= 0.05;
					}
					for(var i = 0; i < slotsV; i++){
						for(var j = 0; j < slotsH; j++){
							if(items[i][j] == null || items[i][j] == 0){
								if(j == p && guide)
									print(".",true);
								else
									print(" ",true);
							}else if(items[i][j] == 1){
								if(mt == 0){
									items[i][j] = 0;
									if(i+1 < slotsV){
										items[i+1][j] = 2;
									}else{
										if(p == j)
											score++;
										else{
											score-=2;
											if(score < 0){
												clearInterval(iv);
												terminal.innerHTML = "";
												print("Game Over",false);
												stdin.removeEventListener(lr);
												return;
											}
										}
									}
									print(" ",true);
								}else{
									print("#", true);
								}
							}else if(items[i][j] == 2){
								items[i][j] = 1;
								print("#",true);
							}
						}
						print("");
					}
					for(var j = 0; j < slotsH; j++){
						if(j == p)
							print("_", true);
						else
							print(" ", true);
					}
				},100);
				stdin.addEventListener("keydown",lr);
				return;
			}
			case "ps":{
				//Prints working task q
				var s = new SettingsConnector();
				var d = s.get("logs.lastStartCheck");
				var dateObj = new Date(d == null ? 0 : d);
				print("Last Updated: " + dateObj.getFullYear() + "-" + (dateObj.getMonth()+1)
					+"-"+dateObj.getDate() + " " + dateObj.getHours() + ":" + dateObj.getMinutes() +
					":" + dateObj.getSeconds() + " (" + (d != null ? Math.round(((new Date()).getTime() -d)/60000): 0) + " mins ago)");
				return;
			}
			case "pwd":{
				print("/");
				return;
			}
			case "cd":{
				if(command[1] != "." && command[1] != null && command[1] != "..")
					print(command[1] + " : is not a directory");
				else
					print("/");
				return;
			}
			case "echo":{
				command.shift();
				if(command[0] == null)
					print("");
				else{
					var printt = "";
					for(var i = 0; i<command.length; i++){
						if(command[i] != ">")
							printt += command[i];
						else
							break;
					}
					if(command[i+1] != null){
						vars[command[i+1]] = printt;
						return;
					}
					print(printt);
				}
				return;
			}
			case "for":{
				if(command.length != 7){
					print("construct: for [variable] from [number] to [number] (function)");
					return;
				}
				
				for(vars[command[1]] = parseInt(command[3]); 
							vars[command[1]] < parseInt(command[5]);
								vars[command[1]]++){
					vars[command[6]].run([]);			
				}
				return;
			}
			case "serialize":{
				if(command.length != 2){
					print("usage: serialize an object to json");
					return;
				}
				if(typeof command[1] != "object")
					return print("Type error");
				print(JSON.stringify(command[1]));
				return;
			}
			case "dmesg":{
				if(command.length < 2){
					var dmesg = localStorage.debuglog;
					if(dmesg == null || dmesg == ""){
						print("");
					}else{
						var d = JSON.parse(dmesg);
						for(var i = d.length - 1; i >= 0; i--){
							print(d[i]);
						}
					}
				}else{
					if(command[1] == "-c" || command[1] == "--clear"){
						localStorage.debuglog = "[]";
					}else if(command[1] == "-f" || command[1] == "--filter"){
						if(command[2] != null){
							try{
								var r = new RegExp(command[2]);
								var dmesg = localStorage.debuglog;
								var d = JSON.parse(dmesg);
								for(var i = d.length - 1; i >= 0; i--){
									if(r.test(d[i]))
										print(d[i]);
								}	
							}catch(er){
								print("Filter error. Invalid Regex");
							}
						}else{
							print("Filter error. Not specified");
						}
					}else if(command[1] == "-l" || command[1] == "--lines"){
						try{
							if(typeof command[2] == "string")
								var lines = parseInt(command[2]);
							else
								var lines = command[2];
							var dmesg = localStorage.debuglog;
							var d = JSON.parse(dmesg);
							for(var i = d.length - 1; i >= 0; i--){
								if(lines-- > 0)
									print(d[i]);
							}	
						}catch(e){
							
						}
					}else if(command[1] == "-h" || command[1] == "--help"){
						print("dmesg - outputs debugging messages");
						print(" usage: dmesg -[f <filterRegex>|l <lines>|h]");
						print("   -s : schedules debug on next check");
						print("   -u : unschedules debug on next check");
					}else if(command[1] == "-s"){
						var sc = new SettingsConnector();
						sc.set("logs.logNext",true);
						if(sc.commit())
							print("Scheduled Successfully.");
						else
							print("Schedule failed");
					}else if(command[1] == "-u"){
						var sc = new SettingsConnector();
						sc.set("logs.logNext",false);
						if(sc.commit())
							print("UnScheduled Successfully.");
						else
							print("UnSchedule failed");
					}
				}
				return;
			}
			case "help":{
				var commands = [
					"help : displays this help",
					"var : creates temporary variable",
					"json : parses json within a variable",
					"serialize : serializes a json object",
					"get : get system value",
					"set : set system value",
					"console : changes how this console behaves",
					"reset : dumps stuff [dangerous]",
					"clear : clears display",
					"ps : shows status about the running sync/checks",
					"dmesg : outputs the debugging messages",
					"defun : defines a function"
				];
				print("Available commands: ");
				for(var i=0; i < commands.length; i++){
					print("  " + commands[i]);
				}
				return;
			}
			default:{
				if(command[0].substring(0,1) == "$"){
					if(command.length == 1){
						print_r(vars[command[0].substring(1)]);
					}else if (command.length == 3 || command.length == 5){
						if(command[1] == "="){
							if(command.length == 3){
								createVar(command[0].substring(1),command[2]);
								if(!quiet)
									print(command[0].substring(1) + " : " + (typeof vars[command[0].substring(1)]));
								return;
							}else if(command.length == 5){
								if(typeof command[4] != typeof command[2]){
									print("Type mismatch for arguments 2,4");
									return;
								}
								switch(command[3]){
									case "+":
										createVar(command[0].substring(1),command[2] + command[4]);
									break;
									case "-":
										createVar(command[0].substring(1),command[2] + command[4]);
									break;
									case "*":
										createVar(command[0].substring(1),command[2] * command[4]);
									break;
									case "/":
										if(command[4] == 0)
											return print("No: Division by zero.");
										createVar(command[0].substring(1),command[2] / command[4]);
									break;
									default:
										return print("Unrecognized operator : " + command[3]);
								}
							}
						}else if(command[1] == "==" || command[1] == ">" || command[1] == "<"
							|| command[1] == "+" || command[1] == "-" || command[1] == "*"
							|| command[1] == "/" || command[1] == "%"){
							var a = vars[command[0].substring(1)];
							if(typeof command[2] == "string" && command[2].substring(0,1) == "$")
								var b = vars[command[2].substring(1)];
							else{
								createVar("_tmp",command[2]);
								var b = vars["_tmp"];
							}
							if(typeof a == typeof b){
								if(command[1] == "=="){
									if(command[3] == ">"){
											createVar(command[4], a == b);
									}else
										print_r(a == b);
								}else if (command[1] == "<"){
									if(typeof a != "number")
										print("Illegal operation, comparison on non-numbers");
									else{
										if(command[3] == ">"){
											createVar(command[4], a < b);
										}else
											print_r(a < b);
									}

								}else if (command[1] == "+" || command[1] == "-"
									|| command[1] == "*" || command[1] == "/"){
									if(typeof a != "number")
										print("Illegal operation, math on non-number");
									else{
										switch(command[1]){
											case "+":var c = a+b;break;
											case "-":var c = a-b;break;
											case "*":var c = a*b;break;
											case "/":var c = a/b;break;
											case "%":var c = a%b;break;
											default:var c=a;
										}
										if(command[3] == ">"){
											createVar(command[4], c);
										}else{
											print(c);
										}
									}	
								}else{
									if(typeof a != "number")
										print("Illegal operation, comparison on non-numbers");
									else{
										if(command[3] == ">"){
											createVar(command[4], a > b);
										}else
											print_r(a > b);
									}
								}
							}else{
								print("Type mismatch, [" + (typeof a) + " $param1] - " +
									" [" + (typeof b) + " $param2]"); 
							}
						}
					}
					return;
				}else if(vars[command[0]] != null && vars[command[0]].run != null){
					var c = command.shift();
					console.log(c);
					vars[c].run(command);
					return;
				}
				print(command[0] + " : Not found");
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
