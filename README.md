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

- Changes to master object in database. (see backend step 3)

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

## Creating an element
#### This is a temporary solution until the web UI is finished

### Backend
For CMStyx to work you will need a orchestrate database (free accounts are availble)

1. Log in to the orchestrate dashboard,
2. Create a new collection named: *web-elements*,
3. Insert a *control* object. This will contain an array of all the dynamic elements you add.
	It needs to have the key : *master*
	and body :
	```
	{
		"collection" : ["name of element"]
	}
	```
4. Now you can create the content for your element in the same collection.
	The object can contain as many properties as you wish, but it must contain the property
	```
	"stx_element" : "name of element"
	```
	If you wish to have a specific input type for a property then name it: `typeofinput_nameofproperty` e.g.
	```
	file_picture //allows uploading of files to server
	color_border //provides color picker in web UI
	```
5. Once one object has been added you can use the CMStyx web UI to append new ones to the element

### Web UI

The Web UI will create a table for each element in the database
From there you can add, remove and modify the properties of the element

*The Web UI will allow you to add and remove files but they cannot currently be modified*

Once a value has been changed the page needs to be refreshed before they change in the table.


# API

## Basics

#### `cms.build(app, options)`

###### defered by Q

Initiates CMStyx, also loads into either *SETUP* or *RUNNING* mode.
`app` = express()
`options` = Anything you want doesn't do anything

During the build, if *RUNNING*, `post-master` is also started which connects to your database.
Q will resolve with a router object independent on which mode CMStyx is in.

##### SETUP mode
Routes handled:
get `/admin` for changing settings
post `/setup` for catching changed settings

issues

######404 after submitting new settings

Restart server

######Stuck in *SETUP* mode

Restart server

######Fails to remove/recreate settings

Check if settings.json exists in node_modules/cmstyx
If not create settings.json and fill with:
```json
{
    "websiteName": "WEBSITE1",
    "loginAdress": "/admin",
    "adminPassword": "CHANGEME",
    "superSecret": "CHANGEME",
    "defaultDatabase": {
        "key": "CHANGEME",
        "location": "CHANGEME",
        "type": "orchestrate",
        "dependencies": [
            "orchestrate"
        ]
    },
    "customDatabase": 0
}
```

##### RUNNING mode

Routes handled by lib/routes/router.js

issues
All modules are active from this point on
This will be appended to as problems are reported


#### `cms.render(page, req, res, opt)`

If `post-master` has not been started yet (render run before build) then this will default to normal express rendering.
Uses `pm.getCMSElements` to get element properties from database then appends them to `opt`

`page` name of jade file to render
`req` express request
`res` express response
`opt` varibles object to add to template


#### `cms.rootAddress`

Returns the defined root the web UI runs from.


#### `cms.dbController`

Returns the database handler used by `post-master`

##Database

CMStyx uses one collection in the database
The master object holds an array of all of the elements as well as the default values

```json
{
	'collection' : [elementTitle, elementTitle],
	'0' : {
		'prop1' : 'default1',
		'prop2' : 'default2',
		'_fresh' : boolean,
		'_name' : ref to 'collection'
	}
}
```

Each time a new record is added to an element a new object is created

```json
{
	'prop1' : 'val1',
	'prop2' : 'val2',
	'stx_element' : '_name'
}
```