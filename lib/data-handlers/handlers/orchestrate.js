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

exports.grab = function (db){
    var data = {};
    var defer = q.defer();

    db.search('web-elements', 'master')
    .then(function (resEles){
        if (typeof resEles.body.results === undefined) {
            var elements = resEles.body.results[0].value['0'];
            var eleCount = elements.length;
            var c = 1;

            console.log("STYX ACTION : Grabbing elements = " + elements);

            for (each in elements) {
                var query = elements[each];
                var holder = [];

                db.search('web-elements', 'value.stx_element: ' + query)
                .then(function (result){
                    var count = result.body.count;
                    var element = result.body.results;
                    var i = 0;
                    while (i < count) {
                        holder.push(element[i].value);
                        i++;
                    }

                    data[query] = holder;

                    if (c == eleCount) {
                        defer.resolve(data);
                    }
                    c++;
                })
                .fail(function (error){
                    console.log('STYX ERROR : ' + error);
                    defer.reject(new Error(err));
                });
            }
        } else {
            defer.resolve({});
        }
    })
    .fail(function (err){
        console.log('STYX ERROR : ' + err);
        defer.reject(new Error(err));
    });

    return defer.promise;
}