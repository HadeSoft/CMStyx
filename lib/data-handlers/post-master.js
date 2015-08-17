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
                dbc.add(req, res, db, collection)
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