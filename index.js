var express = require('express');
var q = require('q');
var path = require('path');
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');


var dbConnection = require('orchestrate');
dbConnection.ApiEndPoint = "api.ctl-gb3-a.orchestrate.io";


var conf = require('./settings.json');
var info = require('./package.json');

var router;
var pm = require('./lib/data-handlers/post-master');


var pages = path.join(__dirname, 'lib/routes/views/');


var db = dbConnection(conf.defaultDatabase.key);
/**
 * Holds the database handler if implemented
 */
var handler = 0;


exports.rootAddress = conf.loginAdress;
exports.dbController = handler;


exports.build = function (app, options) {
	
    var defer = q.defer();
	
	
    console.log("Running CMSTYX " + info.devVersion);
	
    app.use(bodyParser.urlencoded({
        extended: false
    }));
	
	
    var extrasPath = path.join(__dirname, 'lib/routes/public');


    app.use(express.static(extrasPath));


    if (conf.adminPassword == "CHANGEME" || conf.defaultDatabase.key == "CHANGEME" || conf.defaultDatabase.location == "CHANGEME" || conf.superSecret == "CHANGEME") {
		
        console.log("STYX ALERT : Change settings in settings.json or on '" + conf.loginAdress + "'");
		
        router = require('express').Router();
		
        var setup = require('./lib/setup/establish.js');
		
		
        // setup.initial();
        router.get('/', function (req, res){
            res.render(pages + 'wake');
        });


        router.post('/setup', function (req, res){
            var fallback = "CHANGEME";

            //OPTIONAL
            conf.websiteName = req.body.title || conf.websiteName;
            conf.loginAdress = req.body.root || conf.loginAdress;
            //REQUIRED
            var password = req.body.password || fallback;
            conf.defaultDatabase.key = req.body.apiKey || fallback;
            conf.defaultDatabase.location = req.body.location || fallback;
            conf.superSecret = req.body.secret || fallback;

            if (password != fallback) {
                bcrypt.genSalt(13, function (err, salt){
                    bcrypt.hash(password, salt, function (err, hash){
                        conf.adminPassword = hash;
                        setup.save(conf);
                        res.redirect('/');
                        exports.build(app, options);
                    });
                });
            }
        });


        defer.resolve(router);
		
    } else {
        pm.connectTo()
        .then(function (res){
            console.log("CA~ Running");
            handler = res;
            router = require('./lib/routes/router.js');
            router.database(handler);
            defer.resolve(router);
        });
    }

    return defer.promise;
}

/**
 * Handles all rendering requests over express
 */
exports.render = function (page, req, res, opt) {
    if (handler == 0) {
        res.render(page, opt)
    } else {
        pm.getCMSElements(handler)
        .then(function (data){
            if (data != 0) {
                var elements = Object.getOwnPropertyNames(data);
                for (each in elements) {
                    var element = elements[each];
                    opt['stx_' + element] = data[element];
                }
            }

            res.render(page, opt);
        })
        .fail(function (err){
            console.log(err);
        });
    }
}

function SetupCMS (app){
    app.use(session({
        secret : conf.sessionSecret,
        saveUninitialized : false,
        resave : true
    }));
    app.use(passport.initialize());
    app.use(passport.session());
}
