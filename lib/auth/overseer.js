var bcrypt	= require('bcrypt');
var q		= require('q');

var conf	= require('../../settings.json');

exports.createToken = function (){
	var defer = q.defer();
		
	var secret = conf.superSecret;

	bcrypt.genSalt(10, function (err, salt){
		console.log("ST~ Creating new authenticated user");
		bcrypt.hash(secret, salt, function (err, hash){
			if (err) defer.reject(err);
			else defer.resolve(hash);
		});
	});

	return defer.promise;
}

exports.newLogin = function (res, token, expire){
	res.cookie('id', token, {
		httpOnly : true,
		maxAge : expire,
		path : conf.loginAdress + '/cmstyx-control'
	});

	console.log("SA~ New user authenticated");
}

exports.isAuthenticated = function (req){
	var defer = q.defer();

	console.log("SA~ Checking user");
	console.log(req.cookies);

	try {
		var userID = req.cookies.id;

		bcrypt.compare(conf.superSecret, userID, function (err, res){
			if (res) {
				defer.resolve();
			} else {
				defer.reject();
			}
		});
	} catch (e) {
		defer.reject();
	}
	
	return defer.promise;
}