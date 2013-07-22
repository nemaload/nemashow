function LightFieldRenderer() {
	this.image = null;
	this.optics = {};
	this.lenslets = {};

	this.loaded = {}; // indexed by variable name
	this.texture = {}; // GL texture cache; indexed by mode name

	this.view3d = {
		'mouseSensitivity': 4.0,

		// OpenGL coordinate system (0.0 is the middle)
		'ofs_U': 0.0,
		'ofs_V': 0.0,

		'mousedrag_X': undefined,
		'mousedrag_Y': undefined
	}
};

LightFieldRenderer.prototype.loadimage = function(imagepath) {
	var obj = this;

	// This method of asynchronous loading may be problematic if there
	// is still an outstanding request from previous loadimage(); FIXME
	this.loaded = {
		"image": 0,
		"optics": 0,
		"lenslets": 0
	};
	$("#imageLoading" + Session.get("currentFrameIndex")).removeClass("notLoaded").addClass("loading");
	this.image = new Image();
	this.image.crossOrigin = "anonymous";
	this.image.onload = function() {
		obj.loaded.image = 1;
		obj.render_if_ready(1);
		$("#imageLoading" + Session.get("currentFrameIndex")).removeClass("notLoaded").removeClass("loading").addClass("loaded");
	};
	/* Not supported yet :(
	this.image.onloadstart = function() {
		alert("loading started! logging to console");
	};
	this.image.onloadprogress = function(e) 
	{ 
		console.log(e.loaded);
	};
	this.image.onloadend = function () {
		alert("Loading ended!");
	};*/
	this.image.src = imagepath;
	this.optics = {
		"pitch": Session.get("op_pitch"),
		"flen": Session.get("op_flen"),
		"mag": Session.get("op_mag"),
		"abbe": Session.get("op_abbe"),
		"na": Session.get("op_na"),
		"medium": Session.get("op_medium")
	};
	this.loaded.optics = 1;
	this.lenslets = {
		"offset": [Session.get("op_x_offset"), Session.get("op_y_offset")],
		"right": [Session.get("op_right_dx"), Session.get("op_right_dy")],
		"down": [Session.get("op_down_dx"), Session.get("op_down_dy")]
	};
	this.loaded.lenslets = 1;
	this.render_if_ready(1);
}

LightFieldRenderer.prototype.render_if_ready = function(is_new_image) {
	console.log("loadimage " + this.loaded.image + " " + this.loaded.optics + " " + this.loaded.lenslets);
	if (!this.loaded.image || !this.loaded.optics || !this.loaded.lenslets)
		return;
	this.render(is_new_image);
}

LightFieldRenderer.prototype.setUV = function(U, V) {
	var newofs_U = U;
	var newofs_V = V;

	var rel_U = newofs_U / this.lenslets.right[0];
	var rel_V = newofs_V / this.lenslets.down[1];
	var UV_dist = rel_U * rel_U + rel_V * rel_V;
	var max_slope = this.maxNormalizedSlope();
	if (UV_dist > max_slope * max_slope) {
		console.log(UV_dist + " > " + max_slope * max_slope)
		return;
	}

	this.view3d.ofs_U = newofs_U;
	this.view3d.ofs_V = newofs_V;
	this.render(0);
	this.updateUV_display();
}

LightFieldRenderer.prototype.updateUV = function(delta_U, delta_V) {
	this.setUV(this.view3d.ofs_U + delta_U, this.view3d.ofs_V + delta_V);
}

