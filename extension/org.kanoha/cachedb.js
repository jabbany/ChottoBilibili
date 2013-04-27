function CacheDB(dbName) {
    var databaseName = dbName != null ? dbName : "cachedb";
    var db = {};
    try {
        db = JSON.parse(localStorage["db:" + databaseName]);
    } catch (e) {
        localStorage["db:" + databaseName] = JSON.stringify(db);
    }

    this.commit = function () {
        localStorage["db:" + databaseName] = JSON.stringify(db);
    };
    this.write = function (index, record) {
        db[index] = record;
    };
    this.get = function (index) {
        return db[index];
    };
    this.search = function (colname, filter) {
        var r = [];
        for (elm in db) {
            if (db[elm][colname] != null) {
                if (filter(db[elm][colname]))
                    r.push(db[elm]);
            }
        }
        return r;
    };
    this.reduce = function (foldFunction, baseCase) {
        var foldResult = baseCase;
        for (elm in db) {
            foldResult = foldFunction(db[elm], foldResult);
        }
        return foldResult;
    };
    this.map = function (mapFunction) {
        for (elm in db) {
            db[elm] = mapFunction(elm, db[elm]);
            if (db[elm] == null)
                delete db[elm];
        }
    };
    this.getIndex = function (index) {
        var list = [];
        for (elm in db) {
            list.push(elm);
        }
        return list;
    };
    this.truncate = function (chk) {
        if (chk == null)
            chk = function (key, value) {
                return true;
        }
        for (elm in db) {
            if (chk(elm, db[elm])) {
                delete db[elm];
            }
        }
    };
    this.refresh = function (callback) {
        db = JSON.parse(localStorage["db:" + databaseName]);
        if (callback != null)
            callback();
    };
}

function PQueue() {
    var pq = [];
    var size = 0;
    var compare = function (a, b) {
        if (a.p > b.p) return 1;
        else if (a.p < b.p) return -1;
        return 0;
    };
    this.setComparator = function (f) {
        compare = f;
    };
    this.insertWithPriority = function (i, p) {
        pq.push({
            "p": p,
            "item": i
        });
        var idx = pq.length - 1;
        while (true) {
            if (idx == 0)
                break;
            if (compare(pq[idx], pq[Math.floor((idx - 1) / 2)]) > 0) {
                var tmp = pq[Math.floor((idx - 1) / 2)];
                pq[Math.floor((idx - 1) / 2)] = pq[idx];
                pq[idx] = tmp;
                idx = Math.floor((idx - 1) / 2);
            } else {
                break;
            }
        }
        size++;
    };
    this.poll = function () {
        if (size == 0)
            return null;
        size--;
        if (size == 0) {
            return pq.pop().item;
        }
        var r = pq[0].item;
        pq[0] = pq.pop();
        var idx = 0;
        while (true) {
            if (idx * 2 + 1 >= size)
                break;
            if (idx * 2 + 2 >= size) {
                if (compare(pq[idx * 2 + 1], pq[idx]) > 0) {
                    var tmp = pq[idx];
                    pq[idx] = pq[idx * 2 + 1];
                    pq[idx * 2 + 1] = tmp;
                    break;
                } else {
                    break;
                }
            }
            if (compare(pq[idx * 2 + 1], pq[idx * 2 + 2]) > 0) {
                if (compare(pq[idx * 2 + 1], pq[idx]) > 0) {
                    var tmp = pq[idx];
                    pq[idx] = pq[idx * 2 + 1];
                    pq[idx * 2 + 1] = tmp;
                    idx = idx * 2 + 1;
                } else
                    break;
            } else {
                if (compare(pq[idx * 2 + 1], pq[idx]) > 0) {
                    var tmp = pq[idx];
                    pq[idx] = pq[idx * 2 + 2];
                    pq[idx * 2 + 2] = tmp;
                    idx = idx * 2 + 2;
                } else
                    break;
            }
        }
        return r;
    };
    this.peek = function () {
        if (pq.length == 0)
            return null;
        return pq[0].item;
    };
    this.size = function () {
        return size;
    };
}