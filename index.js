var q = require('q');
var path = require('path');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
// var session = require('express-session');
// var passport = require('passport');
var dbConnection = require('orchestrate');
dbConnection.ApiEndPoint = "api.ctl-gb3-a.orchestrate.io";

var conf = require('./settings.json');
var router  = require('./lib/routes/router.js');
var pm = require('./lib/data-handlers/post-master.js');
// var pp = require('./lib/passport/passportControls.js');
var pages = path.join(__dirname, 'views/');

var db = dbConnection(conf.defaultDatabase.key);

exports.build = function (app, options) {
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    if (conf.adminPassword == "CHANGEME" || conf.defaultDatabase.key == "CHANGEME" || conf.defaultDatabase.location == "CHANGEME") {
        var setup = require('./lib/setup/establish.js');
        // setup.initial();
        app.get('/', function (req, res){
            res.render(pages + 'wake');
        })

        app.post(conf.loginAdress + '/setup', function (req, res){
            conf.websiteName = req.body.title;
            conf.loginAdress = req.body.root;
            bcrypt.genSalt(13, function (err, salt){
                bcrypt.hash(req.body.password, salt, function (err, hash){
                    conf.adminPassword = hash;
                    setup.save(conf);
                });
            });
            conf.defaultDatabase.key = req.body.apiKey;
            conf.defaultDatabase.location = req.body.location;

            setup.save(conf);
        });

        return false;
    } else {
        pm.connectTo();
        router(app);
    }
}

exports.render = function (page, req, res, opt) {
    pm.getCMSElements()
    .then(function (data){
        console.log('STYX DATA : ')
        var elements = Object.getOwnPropertyNames(data);
        for (each in elements) {
            var element = elements[each];
            // console.log(element);
            opt['stx_' + element] = data[element];
        }

        console.log(opt);
        res.render(page, opt);
    })
    .fail(function (err){
        console.log(err);
    });
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
