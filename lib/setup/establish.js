var bcrypt = require('bcrypt');

var details = require('../../package.json');

var settingsPath = '../../settings.json';
var settings;
var rl = require('readline');
var fse = require('fs-extra');

exports.initial = function (){
	console.log("Thank you for downloading \nCMStyx " + details.devVersion);
	var read = rl.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	read.question("To setup CMStyx: type 'SETUP'\n", function (ans){
		if (ans == "SETUP") {
			optionsMenu();
		}
	});

	function optionsMenu (){
		settings = require(settingsPath);
		console.log("\n\n\n\n\n\n\n\n\n\nFrom here you can change any settings:");
		var choices = [];
		var reference = [];
		
		var i = 1;
		for (each in settings) {
			if (each.charAt(0) != "_") {
				var option = each.split(/(?=[A-Z])/);
				var firstWord = option[0];
				delete option[0];
				var choice = firstWord.charAt(0).toUpperCase() + firstWord.slice(1) + option.join(' ');
				console.log(i + ". " + choice);

				choices.push(choice);
				reference.push(each);

				i++;
			}
		}

		read.setPrompt('STYX>> ');
		read.prompt();

		read.on('line', function (line){
			if (line > 0) {
				console.log("\n\n\n\n\n\n\n\n\n\nS~ " + choices[line - 1]);

				if (reference[line - 1] == "adminPassword") {
					newPassword();
				} else {
					read.question("S~ Current Value: " + settings[reference[line - 1]] + "     New Value: ", function (nVal){
						settings[reference[line - 1]] = nVal;
						commitChanges();
					});
				}
			}
		});
	}

	function newPassword (){
		if (settings.adminPassword == "password") {
			console.log("S~ You need to choose a new password!");
			read.question("S~ New Password: ", function (pass){
				bcrypt.genSalt(13, function (err, salt){
					bcrypt.hash(pass, salt, function (err, hash){
						settings.adminPassword = hash;
						commitChanges();
					});
				});
			});
		} else {
			read.question("S~ Old password: ", function (oldPass){
				bcrypt.compare(oldPass, settings.encryptSecret, function (err, res){
					if (!res) {
						console.log("S! Incorrect Password");
					} else {
						read.question("S~ New password: ", function (pass1){
							read.question("S~ Repeat password: ", function (pass2){
								if (pass1 == pass2) {
									bcrypt.genSalt(13, function (err, salt){
										bcrypt.hash(pass1, salt, function (err, hash){
											settings.adminPassword = hash;
											commitChanges();
										});
									});
								} else {
									console.log("S! Passwords don't match");
								}
							});
						});
					}
				});
			});
		}
	}

	function commitChanges (){
		fse.remove('node_modules/cmstyx/settings.json', function (err){
			if (err) return console.error(err);
			else {
				console.log('S~ settings removed');
				fse.outputJson('node_modules/cmstyx/settings.json', settings, {spaces: 4}, function (err){
					if (err) console.error(err);
					else {
						console.log('S~ settings recreated');
						optionsMenu();
					}
				});
			}
		});
	}
};