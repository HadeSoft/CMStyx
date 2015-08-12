var q = require('q');
var path = require('path');
var bodyParser = require('body-parser');
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

    if (conf.adminPassword == "password") {
        var setup = require('./lib/setup/establish.js');
        setup.initial();
        return false;
    } else {
        // SetupCMS(app);
        router(app);
        pm.connectTo();
    }
}

exports.render = function (page, req, res, opt) {
    GrabCmsElements()
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
