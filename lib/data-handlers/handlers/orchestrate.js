var q = require('q');
var dbConnection = require('orchestrate');

//default database
var db = null;

exports.alive = true;

exports.setup = function (config){
    var defer = q.defer();

    dbConnection.ApiEndPoint = config.location;
    db = dbConnection(config.key);

    db.ping()
    .then(function (res){
        defer.resolve(db);
    })
    .fail(function (err){
        defer.reject(err);
    });

    return defer.promise;
}

exports.delete = function (req, res, db){
    var defer = q.defer();

    var target = req.query.target;
    var element = req.query.element;
    db.search('web-elements', 'value.name: ' + target + ' AND value.stx_element: ' + element)
    .then(function (result){
        var key = result.body.results[0].path.key;

        console.log("ST~ Removing element");

        db.remove('web-elements', key)
        .then(function (message){
            console.log(result.body.results[0].value);
            var count = result.body.count;
            console.log(count);
            if (count <= 1) {
                defer.resolve(result.body.results[0].value.stx_position);
            } else {
                defer.resolve("Element removed");
            }
        })
        .fail(function (error){
            defer.reject(err);
        });
    })
    .fail(function (err){
        console.log("STYX ERROR : " + target + " could not be found.");
        defer.reject(err);
    });

    return defer.promise;
}

exports.add = function (data, db, key){
    var defer = q.defer();

    var customKey = key;

    if (key == 0) {
        db.post('web-elements', data)
        .then(function (){
            defer.resolve(data.name);
        })
        .fail(function (err){
            defer.reject(err);
        });
    } else {
        db.put('web-elements', customKey, data)
        .then(function (message){
            defer.resolve(data.name);
        })
        .fail(function (err){
            defer.reject(err);
        });
    }
    

    return defer.promise;
}

exports.compareRecords = function (req, res, db, opts){
    var defer = q.defer();

    var newData = req.query;
    console.log(newData);
    var oldFileLocations = [];
    var compare = {};

    db.search('web-elements', 'value.name: `' + opts[1] + '` AND value.stx_element: ' + opts[0])
    .then(function (result){
        var targetKey = result.body.results[0].path.key;

        var oldData = result.body.results[0].value;

        var files = [];

        for (each in newData) {
            if (oldData[each] != newData[each]) {
                var split = each.split('_');
                console.log(split);

                oldData[each] = newData[each];
            }
        }

        compare = {
            "data" : oldData,
            "files" : files,
            "key" : targetKey,
            "remove" : oldFileLocations
        }
        defer.resolve(compare);
    })
    .fail(function (error){
        defer.reject(error);
    });

    return defer.promise;
}

exports.update = function (req, res, db, options){
    var defer = q.defer();
    
    db.put('web-elements', options.key, options.data)
    .then(function (message){
        // console.log(message);
        defer.resolve();
    })
    .fail(function (err){
        console.log(err);
        defer.resolve()();    
    });

    return defer.promise;
}

/*
{
    projects:[],
    teams:[]
}
*/

var ELEMENT = function (element){
    var dictionary = {
        '_title' : 'stx_element',
        '_fresh' : 'stx_empty',
        '_props[]' : 'REMOVE THIS ELEMENT NOW',
        '_index' : 'stx_position'
    };

    this.packet = {};

    for (each in element) {
        var prefix = each.split('')[0];

        if (prefix == '_') {
            var newTitle = dictionary[each];
            if (newTitle != "REMOVE THIS ELEMENT NOW") this.packet[newTitle] = element[each];
        } else {
            this.packet[each] = element[each];
        }
    }
}

exports.grab = function (db){
    var defer = q.defer();
    var data = {};

    console.log("ST~ Getting styx elements");

    db.search('web-elements', 'key: master')
    .then(function (res){
        if (res.body.count == 0) {

            console.log("SA~ No elements in database");

            defer.resolve(0);
        } else {
            var elements = res.body.results[0].value.collection;
            var eleCount = elements.length;
            var c = 1;

            console.log("SA~ Grabbing elements " + elements);

            for (each in elements) {
                var query = elements[each];
                var freshRun = false;

                db.search('web-elements', 'value.stx_element: ' + query)
                .then(function (result){
                    var holder = [];
                    var count = result.body.count;

                    if (count == 0 && !freshRun) {
                        freshRun = true;

                        var master = res.body.results[0].value;
                        delete master.collection;

                        for (index in master) {
                            if (master[index]._fresh) {
                                master[index]._index = index;
                                var elementTitle = master[index]._title;
                                var newElement = new ELEMENT(master[index]);

                                data[elementTitle] = newElement.packet;
                            }
                        }
                    } else {
                        var ele = result.body.results;
                        var elementTitle = result.body.results[0].value.stx_element;
                        var holder = [];

                        ele[0].value.stx_empty = false;

                        var i = 0;
                        while (i < count) {
                            holder.push(ele[i].value);
                            i++;
                        }

                        data[elementTitle] = holder;
                    }

                    if (c == eleCount) defer.resolve(data);
                    c++
                })
                .fail(function (err){
                    console.log("SE~ element search failed for " + query);
                    defer.reject(err);
                });
            }
        }
    })
    .fail(function (err){
        console.log("SE~ Error finding master object");
        defer.reject(err);
    });

    return defer.promise;
}

exports.search = function (qy, col, db){
    var defer = q.defer();
    console.log("STYX ACTION: Searching " + col + " for: " + qy);
    
    db.search(col, qy)
    .then(function (result){
        defer.resolve(result);
    })
    .fail(function (err){
        console.log("STYX ERROR: Search failed");
        defer.reject(err);
    });

    return defer.promise;
}

exports.find = function (key, col, db){
    var defer = q.defer();
    console.log("STYX ACTION: Getting " + key + " in " + col);
    
    db.get(col, key)
    .then(function (res){
        defer.resolve(res);
    })
    .fail(function (err){
        defer.reject(err);
    });
    
    return defer.promise;
}

exports.defUpdate = function (key, data, db){
    var defer = q.defer();
    
    db.merge('web-elements', key, data)
    .then(function (res){
        defer.resolve(res);
    })
    .fail(function (err){
        defer.reject(err);
    });

    return defer.promise;
}

exports.new = function (data, db){
    var defer = q.defer();
    
    db.post('web-elements', data)
    .then(function (res){
        defer.resolve(res);
    })
    .fail(function (err){
        defer.reject(err);
    });

    return defer.promise;
}

exports.set = function (key, col, path, val, db){
    var defer = q.defer();
    
    db.newPatchBuilder(col, key)
    .replace(path, val)
    .apply()
    .then(function (res){
        defer.resolve(res);
    })
    .fail(function (err){
        defer.reject(err);
    });

    
    return defer.promise;
}