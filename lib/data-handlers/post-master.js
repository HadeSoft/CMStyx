var q = require('q');
var path = require('path');
var fmd = require('formidable');
var util = require('util');
var fse = require('fs-extra');

var conf = require('../../settings.json');

//default db used
var db = null;
//default handler used
var handler = null;

exports.test = function (){
	console.log("SA~ Testing Post Master");

	if (db == null && handler == null) console.log("SE~ Post Master not connected!");
	else if (handler == null) console.log("SE~ Data-handler not defined!");
	else if (db == null) console.log("SE~ Not connected to database");
	else console.log("SA~ Post Master is ready 'n' waiting...");
}

//dbc arg is used to pass a data-handler
exports.dbSet = function (dbc){
	handler = dbc;
	return 0;
}

//choice arg contains the target database in conf
exports.connectTo = function (choice){
	var defer = q.defer();

	var data_choice = choice || "defaultDatabase";
	console.log("ST~ Connecting to database: " + data_choice);

	try {
        var data_conf = conf[data_choice] || conf.defaultDatabase;
    } catch (e) {
        console.log("SE~ No database setup found in settings.json");
        defer.reject(e);
    }

    //Setup database and create handler
    handler = require('./handlers/' + data_conf.type);
    if (handler.alive) {

    	handler.setup(data_conf)
    	//Returns, connected to db
    	.then (function (newdb){
    		console.log("SA~ Successfully connected to database");

    		db = newdb;

    		defer.resolve(handler);
    	})
    	.fail(function (err){
    		console.log("SE~ Could not connect to database");

    		defer.reject(err);
    	});

    } else {
    	console.log("SE~ Unsupported database type / data-handler not found!");

    	defer.reject("Data-handler " + data_conf.type + " not found");
    }

    return defer.promise;
}

///Getting current Elements
exports.getCMSElements = function (dbc){
	var defer = q.defer();
	handler = dbc || handler;
	
	handler.grab(db)
	.then(function (res){

		defer.resolve(res);
	});
	
	return defer.promise;
}

///Creating an Element
//element arg
/*
{
	'prop1' : 'default1',
	'prop2' : 'default2',
	'etc' : ...,
	'_title' : 'element name'
}
*/
exports.createElement = function (element, dbc, res){
	const dbCollection = 'web-elements';
	const mKey = 'master';
	//fall back
	handler = dbc || handler;

	console.log("SA~ Creating new element " + element._title);

	//Look in database for object with specific key
	handler.find(mKey, dbCollection, db)
	//Returns found object
	.then(function (res){
		//Clean up res
		var search  = res.body

		console.log("resulr");
		console.log(search);
	})
	.fail(function (err){
		var master = {
			'collection' : [element._title],
			'0' : element
		};

		handler.add(master, db, mKey)
		.then(function (responce){
			console.log("SA~ New master has been created");
			res.redirect('/admin/cmstyx');
		})
		.fail(function (err){
			console.log(err);
			console.log("SE~ Could not create master");
		});
	});
}

///Generic handler calls
//Look in database for object with specific key
//key, key of object
//collection, which collection to look for the object in
exports.lookFor = function (key, collection, dbc){
	var defer = q.defer();
	//fall back
	handler = dbc || handler;

	handler.find(key, collection, db)
	//Returns found object
	.then(function (res){

		defer.resolve(res);
	})
	.fail(function (err){

		defer.resolve(args)
	});

	return defer.promise;
}

//Look in database for object/objects with query
//query, query to search database with
exports.lookWith = function (query, collection, dbc){
	var defer = q.defer();
	//fall back
	handler = dbc || handler;

	handler.search(query, collection, db)
	.then(function (res){

		defer.resolve(res);
	})
	.fail(function (err){

		defer.reject(err);
	});
	
	return defer.promise;
}

