// global variable holding the lightfield rendering context
lf = {
	'image': null,
	'optics': {},
	'lenslets': {},

	'loaded': {}, // indexed by variable name
	'texture': {}, // GL texture cache; indexed by mode name

	'view3d': {
		'mouseSensitivity': 4.0,

		// OpenGL coordinate system (0.0 is the middle)
		'ofs_U': 0.0,
		'ofs_V': 0.0,
	}
};

// current rendering mode ('image' is source image / '3d' is rendered view)
mode = 'image';

function loadimage(imagepath) {
	// This method of asynchronous loading may be problematic if there
	// is still an outstanding request from previous loadimage(); FIXME
	lf.loaded = {
		"image": 0,
		"optics": 0,
		"lenslets": 0
	};
	lf.image = new Image();
	lf.image.crossOrigin = "anonymous";
	lf.image.onload = function() {
		lf.loaded.image = 1;
		render_if_ready(lf, 1);
	};
	/* Not supported yet :(
	lf.image.onloadstart = function() {
		alert("loading started! logging to console");
	};
	lf.image.onloadprogress = function(e) 
	{ 
		console.log(e.loaded);
	};
	lf.image.onloadend = function () {
		alert("Loading ended!");
	};*/
	lf.image.src = imagepath;
	lf.optics = {
		"pitch": Session.get("op_pitch"),
		"flen": Session.get("op_flen"),
		"mag": Session.get("op_mag"),
		"abbe": Session.get("op_abbe"),
		"na": Session.get("op_na"),
		"medium": Session.get("op_medium")
	};
	lf.loaded.optics = 1;
	lf.lenslets = {
		"offset": [Session.get("op_x_offset"), Session.get("op_y_offset")],
		"right": [Session.get("op_right_dx"), Session.get("op_right_dy")],
		"down": [Session.get("op_down_dx"), Session.get("op_down_dy")]
	};
	lf.loaded.lenslets = 1;
	render_if_ready(lf, 1);
}

function render_if_ready(lf, is_new_image) {
	console.log("loadimage " + lf.loaded.image + " " + lf.loaded.optics + " " + lf.loaded.lenslets);
	if (!lf.loaded.image || !lf.loaded.optics || !lf.loaded.lenslets)
		return;
	render(lf, is_new_image);
}

function newmode(newmode) {
	mode = newmode;
	document.getElementById("canvas-image").style.display = mode == "image" ? 'block' : 'none';
	document.getElementById("canvas-3d").style.display = mode == "3d" ? 'block' : 'none';
	document.getElementById("controls-lightfield").style.display = mode == "3d" ? 'block' : 'none';
}

function updateUV(delta_U, delta_V) {
	var newofs_U = lf.view3d.ofs_U + delta_U;
	var newofs_V = lf.view3d.ofs_V + delta_V;

	var rel_U = newofs_U / lf.lenslets.right[0];
	var rel_V = newofs_V / lf.lenslets.down[1];
	var UV_dist = rel_U * rel_U + rel_V * rel_V;
	var max_slope = maxNormalizedSlope(lf);
	if (UV_dist > max_slope * max_slope) {
		console.log(UV_dist + " > " + max_slope * max_slope)
		return;
	}

	lf.view3d.ofs_U = newofs_U;
	lf.view3d.ofs_V = newofs_V;
	render(lf, 0);
	updateUV_display();
}

function updateUV_display() {
	$('#U_current').html(parseFloat(lf.view3d.ofs_U).toFixed(2));
	$('#V_current').html(parseFloat(lf.view3d.ofs_V).toFixed(2));

	var canvas = document.getElementById("canvas-uvpos");
	var cuvpos = canvas.getContext("2d");
	cuvpos.clearRect(0, 0, canvas.width, canvas.height);

	var cradius = (canvas.width - 2) / 2;
	cuvpos.beginPath();
	cuvpos.arc(cradius + 1, cradius + 1, cradius, 0, 2 * Math.PI);
	cuvpos.stroke();

	var pos_x, pos_y;
	if (lf.optics != null && lf.lenslets != null) {
		var rel_U = lf.view3d.ofs_U / lf.lenslets.right[0];
		var rel_V = lf.view3d.ofs_V / lf.lenslets.down[1];
		var max_slope = maxNormalizedSlope(lf);
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
	updateUV((new_X - mousedrag_X) / lf.view3d.mouseSensitivity, -(new_Y - mousedrag_Y) / lf.view3d.mouseSensitivity);
	mousedrag_X = new_X;
	mousedrag_Y = new_Y;
}
