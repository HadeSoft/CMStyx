var q = require('q');
var path = require('path');
var bcrypt = require('bcrypt');

var conf = require('../../settings.json');
var pm = require('../data-handlers/post-master.js');
var pages = path.join(__dirname, '/views/');

// var pages = path.join(__dirname, 'views/');

module.exports = function (app) {
    app.get(conf.loginAdress, function (req, res){
        console.log("SDHWIF");
        res.render(pages + 'sign-in', {'message' : "PASSWORD"});
    });

    app.get(conf.loginAdress + '/modify/remove', function (req, res){
        pm.remove(req, res);
    });

    app.post(conf.loginAdress + '/login', function (req, res){
        var password = req.body.password;

        bcrypt.compare(password, conf.adminPassword, function (err, result){
            if (err) return console.error(err);
            if (result) {
                var opt = {
                    "title" : conf.websiteName,
                    "managedElements" : []
                };
                console.log(opt);

                pm.getCMSElements()
                .then(function (data){
                    console.log('STYX DATA : ')
                    var elements = Object.getOwnPropertyNames(data);
                    for (each in elements) {
                        var element = elements[each];
                        opt.managedElements.push(data[element]);
                    }

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
    });

    app.post(conf.loginAdress + '/modify/add/:element', function (req, res){
        var collection = req.params.element;

        pm.append(req, res, collection);
    });

    app.post(conf.loginAdress + '/modify/update/:element/:target', function (req, res){
    	var collection = req.params.element;
    	var target = req.params.target;
    	pm.rebuild(req, res, collection, target);
    });
}