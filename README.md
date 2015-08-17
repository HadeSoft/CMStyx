# CMStyx
## About
CMStyx is a content management system allowing web-admins to control page content from a web ui. This saves time rewriting jade and gives the ability to create dynamic elements interfacing with a database.

## How?
CMStyx sits between the user defined routes and the res.render calls.
Before the page is sent to the user CMStyx grabs the relevant data from your database and
provides it to the jade template.
The object can then be used how ever you wish to fill in your web page.

CMStyx also provides a web UI for admins in order to modify cms-elements on the fly.

### TODO:
- Add new cms-elements from web UI
- User Interface update

## Update
This package is still in development.
*CMStyx currently only supports orchestrate databases*
The current version is functional on [hadesoft](http://www.hadesoft.io). If you are having any problems getting it running feel free to  open an issue on [github](https://github.com/HadeSoft/CMStyx/issues)

![CMStyx logo](http://www.hadesoft.io/images/cmstyx_Logo.png)
## Getting Started
`var cms = require('cmstyx')`

CMStyx needs to finish building before routes can be passed to the app/server.

```javascript
var app = express();

/* MIDDLEWARE */

cms.build(app)
.then(function (cmsRoute){
	app.use('/', router);
	app.use(cms.rootAddress, cmsRoute);

	app.listen(port);
	module.exports = app;
});
```

In the user defined router file replace the express render:
```javascript
router.get('/', function (req, res){
	res.render('page', object);
});
```

With the CMS intercept:
```javascript
var cms = require('cmstyx');

router.get('/', function (req, res){
	cms.render('page', req, res, object);
})
```

The server is now ready to run.
The first time CMStyx is run it will run in *setup* mode.
1. By navigating to `www.yourwebsite.com/admin` you will be presented with a list of questions to fill out.
2. Complete, at least, the stared questions and submit the form
3. The server will log that the settings have been recreated
4. Restart the server. If you completed all the stared questions CMStyx will start in *Running* mode. (If you missed any questions it will start in *setup* mode again).
5. Your website is now up and running
