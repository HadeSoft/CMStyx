var open = false;
function ExpandPanel (){
	if (!open) {
		open = true;
		$('#expander').addClass('open-panel');
		$('#indicator h2').text('>');
	} else {
		open = false;
		$('#expander').removeClass('open-panel');
		$('#indicator h2').text('<');
	}
}

var visibleInput = false;
var prevTarget = "";
function SwitchToTitleInput (target){
	prevTarget = target || prevTarget;
	var inputForm_HTML = "<input id='current-add' type='text' class='gen-add-control' placeholder='New Element Name' />";
	if (!visibleInput) {
		visibleInput = true;
		$(target).html(inputForm_HTML);
		document.getElementById("current-add").focus();
		UpdateAddBindings();
	} else {
		var default_HTML = "<a href='javascript:void(0)' onclick='SwitchToTitleInput(&quot;" + prevTarget + "&quot;)'><h3>+</h3></a>";
		visibleInput = false;
		$(prevTarget).html(default_HTML);
	}
}

function UpdateAddBindings (){
	$('.gen-add-control').focusout(function(event) {
		SwitchToTitleInput();
	});
	$('.gen-add-control').keypress(function (e){
		var key = e.which;
		if (key == 13) {
			var elementName = $('#current-add').val();
			NewElement(elementName)
		}
	});
}

//////////////Create New Element
var ELEMENT = function (name){
	this._elementTitle = name;
	var th = "";
	var t1 = "";
	var t2 = "";

	this._inpRow = ["<th>New Property</th>", "<td><input id='current-header' type='text' placeholder='Name'></td><td id='prop-feedback'></td>", "<td><input id='current-default' type='text' placeholder='default value'></td><td><input type='button' value='+' onclick='NewProperty()' /></td>"];

	this._Row = function (prop){

		th += this._inpRow[0];
		t1 += this._inpRow[1];
		t2 += this._inpRow[2];
	};
	this._AdvRow = function (prop){
		var newRow = ["<th>" + prop + "</th>", "<td></td>", "<td></td>"];
		th = newRow[0] + th;
		t1 = newRow[1] + t1;
		t2 = newRow[2] + t2;
	};

	this._Table = function (){
		var table = "<article id='element-" + this._elementTitle + "' class='element'><h2>" + this._elementTitle + "</h2><table id='new-element'><tr>" + th + "</tr><tr>" + t1 + "</tr><tr>" + t2 + "</tr></table><input type='button' value='Confirm' onclick='SendElement()'/></article>";
		return table;
	};
	this._append = "<form class='appendor' method='post' enctype='multipart/form-data' action='./modify/add/" + this._elementTitle + "'></form>";

	this._props = [];
	this._packet = {
		'_title' : name,
		'_fresh' : true
	};

	console.log("new element");
}

var elements = [];
function CurrentElements (obj){
	var eleCount = obj.length;
	var c = 0;

	while (c < eleCount) {
		c++;
		elements.push(obj[0][0].stx_element);
	}
}

var rgx = /^([a-zA-Z])([\w-])*/;
var element = "";
function NewElement (name){
	if (rgx.test(name) == false) return false;

	if (element != "") {
		$('#element-' + element._elementTitle).remove();
		element = "";
	}

	for (each in elements) {
		if (elements[each] == name) return false;
	}

	element = new ELEMENT(name);
	element._Row();
	$('#elements-holder').append(element._Table());
	SwitchToTitleInput();
}

function NewProperty (){
	var propName = $('#current-header').val();
	var propDef = $('#current-default').val();
	var index = element._props.length;
	console.log(element[propName]);

	if (rgx.test(propName) == false) {
		newIssue("Must start with letter and only contain letters, 0-9, _, -");
	} else if (element._packet[propName] == undefined) {
		newIssue("");
		element._packet[propName] = propDef;
		element._packet
		element._props.push(propName);
		element._AdvRow(propName);
		$('#element-' + element._elementTitle).remove();
		$('#elements-holder').append(element._Table());
	} else {
		newIssue("Unique Properties Only!");
	}
}

function SendElement (){
	if (element._props.length > 0) {
		console.log(element);
		element._packet._props = element._props;
		console.log(element._packet);
		console.log(jQuery.isPlainObject(element._packet));
		$.post("./modify/new", element._packet, function (result){
			$('#element-' + element._elementTitle).remove();
			location.reload();
		});
	} else {
		console.log('Not any new properties');
	}
}

function newIssue (issue){
	$('#prop-feedback').text(issue);
	return 0;
}