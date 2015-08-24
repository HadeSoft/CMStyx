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
var admin = true;

router.database = function (db){
    dbController = db;

    pm.dbSet(dbController);
    return 0;
}

router.get('/', function (req, res){
    res.render(pages + 'sign-in', {'message' : "PASSWORD", 'root' : conf.loginAdress});
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
            "managedElements" : []
        };

        pm.getCMSElements(dbController)
        .then(function (data){
            console.log('STYX DATA : ');
            console.log(data);

            opt.managedElements = data;
            console.log(opt);
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
            pm.createElement(packet, dbController);
        } else {
            console.log("fail...");
        }
    });
});

router.post('/modify/add/:element', function (req, res){
    var collection = req.params.element;

    pm.append(req, res, collection, dbController);
});

router.get('/modify/remove', function (req, res){
    pm.remove(req, res, dbController);
});

router.post('/modify/update/:element/:target', function (req, res){
    var collection = req.params.element;
    var target = req.params.target;
    pm.rebuild(req, res, collection, target, dbController);
});

module.exports = router;
