var q = require('q');
var path = require('path');
var bcrypt = require('bcrypt');
var router = require('express').Router();

var conf = require('../../settings.json');
var pm = require('../data-handlers/post-master.js');
// var pages = path.join(__dirname, '/lib/views/');
// var setup = require('../setup/establish.js');

var pages = path.join(__dirname, 'views/');

router.get('/', function (req, res){
    res.render(pages + 'sign-in', {'message' : "PASSWORD"});
});

router.get('/modify/remove', function (req, res){
    pm.remove(req, res);
});

router.post('/login', function (req, res){
    var password = req.body.password;

    if (conf.adminPassword != 'password') {
        bcrypt.compare(password, conf.adminPassword, function (err, result){
            if (err) return console.error(err);
            if (result) {
                var opt = {
                    "title" : conf.websiteName,
                    "managedElements" : []
                };

                pm.getCMSElements()
                .then(function (data){
                    console.log('STYX DATA : ');
                    var elements = Object.getOwnPropertyNames(data);
                    for (each in elements) {
                        var element = elements[each];
                        opt.managedElements.push(data[element]);
                    }

                    res.render(pages + 'styx', opt);
                })
                .fail(function (err){
                    console.log(err);
                });
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
    }
});

router.post('/modify/add/:element', function (req, res){
    var collection = req.params.element;

    pm.append(req, res, collection);
});

router.post('/modify/update/:element/:target', function (req, res){
    var collection = req.params.element;
    var target = req.params.target;
    pm.rebuild(req, res, collection, target);
});

module.exports = router;
