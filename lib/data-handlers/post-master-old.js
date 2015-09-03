var q = require('q');
var fmd = require('formidable');
var util = require('util');
var fse = require('fs-extra');
var qt = require('quickthumb');
var path = require('path');

var conf = require('../../settings.json');
// var pp = require('./lib/passport/passportControls.js');
// var pages = path.join(__dirname, 'views/');

var db;
var handler;

exports.test = function (){
    console.log('wow');
}

exports.dbSet = function (dbc){
    handler = dbc;
    return 0;
}

exports.connectTo = function (choice){
    var defer = q.defer();

    var data_choice = choice || "defaultDatabase";
    console.log("STYX ACTION : Connecting to database : " + data_choice);
    try {
        var data_conf = conf[data_choice] || conf.defaultDatabase;
    } catch (e) {
        console.log("STYX ERROR : NO DATABASE CHOICE FOUND CHECK 'settings.json'");
        return false;
    }

    switch (data_conf.type) {
        case "default":
        case "orchestrate":
        default:
            var dbConnection = require('orchestrate');
            dbConnection.ApiEndPoint = data_conf.location;
            db = dbConnection(data_conf.key);

            db.ping()
            .then(function (){
                console.log("STYX ACTION : Successfully connected to database");
            })
            .fail(function (err){
                console.log("STYX ERROR : Cannot ping database.");
                console.log(err);
            });

            handler = require('./handlers/' + data_conf.type);
            defer.resolve(handler);
            break;
    }

    return defer.promise;
}

exports.remove = function (req, res, dbc){
    dbc.delete(req, res, db)
    .then(function (result){
        console.log("STYX ACTION : " + result + " has been removed.");
        res.redirect(conf.loginAdress + '/cmstyx-control');
    }).fail(function (err){
        console.log("STYX ERROR : Could not remove!");
        console.log(err);
        res.redirect(conf.loginAdress + '/cmstyx-control');
    });
}

exports.append = function (req, res, collection, dbc){
    var form = new fmd.IncomingForm();

    form.parse(req, function(err, fields, files){
        req.query = fields;

        res.writeHead(200, {
            'content-type' : 'text/plain'
        });
        res.write('received upload:\n\n');
        res.end(util.inspect({
            fields : fields,
            files: files
        }));

    });

    form.on('end', function (fields, files){
        /*Temp file locations*/
        var tempPath = this.openedFiles[0].path;
        /*New file name*/
        var fileName = this.openedFiles[0].name;
        /*Final file location*/
        var newLocation = './images/stored-images/' + collection + '/' + fileName;

        req.query.file_logo = newLocation;

        fse.move(tempPath, path.normalize(__dirname + '/../../../../public/' + newLocation), function (err){
            if (err) {
                console.error(err);
            } else {
                var data = req.query;
                data.stx_element = collection
                dbc.add(data, db)
                .then(function (result){
                    console.log("STYX ACTION : " + result + " has been added.");
                    res.redirect(conf.loginAdress + '/cmstyx-control');
                }).fail(function (err){
                    console.log("STYX ERROR : Could not add!");
                    console.log(err);
                    res.redirect(conf.loginAdress + '/cmstyx-control');
                });
            }
        });
    });
}

exports.rebuild = function (req, res, collection, target, dbc){
    var options = [collection, target];
    var form = new fmd.IncomingForm();

    form.parse(req, function(err, fields, files){
        req.query = fields;
    });

    form.on('end', function (fields, files){
        dbc.compareRecords(req, res, db, options)
        .then(function (result){
            dbc.update(req, res, db, result);

            res.redirect(conf.loginAdress + '/cmstyx-control');
        })
        .fail(function (error){
            console.log(error);
        });
    });
}

exports.getCMSElements = function (dbController){
    var defer = q.defer();
    var handler = dbController || handler;

    handler.grab(db)
    .then(function (res){
        defer.resolve(res);
    });

    return defer.promise;
}

exports.lookWith = function (query, collection, dbController){
    var defer = q.defer();
    var handler = dbController || handler;
    console.log(handler);

    handler.search(query, collection, db)
    .then(function (res){
        defer.resolve(res);
    })
    .fail(function (err){
        defer.resolve(0);
    });

    
    return defer.promise;
}

exports.lookFor = function (key, collection, dbController){
    var defer = q.defer();
    var handler = dbController || handler;
    console.log(handler);

    handler.find(key, collection, db)
    .then(function (res){
        defer.resolve(res);
    })
    .fail(function (err){
        defer.reject(err);
    });
    
    
    return defer.promise;
}

exports.createElement = function (element, dbController){
    var collection = 'web-elements';
    var handler = dbController || handler;
    console.log('ping');

    exports.lookFor('master', collection, dbController)
    .then(function (res){
        var search = res.body;
        if (search['collection'] == undefined) {
            console.log("STYX ALERT: No collection found!");
            console.log("STYX ACTION: Creating web-elements and master");

            element.stx_element = element._title;
            element = cleanPacket(element);

            handler.new(element, db)
            .then(function (res){
                console.log("STYX ACTION: New Element Created");
            })
            .fail(function (err){
                console.log("STYX ERROR: Could not add element");
            });
        } else {
            console.log("STYX ACTION: Creating new element");
            var master = appendMaster(element, search);

            handler.defUpdate('master', master, db)
            .then(function (res){
                // element.stx_element = element._title;
                // element = cleanPacket(element);
                // handler.new(handler, element)
                // .then(function (res){
                console.log("STYX ACTION: New Element Created");
                // })
                // .fail(function (err){
                //     console.log("STYX ERROR: Could not add element");
                //     defer.reject(err);
                // });
            })
            .fail(function (err){
                console.log("STYX ERROR: Could not add element");
            });
        }
    })
    .fail(function (err){
        console.log("STYX ALERT: No web-elements collection, creating now.");
        var master = appendMaster(element);
    });
}

function appendMaster (newEle, m){
    var master = m || {};
    var eleList = master['collection'] || [];
    var eleCount = eleList.length;

    eleList.push(newEle._title);
    master['collection'] = eleList;

    master[eleCount - 1] = cleanPacket(newEle);

    return master;
}

const requiredFields = {
    0:{ 'dbt' : 'element', 'pkt' : 'title' },
    1:{ 'dbt' : 'element', 'pkt' : 'title' }
};
function cleanPacket (packet){
    
    for (each in packet) {
        var rgx = /^[_]/;
        if (each.match(rgx)) delete packet[each];
    }

    return packet;
}