LightFieldRenderer.prototype.updateUV_display = function() {
	$('#U_current').html(parseFloat(this.view3d.ofs_U).toFixed(2));
	$('#V_current').html(parseFloat(this.view3d.ofs_V).toFixed(2));

	var canvas = document.getElementById("canvas-uvpos");
	var cuvpos = canvas.getContext("2d");
	cuvpos.clearRect(0, 0, canvas.width, canvas.height);

	var cradius = (canvas.width - 2) / 2;
	cuvpos.beginPath();
	cuvpos.arc(cradius + 1, cradius + 1, cradius, 0, 2 * Math.PI);
	cuvpos.stroke();

	var pos_x, pos_y;
	if (this.optics != null && this.lenslets != null) {
		var rel_U = this.view3d.ofs_U / this.lenslets.right[0];
		var rel_V = this.view3d.ofs_V / this.lenslets.down[1];
		var max_slope = this.maxNormalizedSlope();
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

LightFieldRenderer.prototype.mousedrag_set = function(new_X, new_Y) {
	this.view3d.mousedrag_X = new_X;
	this.view3d.mousedrag_Y = new_Y;
}
LightFieldRenderer.prototype.mousedrag = function(new_X, new_Y) {
	if (this.view3d.mousedrag_X) {
		this.updateUV((new_X - this.view3d.mousedrag_X) / this.view3d.mouseSensitivity,
			      -(new_Y - this.view3d.mousedrag_Y) / this.view3d.mouseSensitivity);
	}
	this.view3d.mousedrag_X = new_X;
	this.view3d.mousedrag_Y = new_Y;
}

LightFieldRenderer.prototype.maxNormalizedSlope = function() {
	/* Return the maximum slope afforded by the optical system */

	// ???
	var image_na = this.optics.na / this.optics.mag;
	if (image_na >= 1.0) return 0.0;
	var na_slope = image_na / Math.sqrt(1.0 - image_na * image_na);

	// slope of looking at a lens neighboring with central lens
	var ulens_slope = this.optics.pitch / this.optics.flen;

	return na_slope / ulens_slope;
}

LightFieldRenderer.prototype.lenslets_offset2corner = function() {
	/* Walk from the lenslets.offset point to the point of the grid
	 * nearest to the top left corner. */

	var lenslets = this.lenslets;
	var corner = lenslets.offset.slice();
	var changed;
	do {
		changed = false;
		if (corner[0] > lenslets.right[0] && corner[1] > lenslets.right[1]) {
			corner[0] -= lenslets.right[0];
			corner[1] -= lenslets.right[1];
			changed = true;
		}
		if (corner[0] > lenslets.down[0] && corner[1] > lenslets.down[1]) {
			corner[0] -= lenslets.down[0];
			corner[1] -= lenslets.down[1];
			changed = true;
		}
	} while (changed);
	/* FIXME: Note that we might get stuck at a point where we e.g. still have
	 * some room to go many steps up at the cost of going one step right. */

	console.log("lenslets " + JSON.stringify(lenslets) + " -> corner offset " + corner);

	return corner;
}


LightFieldRenderer.prototype.render = function(is_new_image) {
	//grabs the canvas element
	var canvas = document.getElementById("canvas-" + mode);
	//gets the WebGL context
	var gl = getWebGLContext(canvas);
	//checks if system is WebGL compatible
	if (!gl) {
		alert("WebGL not supported in this browser, sorry");
		return;
	}

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);

	if (mode == "image") {
		this.render_image(canvas, gl);
	} else {
		this.render_lightfield_pinhole(canvas, gl);
	}

	if (1) { // is_new_image) { TODO: <canvas> must persist re-renders for this to work properly
		if (this.texture[mode]) {
			gl.deleteTexture(this.texture[mode]);
		}
		this.texture[mode] = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture[mode]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
	} else {
		gl.bindTexture(gl.TEXTURE_2D, this.texture[mode]);
	}
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	//if (mode == "image" && $('#grid').prop('checked'))
	if (mode == "image" && $('#grid').hasClass('active'))
		this.render_grid(canvas, gl);
}

LightFieldRenderer.prototype.render_image = function(canvas, gl) {
	// compile shaders
	vertexShader = createShaderFromScriptElement(gl, "image-vertex-shader");
	fragmentShader = createShaderFromScriptElement(gl, "lf-image-fragment-shader");
	program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	// set(up) parameters
	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);
	var gammaGainLocation = gl.getUniformLocation(program, "u_gammaGain");
	gl.uniform2f(gammaGainLocation, parseFloat(Session.get("currentImageGamma")), Math.pow(10, parseFloat(Session.get("currentImageGain"))));

	var texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	setRectangle(gl, 0.0, 0.0, 1.0, 1.0);
	var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
	gl.enableVertexAttribArray(texCoordLocation);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

	var canvCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, canvCoordBuffer);
	setRectangle(gl, 0, 0, canvas.width, canvas.height);
	var canvCoordLocation = gl.getAttribLocation(program, "a_canvCoord");
	gl.enableVertexAttribArray(canvCoordLocation);
	gl.vertexAttribPointer(canvCoordLocation, 2, gl.FLOAT, false, 0, 0);
}

