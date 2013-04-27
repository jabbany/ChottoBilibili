var jsPoll = {
    global: {},
    tasks: [],
    current: null,
    run: function () {
        if (this.tasks.length > 0) {
            this.current = this.tasks.shift();
            this.current.execute(this.current);
        }
    },
    push: function (task) {
        this.tasks.push(task);
    },
    create: function (task) {
        var self = this;
        return {
            "execute": task,
            "complete": function () {
                self.current = null;
                self.run();
            },
            "onkill": function () {
                console.log("[War]Task killed!");
            },
            "onsuspend": function () {
                console.log("[War]Task suspend cannot revive");
            },
            "global": this.global,
            "local": {}
        };
    },
    killall: function () {
        while (this.tasks.length > 0) {
            var task = this.tasks.shift();
            task.onkill();
        }
        if (this.current != null)
            this.current.onkill();
    },
    suspendall: function () {
        while (this.tasks.length > 0) {
            var task = this.tasks.shift();
            task.onsuspend();
        }
        if (this.current != null)
            this.current.onsuspend();
    }
}