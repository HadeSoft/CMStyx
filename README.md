![CMStyx Logo](http://www.hadesoft.io/images/cmstyx_Logo.png)

Flexible Content Mangement System to help you keep your site upto date with ease.

![npm version](https://badge.fury.io/js/cmstyx.svg)
![npm dependencies](https://david-dm.org/HadeSoft/CMStyx.svg)
![github issues](https://img.shields.io/github/issues/HadeSoft/CMStyx.svg)

## Installation

```bash
$ npm install cmstyx
```

## Update Log

#### This is Beta Version 1, CMStyx is still under development and I will continue to add features and fix bugs

#### Please report any issues to the [github page](https://github.com/HadeSoft/CMStyx/issues)

This newest update has completly changed how the cms database is handled and is therefore not compatible with previous versions.
Before using this version I suggest that the current 'web-elements' collection is deleted as it could interfere with the new version.

### Patch Notes

Updates from Aug 19 V.II - Sep 1 V.XIV

  * Web UI for CMS controller
  * Ability to add element through the W.UI
  * Major database re-work
  * Modify current records through the W.UI
  * Elements can be removed through the W.UI
  * Login session tracked using cookies and secrets
  * Web UI for CMS login

## Quick start

CMStyx sits between the routes and the page render calls.
In order to setup the CMS it must finish building before routes are called.

##### App/Server.js

```js
var cms = require('cmstyx');

//Works off users express app
var express = require('express');
var app = express();

cms.build(app)
.then(function (cmsRoute){

	//Routes are handled after cmstyx has been initiated
	app.use('/', router);

	//Choose where the admin panel is accessed from e.g. '/admin'
	app.use('/admin', cmsRoute);
	//OR
	//Use the route from the settings.json
	app.use(cms.rootAddress, cmsRoute);

	app.listen(3000);
})
```

CMStyx will need to grab information from the database before the page is rendered.
To do this you will need to modify your routing functions:

##### Router.js

```js
var router = require('express').Router();
var cms = require('cmstyx');

router.get('/', function (req, res){
	var obj = { User Varibles to pass to page };

	cms.render(page, req, res, obj);	
})
```

The first time that CMStyx is run it will be in setup mode.
When visiting your choosen route you will be shown a settings form.

Once the form is submitted restart the server and CMStyx will run as normal, if all required settings have been changed.

### CMStyx Control Panel

By logging in to the CMS via your choosen route and password you will be redirected to the control panel.
From there you can create, remove and edit elements/records.
By starting a property name with an input type then an underscore: `color_picture`. The property will have the required input type in the editor.

###### *However files can not be modified once submitted, currently, they can only be added or removed and will not appear in the editor*

### Displaying elements in pages

When `cms.render()` is called it will grab elements from the database and append them to your current object.
The elements will be named `stx_YourElementName`. The element object will contain all of the records and a few stx properties e.g.
```js
stx_YourElementName : {
	[ { property1 : val1,
		property2 : val2,
		...       : ...,
		stx_element : 'YourElementName',
		stx_empty : false,
		stx_unique : 'Object Key In Database' },
	  { record2 },
	  { ... } ]
}
```

With this you can loop through the object and display the information with Jade e.g.
```jade
if stx_ELEMENT
	-var i = stx_ELEMENT.length;
	-for(var c = 0; c < i; c++)
		-var record = stx_ELEMENT[c];
		h2 record.title
		a(href=record.url) #{record.description}
```

## Extras

Once `cms.build()` has been run you can access the url of the cms using:

`var root = cms.rootAddress`

The handler used to query the database can also be accessed using:

`var handler = cms.dbController`