LightFieldRenderer.prototype.render_lightfield_pinhole = function(canvas, gl) {
	// compile shaders
	vertexShader = createShaderFromScriptElement(gl, "image-vertex-shader");
	fragmentShader = createShaderFromScriptElement(gl, "lf-pinhole-fragment-shader");
	program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var gridCorner = this.lenslets_offset2corner();
	var gridSize = {
		"width": Math.ceil(this.image.width / this.lenslets.right[0]),
		"height": Math.ceil(this.image.height / this.lenslets.down[1])
	};

	// set(up) parameters
	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);
	var gammaGainLocation = gl.getUniformLocation(program, "u_gammaGain");
	gl.uniform2f(gammaGainLocation, parseFloat(Session.get("currentImageGamma")), Math.pow(10, parseFloat(Session.get("currentImageGain"))));

	var gridSizeLocation = gl.getUniformLocation(program, "u_gridSize");
	gl.uniform2f(gridSizeLocation, gridSize.width, gridSize.height);
	var rectOffsetLocation = gl.getUniformLocation(program, "u_rectOffset");
	gl.uniform2f(rectOffsetLocation, gridCorner[0] / this.image.width, -gridCorner[1] / this.image.height);
	var rectLinearLocation = gl.getUniformLocation(program, "u_rectLinear");
	gl.uniformMatrix2fv(rectLinearLocation, false,
			[this.lenslets.right[0] / this.image.width,
			 this.lenslets.right[1] / this.image.height,
			 this.lenslets.down[0] / this.image.width,
			 this.lenslets.down[1] / this.image.height]);
	var UVCoordLocation = gl.getUniformLocation(program, "u_UVCoord");
	gl.uniform2f(UVCoordLocation, this.view3d.ofs_U / this.lenslets.right[0], this.view3d.ofs_V / this.lenslets.down[1]);

	var texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	setRectangle(gl, 0.0, 0.0, 1.0, 1.0);
	var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
	gl.enableVertexAttribArray(texCoordLocation);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

	var canvCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, canvCoordBuffer);
	setRectangle(gl, 0, 0, canvas.width, canvas.height);
	var canvCoordLocation = gl.getAttribLocation(program, "a_canvCoord");
	gl.enableVertexAttribArray(canvCoordLocation);
	gl.vertexAttribPointer(canvCoordLocation, 2, gl.FLOAT, false, 0, 0);
}

LightFieldRenderer.prototype.render_grid = function(canvas, gl) {
	var vertexShader = createShaderFromScriptElement(gl, "lf-grid-vertex-shader");
	var fragmentShader = createShaderFromScriptElement(gl, "lf-grid-fragment-shader");
	var program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var gridCorner = this.lenslets_offset2corner();
	var gridSize = {
		"width": Math.ceil(this.image.width / this.lenslets.right[0]),
		"height": Math.ceil(this.image.height / this.lenslets.down[1])
	};
	var lineList = new Array;
	for (var x = 0; x <= gridSize.width; x++) {
		lineList.push(gridCorner[0] + x * this.lenslets.right[0]);
		lineList.push(gridCorner[1] + x * this.lenslets.right[1]);
		lineList.push(gridCorner[0] + x * this.lenslets.right[0] + gridSize.height * this.lenslets.down[0]);
		lineList.push(gridCorner[1] + x * this.lenslets.right[1] + gridSize.height * this.lenslets.down[1]);
	}
	for (var y = 0; y <= gridSize.height; y++) {
		lineList.push(gridCorner[0] + y * this.lenslets.down[0]);
		lineList.push(gridCorner[1] + y * this.lenslets.down[1]);
		lineList.push(gridCorner[0] + y * this.lenslets.down[0] + gridSize.width * this.lenslets.right[0]);
		lineList.push(gridCorner[1] + y * this.lenslets.down[1] + gridSize.width * this.lenslets.right[1]);
	}

	var gridLinesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gridLinesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineList), gl.STATIC_DRAW);
	var canvCoordLocation = gl.getAttribLocation(program, "a_canvCoord");
	gl.enableVertexAttribArray(canvCoordLocation);
	gl.vertexAttribPointer(canvCoordLocation, 2, gl.FLOAT, false, 0, 0);

	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);

	gl.drawArrays(gl.LINES, 0, lineList.length / 2);
}
