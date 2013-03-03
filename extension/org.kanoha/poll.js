var jsPoll = {
	global:{},
	tasks:[],
	run:function(){
		if(this.tasks.length > 0){
			var task = this.tasks.shift();
			task.execute(task);
		}
	},
	push:function(task){
		this.tasks.push(task);
	},
	create:function(task){
		var self = this;
		return {
			"execute":task,
			"complete":function(){
				self.run();
			},
			"onkill":function(){
				console.log("[War]Task killed!");
			},
			"global":this.global,
			"local":{}
		};
	},
	killall:function(){
		while(this.tasks.length > 0){
			task = this.tasks.shift();
			task.onkill();
		}
	}
}