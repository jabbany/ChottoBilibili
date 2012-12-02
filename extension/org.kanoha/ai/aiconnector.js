/** 
	AI Connector, Connects to Artificial Intelligence! 
**/

function AI(aiEngine){
	var aiCore = aiEngine;
	this.talk = function(){
		return aiCore.speak(function(f){return true;},0);
	};
}