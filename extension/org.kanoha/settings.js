function SettingsConnector() {
    var abs = {
        ".head": 0
    };
    try {
        abs = JSON.parse(localStorage["settings"]);
        if (abs[".head"] == null)
            abs[".head"] = 0;
    } catch (e) {
        localStorage["settings"] == JSON.stringify(abs);
    }
    this.reload = function () {
        try {
            abs = JSON.parse(localStorage["settings"]);
        } catch (e) {}
    };
    this.commit = function () {
        try {
            var check = JSON.parse(localStorage["settings"]);
        } catch (e) {
            //Invalid settings, overwrite
            localStorage["settings"] = JSON.stringify(abs);
            return true;
        }
        if (check[".head"] == null)
            check[".head"] = abs[".head"];
        if (check[".head"] != abs[".head"]) {
            return false;
        }
        abs[".head"]++;
        abs[".head"] = abs[".head"] % 2147483648;
        localStorage["settings"] = JSON.stringify(abs);
        return true;
    };
    this.getApiKey = function () {
        if (this.get("api.key") == null || this.get("api.key") == "")
            return "30d25295cbcfeedc";
        return this.get('api.key');
    };
    this.get = function (key) {
        if (key == null)
            return null;
        k = key.split(".");
        var curObj = abs;
        for (var i = 0; i < k.length; i++) {
            if (curObj[k[i]] != null)
                curObj = curObj[k[i]];
            else
                return null;
        }
        return curObj;
    };
    this.set = function (key, value) {
        if (key == null)
            return;
        k = key.split('.');
        var curObj = abs;
        for (var i = 0; i < k.length - 1; i++) {
            if (curObj[k[i]] != null)
                curObj = curObj[k[i]];
            else {
                curObj[k[i]] = {};
                curObj = curObj[k[i]];
            }
        }
        curObj[k[k.length - 1]] = value;
        return;
    };
}
