var mouseSensitivity = 4.0;

var ofs_U = 0.0, ofs_V = 0.0; // in OpenGL coordinate system
var mode;

var image, optics, lenslets;
var loaded = {}; // indexed by variable name

function loadimage(imagepath) {
	// This method of asynchronous loading may be problematic if there
	// is still an outstanding request from previous loadimage(); FIXME
	loaded = {
		"image": 0,
		"optics": 0,
		"lenslets": 0
	};
	image = new Image();
	image.src = imagepath; // MUST BE SAME DOMAIN!!!
	image.onload = function() {
		loaded.image = 1;
		render_if_ready();
	}
	optics = {
		"pitch": Session.get("op_pitch"),
		"flen": Session.get("op_flen"),
		"mag": Session.get("op_mag"),
		"abbe": Session.get("op_abbe"),
		"na": Session.get("op_na"),
		"medium": Session.get("op_medium")
	};
	loaded.optics = 1;
	lenslets = {
		"offset": [Session.get("op_x_offset"), Session.get("op_y_offset")],
		"right": [Session.get("op_right_dx"), Session.get("op_right_dy")],
		"down": [Session.get("op_down_dx"), Session.get("op_down_dy")]
	};
	loaded.lenslets = 1;
	render_if_ready();
}

function render_if_ready() {
	console.log("loadimage " + loaded.image + " " + loaded.optics + " " + loaded.lenslets);
	if (!loaded.image || !loaded.optics || !loaded.lenslets)
		return;
	render(image, 1);
}

function newmode(newmode) {
	mode = newmode;
	document.getElementById("canvas-image").style.display = mode == "image" ? 'block' : 'none';
	document.getElementById("canvas-lightfield").style.display = mode == "lightfield" ? 'block' : 'none';
	document.getElementById("controls-lightfield").style.display = mode == "lightfield" ? 'block' : 'none';
}

function updateUV(delta_U, delta_V) {
	newofs_U = ofs_U + delta_U;
	newofs_V = ofs_V + delta_V;

	var rel_U = newofs_U / lenslets.right[0];
	var rel_V = newofs_V / lenslets.down[1];
	var UV_dist = rel_U * rel_U + rel_V * rel_V;
	var max_slope = maxNormalizedSlope();
	if (UV_dist > max_slope * max_slope) {
		console.log(UV_dist + " > " + max_slope * max_slope)
		return;
	}

	ofs_U = newofs_U;
	ofs_V = newofs_V;
	render(image, 0);
	updateUV_display();
}

function updateUV_display() {
	$('#U_current').html(parseFloat(ofs_U).toFixed(2));
	$('#V_current').html(parseFloat(ofs_V).toFixed(2));

	var canvas = document.getElementById("canvas-uvpos");
	var cuvpos = canvas.getContext("2d");
	cuvpos.clearRect(0, 0, canvas.width, canvas.height);

	var cradius = (canvas.width - 2) / 2;
	cuvpos.beginPath();
	cuvpos.arc(cradius + 1, cradius + 1, cradius, 0, 2 * Math.PI);
	cuvpos.stroke();

	var pos_x, pos_y;
	if (optics != null && lenslets != null) {
		var rel_U = ofs_U / lenslets.right[0];
		var rel_V = ofs_V / lenslets.down[1];
		var max_slope = maxNormalizedSlope();
		pos_x = canvas.width / 2 + cradius * rel_U / max_slope;
		pos_y = canvas.height / 2 - cradius * rel_V / max_slope;
	} else {
		/* UV coordinates make no sense yet, just draw a point in the middle. */
		pos_x = canvas.width / 2;
		pos_y = canvas.height / 2;
	}
	cuvpos.beginPath();
	cuvpos.arc(pos_x, pos_y, 2, 0, Math.PI * 2, true);
	cuvpos.closePath();
	cuvpos.fill();
}

var mousedrag_X, mousedrag_Y;

function mousedrag(new_X, new_Y) {
	updateUV((new_X - mousedrag_X) / mouseSensitivity, -(new_Y - mousedrag_Y) / mouseSensitivity);
	mousedrag_X = new_X;
	mousedrag_Y = new_Y;
}
