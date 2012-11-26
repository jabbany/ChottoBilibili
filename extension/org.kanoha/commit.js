/** 
* Commit watcher for bilibili extension
* Author: Jabbany
**/
function CommitCallback(){
	var binding = null;
	var isBound = function(){ return binding == null; }
	this.bind = function(obj) { binding = obj };
	this.onCommit = function(){
		console.log('Commit Made!');
	};
}