//Append to database
exports.append = function (req, res, collection, index, dbc){
	var form = new fmd.IncomingForm();
	handler = dbc || handler;

	form.parse(req, function (err, fields, files){
		req.query = fields;
	});

	form.on('end', function (fields, files){
		//temp file location
		var tempPath = this.openedFiles[0].path;
		//new file name
		var fileName = this.openedFiles[0].name;
		//new file location
		var newLocation = './images/stored-images/' + collection + '/' + fileName;

		//move file
		req.query.file_logo = newLocation;

		fse.move(tempPath, path.normalize(__dirname + '/../../../../public/' + newLocation), function (err){
			if (err) {
				var code = err.code;

				if (code != 'EEXIST') {
					console.log("SE~ Could not move file from temp location");
					return 0;
				}
			}

			console.log("ST~ File had been moved");
			var data = req.query;

			data.stx_element = collection;
			data.stx_position = index;

			//Add object to database
			handler.add(data, db, 0)
			.then(function (result){
				console.log("SA~ " + result + " has been added.");

				//Set object to fresh
				//JSON pointer notation
				var path = '/' + index + '/_fresh';
				handler.set('master', 'web-elements', path, false, db)
				.then(function (){
					res.redirect(conf.loginAdress + '/cmstyx-control');
				})
				.fail(function (err){
					console.log(err);
				});
			})
			.fail(function (err){
				console.log(err);
				console.log("SE~ Could not append database");

				res.redirect(conf.loginAdress + '/cmstyx-control');
			});
		});
	});
}

//Remove value and check for fresh
exports.remove = function (req, res, dbc){
	var defer = q.defer();
	//fall back
	handler = dbc || handler;
	
	//remove property
	handler.delete(req, res, db)
	.then(function (index){
		console.log(index);
		//If element is empty set fresh to true
		if (index == "Element removed") {
			console.log(index);
		} else {
			var path = '/' + index + '/_fresh';

			console.log(path);
			handler.set('master', 'web-elements', path, true, db)
			.then(function (res){
				defer.resolve();
			})
			.fail(function (err){
				console.log(err);
				defer.reject();
			});
		}
	})
	.fail(function (err){
		console.log(err);
		defer.reject();
	});
	
	return defer.promise;
}

//Update object values
exports.rebuild = function (req, res, target, dbc){
	//fall back
	handler = dbc || handler;

	var form = new fmd.IncomingForm();
	form.parse(req, function (err, fields, files){
		req.query = fields;

	    //Find elements to update
	    handler.compareRecords(req, res, db, target)
	    .then(function (result){
	    	//Update selected records
	        handler.update(req, res, db, result)
	        .then(function (){
	        	res.redirect(conf.loginAdress + '/cmstyx-control');
	        });

	    })
	    .fail(function (error){
	        console.log(error);
	    });
	});
}

//Remove element from master,
//Remove relevant records
exports.trim = function (res, element, dbc){
	//fall back
	handler = dbc || handler;

	handler.find('master', 'web-elements', db)
	.then(function (result){
		console.log(result.body);
		//Current master
		var master = result.body;
		var collection = master.collection;
		var count = collection.length;

		//If last element, remove collection
		if (count <= 1) {
			handler.burn(db);

			console.log("SA~ Collection removed");
			res.redirect(conf.loginAdress + '/cmstyx-control');
			return 0
		}

		//Remove element from collection
		var index = collection.indexOf(element);

		if (index == -1) return 0;
		collection.splice(index, 1);

		delete master[index];

		//Check if this is last element in stack
		if (index + 1 != count) {
			//If element is removed from the middle, collpase stack
			var i = index;
			var c = count - 1;

			while (i < count) {
				//Get displaced element
				var displaced = master[i + 1];
				//Remove displaced
				delete master[i + 1];
				//Collapse displaced
				master[i] = displaced;

				i++;
			}
		}

		console.log("NEW MASTER:");
		console.log(master);

		handler.add(master, db, 'master')
		.then(function (message){
			console.log("SA~ Master has been adjusted");

			//Get depracted records
			var query = "stx_element: " + element;
			handler.search(query, 'web-elements', db)
			.then(function (records){
				var recs = records.body.results;
				console.log(recs);
				var max = recs.length;
				var recInd = 0;

				//loop through each record
				while (recInd < max) {
					var record = recs[recInd];
					//record key
					var key = record.path.key;
					//remove record
					console.log("record");
					handler.qDel(key, db);

					recInd++;
				}

				res.redirect(conf.loginAdress + '/cmstyx-control');
			})
			.fail(function (err){
				console.log("SE~ Failed to remove records");
				console.log(err);
			});
		})
		.fail(function (err){
			console.log(err);
			console.log("SE~ Could not adjust master");
		});
	})
}