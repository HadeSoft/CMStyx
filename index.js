var q = require('q');
var path = require('path');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
// var session = require('express-session');
// var passport = require('passport');
var dbConnection = require('orchestrate');
dbConnection.ApiEndPoint = "api.ctl-gb3-a.orchestrate.io";

var conf = require('./settings.json');
var info = require('./package.json');
var router;
var pm = require('./lib/data-handlers/post-master.js');
// var pp = require('./lib/passport/passportControls.js');
var pages = path.join(__dirname, 'lib/routes/views/');

var db = dbConnection(conf.defaultDatabase.key);
var handler = {};

exports.rootAddress = conf.loginAdress;

exports.build = function (app, options) {
    var defer = q.defer();
    console.log("Running CMSTYX " + info.devVersion);
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    if (conf.adminPassword == "CHANGEME" || conf.defaultDatabase.key == "CHANGEME" || conf.defaultDatabase.location == "CHANGEME") {
        console.log("STYX ALERT : Change settings in settings.json or on '/'");
        router = require('express').Router();
        var setup = require('./lib/setup/establish.js');
        // setup.initial();
        router.get('/', function (req, res){
            res.render(pages + 'wake');
        })

        router.post(conf.loginAdress + '/setup', function (req, res){
            var fallback = "CHANGEME";

            conf.websiteName = req.body.title || conf.websiteName;
            conf.loginAdress = req.body.root || conf.loginAdress;
            var password = req.body.password || fallback;
            if (password != fallback) {
                bcrypt.genSalt(13, function (err, salt){
                    bcrypt.hash(password, salt, function (err, hash){
                        conf.adminPassword = hash;
                        setup.save(conf);
                    });
                });
            }
            conf.defaultDatabase.key = req.body.apiKey || fallback;
            conf.defaultDatabase.location = req.body.location || fallback;

            setup.save(conf);
        });

        defer.resolve(router);
    } else {
        pm.connectTo()
        .then(function (res){
            console.log("CMSTYX ACTION : Running");
            handler = res;
            console.log(handler);
            router = require('./lib/routes/router.js');
            defer.resolve(router);
        });
    }

    return defer.promise;
}

exports.render = function (page, req, res, opt) {
    if (handler == {}) {
        res.render(page, opt)
    } else {
        pm.getCMSElements(handler)
        .then(function (data){
            console.log('STYX DATA : ');
            var elements = Object.getOwnPropertyNames(data);
            for (each in elements) {
                var element = elements[each];
                opt['stx_' + element] = data[element];
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
