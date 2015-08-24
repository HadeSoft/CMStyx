var q = require('q');

exports.delete = function (req, res, db){
    var defer = q.defer();

    var target = req.query.target;
    var element = req.query.element;
    db.search('web-elements', 'value.name: ' + target + ' AND value.stx_element: ' + element)
    .then(function (result){
        var key = result.body.results[0].path.key;
        db.remove('web-elements', key)
        .then(function (message){
            defer.resolve(target);
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

exports.add = function (req, res, db, collection){
    var defer = q.defer();

    var data = req.query;
    data['stx_element'] = collection;

    db.post('web-elements', data)
    .then(function (message){
        console.log(message);
        defer.resolve(data.name);
    })
    .fail(function (err){
        defer.reject(err);
    });

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

                // if (split.length > 1) {
                //     var type = split[0];
                //     console.log(type);

                //     if (type == "file") {
                //         console.log("remove!")
                //         files.push(each);
                //         oldFileLocations.push(oldData[each]);
                //         continue;
                //     }
                // }

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
    db.put('web-elements', options.key, options.data)
    .then(function (message){
        // console.log(message);
    })
    .fail(function (err){
        console.log(err);
    });
}

/*
{
    projects:[],
    teams:[]
}
*/

exports.grab = function (db){
    var data = {};
    var defer = q.defer();

    console.log("STYX ACTION : Getting stx elements");
    db.search('web-elements', 'key: master')
    .then(function (resEles){
        if (typeof resEles.body.count == 0) {
            var elements = resEles.body.results[0].value.collection;
            var eleCount = elements.length;
            var c = 1;

            console.log("STYX ACTION : Grabbing elements = " + elements);

            for (each in elements) {
                var query = elements[each];
                var freshRun = false;

                db.search('web-elements', 'value.stx_element: ' + query)
                .then(function (result){
                    var holder = [];
                    var count = result.body.count;
                    var ele = result.body.results;

                    console.log(c + " : " + count);
                    if (count == 0 && !freshRun) {
                        console.log("FRESH");
                        freshRun = true;
                        var master = resEles.body.results[0].value;
                        delete master.collection;
                        for (a in master) {
                            if (master[a]._fresh) {
                                var title = master[a]._title;
                                data[title] = master[a];
                                console.log("ping");
                                console.log(data);
                            }
                        }
                        console.log("MASTR");
                        console.log(master);
                    } else {
                        var title = result.body.results[0].value.stx_element;
                        var i = 0;
                        while (i < count) {
                            holder.push(ele[i].value);
                            i++;
                        }


                        data[title] = holder;
                    }
                    if (c == eleCount) defer.resolve(result.body);
                    c++;
                })
                .fail(function (error){
                    console.log('STYX ERROR : ' + error);
                    defer.reject(new Error(err));
                });
            }
        } else {
            console.log("STYX ALERT: No elements found");
            defer.resolve("empty");
        }
    })
    .fail(function (err){
        console.log('STYX ERROR : ' + err);
        defer.reject(new Error(err));
    });

    return defer.promise;
}

exports.search = function (qy, col, db){
    var defer = q.defer();
    console.log("STYX ACTION: Searching " + col + " for: " + qy);
    
    db.search(col, qy)
    .then(function (result){
        defer.resolve(result);
        console.log('pong');
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