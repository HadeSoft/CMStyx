var q = require('q');
var path = require('path');
var bcrypt = require('bcrypt');
var router = require('express').Router();

var conf = require('../../settings.json');
var pm = require('../data-handlers/post-master.js');
// var pages = path.join(__dirname, '/lib/views/');
// var setup = require('../setup/establish.js');

var pages = path.join(__dirname, 'views/');

var dbController = 0;
var admin = false;

router.database = function (db){
    dbController = db;

    pm.dbSet(dbController);
    return 0;
}

router.get('/', function (req, res){
    res.render(pages + 'sign-in', {
        'message' : "PASSWORD",
        'root' : conf.loginAdress,
        'title' : conf.websiteName
    });
});

router.post('/login', function (req, res){
    var password = req.body.password;
    var secret = conf.superSecret;

    if (conf.adminPassword != 'password') {
        bcrypt.compare(password, conf.adminPassword, function (err, result){
            if (err) return console.error(err);
            if (result) {
                admin = true;
                res.redirect(conf.loginAdress + '/cmstyx-control');
            } else {
                res.redirect(conf.loginAdress);
            }
        });
    } else {
        bcrypt.genSalt(13, function (err, salt){
            bcrypt.hash(password, salt, function (err, hash){
                conf.adminPassword = hash;
                setup.save(conf);
            });
        });
    }0
});

router.get('/cmstyx-control', function (req, res){
    if (admin) {
        var opt = {
            "title" : conf.websiteName,
            "managedElements" : {}
        };

        pm.getCMSElements(dbController)
        .then(function (data){
            console.log('STYX DATA : ');
            console.log(data);
            opt.managedElements = data;
            res.render(pages + 'styx', opt);
        })
        .fail(function (err){
            console.log(err);
        });
    } else {
        res.redirect(conf.loginAdress);
    }
});

router.post('/modify/new', function (req, res){
    var packet = req.body;
    var eleName = packet._title;
    var table = 'web-elements';
    var query = 'value.stx_element: ' + eleName;
    console.log(query);

    pm.lookWith(query, table, dbController)
    .then(function (res){
        var search = res.body.results;
        if (search.length == 0) {
            pm.createElement(packet, dbController, res);
        } else {
            console.log("Issues are happening :(");
        }
    });
});

router.post('/modify/add/:element/:index', function (req, res){
    var collection = req.params.element;
    var eleIndex = req.params.index;

    pm.append(req, res, collection, eleIndex, dbController);
});

router.get('/modify/remove', function (req, res){
    pm.remove(req, res, dbController)
    .then(function (){
        res.redirect(conf.loginAdress + '/cmstyx-control');
    })
    .fail(function (){
        res.redirect(conf.loginAdress + '/cmstyx-control');
    });
});

router.post('/modify/update/:target', function (req, res){
    var target = req.params.target;
    pm.rebuild(req, res, target, dbController);
});

router.get('/modify/delete/:target', function (req, res){
    var target = req.params.target;
    pm.trim(res, target, dbController);
});

module.exports = router;
