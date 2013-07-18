function LightSheetRenderer() {
	this.filedata = {};
	this.group = null;

	// group loading lifetime: last_group (init) -> group_load_queue (queued) -> loading_group (loading) -> group (loaded)
	// queue of group loads to run after current group finishes loading
	this.group_load_queue = [];
	// last group requested by the user
	this.last_group = null;
	// group currently being loaded
	this.loading_group = null;

	// GL texture cache; indexed by mode name and channel#
	this.imageTexture = {};
	this.zTexture = {};

	this.view3d = {
		// OpenGL coordinate system (0.0 is the middle)
		'ofs_Z': 0.0,
		'ofs_U': 0.0,
		'ofs_V': 0.0,

		'mouseSensitivity': 100.0,
		'ofs_Z_step': 0.05, // TODO: recomputed later for particular metadata
		'ofs_UV_step': 0.05,
		'observerDistance': 1.0, // distance of the observer from the z=0 plane
		// note that the z=0 plane is placed in the middle of the image z-coords

		'mousedrag_X': undefined,
		'mousedrag_Y': undefined
	};
};

var ls_baseurl = 'http://nemaload.cachefly.net/lightsheet/';

LightSheetRenderer.prototype.loadimage = function(paths) {
	if (this.last_group && !this.last_group.loaded())
		this.last_group.cancel_queued_load();
	this.last_group = new GroupImage(this, paths);
}

LightSheetRenderer.prototype.render_if_ready = function(is_new_image) {
	if (this.group)
		this.group.render_if_ready(is_new_image);
};
LightSheetRenderer.prototype.render = function(is_new_image) {
	if (this.group)
		this.group.render(is_new_image);
};

LightSheetRenderer.prototype.runGroupLoadQueue = function() {
	console.log(this.group_load_queue.length + " group loads to run, current group " + (this.group && this.group.paths) + " loading_group " + (this.loading_group && this.loading_group.paths) + " loading = " + !!(this.loading_group && !this.loading_group.loaded()));
	if (this.group_load_queue.length == 0 || (this.loading_group && !this.loading_group.loaded()))
		return; // nothing to run or we should wait still
	var toload = this.group_load_queue.shift();
	toload.load();
}

LightSheetRenderer.prototype.updateZ = function(delta_Z) {
	var newofs_Z = this.view3d.ofs_Z + delta_Z;
	if (newofs_Z < this.group.metadata.framedata[0].z || newofs_Z >= this.group.metadata.framedata[this.group.metadata.framedata.length - 1].z)
		return;

	this.view3d.ofs_Z = newofs_Z;
	$('#Z_current').html(parseFloat(this.view3d.ofs_Z).toFixed(2));

	this.group.render(0);
}

LightSheetRenderer.prototype.updateUV = function(delta_U, delta_V) {
	var newofs_U = this.view3d.ofs_U + delta_U;
	var newofs_V = this.view3d.ofs_V + delta_V;

	this.view3d.ofs_U = newofs_U;
	this.view3d.ofs_V = newofs_V;
	$('#U_current').html(parseFloat(this.view3d.ofs_U).toFixed(2));
	$('#V_current').html(parseFloat(this.view3d.ofs_V).toFixed(2));

	this.render(0);
}

LightSheetRenderer.prototype.mousedrag_set = function(new_X, new_Y) {
	this.view3d.mousedrag_X = new_X;
	this.view3d.mousedrag_Y = new_Y;
}
LightSheetRenderer.prototype.mousedrag = function(new_X, new_Y) {
	if (this.view3d.mousedrag_X) {
		this.updateUV((new_X - this.view3d.mousedrag_X) / this.view3d.mouseSensitivity,
			      -(new_Y - this.view3d.mousedrag_Y) / this.view3d.mouseSensitivity);
	}
	this.view3d.mousedrag_X = new_X;
	this.view3d.mousedrag_Y = new_Y;
}


function GroupImage(ls, paths) {
	this.ls = ls;
	this.paths = paths;

	// Loaded asynchronously
	this.images = [null, null]
	this.metadata = null

	if (paths[0])
		this.load(paths);
}

GroupImage.prototype.load = function(paths) {
	var g = this;
	this.ls.group_load_queue.push({'paths': paths, 'load': function() {
		g.ls.loading_group = g;
		g.loadDo(paths);
	}});
	this.ls.runGroupLoadQueue(); // try loading if it's the right moment
}

GroupImage.prototype.loadDo = function(paths) {
	var g = this;

	var image_loading = new Array;
	$("#imageLoading" + Session.get("currentFrameIndex")).removeClass("notLoaded").addClass("loading");
	for (var i = 0; i < 2; i++) {
		image_loading[i] = new Image();
		image_loading[i].crossOrigin = "anonymous";
		image_loading[i].src = ls_baseurl + paths[i] + "/png";
		console.log('gi load ' + i + ': ' + paths[i] + "/png");
		// this funky embedded closure call makes sure @i has
		// the current value within the onload closure :)
		image_loading[i].onload = (function(i) { return function() {
			console.log('gi got image ' + i + ': ' + image_loading[i]);
			g.images[i] = image_loading[i];
			g.render_if_ready(1);
		}; })(i);
	}
	$("#imageLoading" + Session.get("currentFrameIndex")).removeClass("notLoaded").removeClass("loading").addClass("loaded");

	// we assume metadata is the same for both channels
	var metadatapath = ls_baseurl + paths[0] + "/json";
	$.getJSON(metadatapath, function(data) {
		console.log('gi got metadata');
		g.metadata = data;

		if (g.ls.view3d.ofs_Z < 0.01) // i.e., unset yet
			g.setupZ();

		g.render_if_ready(1);
	});
};

GroupImage.prototype.render_if_ready = function(is_new_image) {
	if (!this.loaded())
		return;

	// this is the currently displayed group!
	this.ls.group = this;
	// we have everything here, continue processing the queue
	this.ls.runGroupLoadQueue();

	// we finally have everything, proceed!
	this.render(is_new_image);
};
GroupImage.prototype.loaded = function() {
	console.log('loaded ' + this.images[0] + ' ' + this.images[1] + ' ' + this.metadata);
	return this.images[0] && this.images[1] && this.metadata;
}
GroupImage.prototype.cancel_queued_load = function() {
	// Loading us is not needed anymore if we are still waiting
	// for that.
	var g = this;
	console.log("cancelling load of " + g.path);
	this.ls.group_load_queue = this.ls.group_load_queue.filter(function(e,i,a) {
		return e.paths[0] != g.paths[0] || e.paths[1] != g.paths[1];
	});
};

GroupImage.prototype.setupZ = function() {
	/* After loading metadata, update a variety of stuff related
	 * to the Z-coordinate. */
	this.ls.view3d.ofs_Z = this.metadata.framedata[Math.floor(this.metadata.framedata.length / 2)].z;
	$('#Z_current').html(parseFloat(this.ls.view3d.ofs_Z).toFixed(2));
};

GroupImage.prototype.render = function(is_new_image) {
	//grabs the canvas element
	var canvas = document.getElementById("canvas-" + mode);
	//gets the WebGL context
	var gl = getWebGLContext(canvas);
	//checks if system is WebGL compatible
	if (!gl) {
		alert("WebGL not supported in this browser, sorry");
		return;
	}

	gl.getExtension("OES_texture_float");
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);

	var program;
	if (mode == "image") {
		program = this.render_slice(canvas, gl);
	} else {
		program = this.render_lightsheet(canvas, gl);
	}

	var textureIds = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2];

	if (is_new_image) {
		for (var i = 0; i < 2; i++) {
			if (this.ls.imageTexture[mode] == null)
				this.ls.imageTexture[mode] = new Array;
			if (this.ls.imageTexture[mode][i])
				gl.deleteTexture(this.ls.imageTexture[mode][i]);
			this.ls.imageTexture[mode][i] = gl.createTexture();
			gl.activeTexture(textureIds[i]);
			gl.bindTexture(gl.TEXTURE_2D, this.ls.imageTexture[mode][i]);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.images[i]);
		}

		var z_max = this.metadata.framedata[this.metadata.framedata.length - 1].z;
		var z_focal = (this.metadata.framedata[0].z + z_max) / 2;
		var z_data = new Array;
		for (var i = 0; i < this.metadata.framedata.length; i++)
			z_data[i] = -(this.metadata.framedata[i].z - z_focal) / z_max;

		/* Alas, TEXTURE_1D is not supported by WebGL. */
		if (this.ls.zTexture[mode]) {
			gl.deleteTexture(this.ls.zTexture[mode]);
		}
		this.ls.zTexture[mode] = gl.createTexture();
		gl.activeTexture(textureIds[2]);
		gl.bindTexture(gl.TEXTURE_2D, this.ls.zTexture[mode]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE,
				z_data.length, 1,
				0, gl.LUMINANCE, gl.FLOAT,
				new Float32Array(z_data));
	}

	var imageLocation = gl.getUniformLocation(program, "u_image0");
	gl.uniform1i(imageLocation, 0);
	var imageLocation = gl.getUniformLocation(program, "u_image1");
	gl.uniform1i(imageLocation, 1);
	var zdataLocation = gl.getUniformLocation(program, "u_zdata");
	gl.uniform1i(zdataLocation, 2);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	if (mode == "3d" && $('#box').prop('checked'))
		this.render_box(canvas, gl);
}

GroupImage.prototype.render_slice = function(canvas, gl) {
	// compile shaders
	vertexShader = createShaderFromScriptElement(gl, "image-vertex-shader");
	fragmentShader = createShaderFromScriptElement(gl, "ls-slice-fragment-shader");
	program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var n_slices = this.metadata.framedata.length;
	// find the slices corresponding to our z-coord
	var z_slice = 0;
	for (var i = 1; i < n_slices; i++) {
		if (this.metadata.framedata[i].z > this.ls.view3d.ofs_Z) {
			z_slice = i - 1;
			break;
		}
	}
	var frame0 = this.metadata.framedata[z_slice], frame2 = this.metadata.framedata[z_slice + 1];

	// set(up) parameters
	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);
	var gammaGainLocation = gl.getUniformLocation(program, "u_gammaGain");
	gl.uniform2f(gammaGainLocation, parseFloat(Session.get('currentImageGamma')), Math.pow(10, parseFloat(Session.get('currentImageGain'))));
	var zSlicesLocation = gl.getUniformLocation(program, "u_zSlices");
	gl.uniform2f(zSlicesLocation, z_slice, n_slices);
	var z0z1z2Location = gl.getUniformLocation(program, "u_z0z1z2");
	gl.uniform3f(z0z1z2Location, frame0.z, this.ls.view3d.ofs_Z, frame2.z);

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

	// also update some status values
	$('#Z_i').html(z_slice);
	$('#t').html(parseFloat(frame0.t).toFixed(0) + ", " + parseFloat(frame2.t).toFixed(0));
	$('#Z_m').html(parseFloat(frame0.z).toFixed(3) + ", " + parseFloat(frame2.z).toFixed(3));
	$('#Z_r').html(parseFloat(frame0.z_r).toFixed(3) + ", " + parseFloat(frame2.z_r).toFixed(3));

	return program;
}

GroupImage.prototype.render_lightsheet = function(canvas, gl) {
	// compile shaders
	vertexShader = createShaderFromScriptElement(gl, "image-vertex-shader");
	fragmentShader = createShaderFromScriptElement(gl, "ls-3d-fragment-shader");
	program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var n_slices = this.metadata.framedata.length;

	// set(up) parameters
	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);
	var gammaGainLocation = gl.getUniformLocation(program, "u_gammaGain");
	gl.uniform2f(gammaGainLocation, parseFloat(Session.get('currentImageGamma')), Math.pow(10, parseFloat(Session.get('currentImageGain'))));
	var zSlicesLocation = gl.getUniformLocation(program, "u_zSlices");
	gl.uniform2f(zSlicesLocation, 0 /* TODO */, n_slices);

	var UVOCoordLocation = gl.getUniformLocation(program, "u_UVOCoord");
	gl.uniform3f(UVOCoordLocation, this.ls.view3d.ofs_U, this.ls.view3d.ofs_V, this.ls.view3d.observerDistance);
	var perspectiveLocation = gl.getUniformLocation(program, "u_perspective");
	gl.uniform1f(perspectiveLocation, $('#perspective').prop('checked') ? 1.0 : 0.0);

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

	return program;
}

GroupImage.prototype.render_box = function(canvas, gl) {
	console.log("box render");

	var vertexShader = createShaderFromScriptElement(gl, "ls-box-vertex-shader");
	var fragmentShader = createShaderFromScriptElement(gl, "ls-box-fragment-shader");
	var program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var n_slices = this.metadata.framedata.length;
	var z_max = this.metadata.framedata[n_slices - 1].z;
	var z_focal = (this.metadata.framedata[0].z + z_max) / 2;
	var boxCorners =
		[[parseFloat(document.getElementById("box-x0").value) / this.images[0].width,
		  parseFloat(document.getElementById("box-y0").value) / (this.images[0].height / n_slices),
		  parseFloat(document.getElementById("box-z0").value) / z_max - z_focal / z_max],
		 [parseFloat(document.getElementById("box-x1").value) / this.images[0].width,
		  parseFloat(document.getElementById("box-y1").value) / (this.images[0].height / n_slices),
		  parseFloat(document.getElementById("box-z1").value) / z_max - z_focal / z_max]];
	var lineList = [
		/* corner 0,0,0 */
		boxCorners[0][0], boxCorners[0][1], boxCorners[0][2],
		boxCorners[0][0], boxCorners[0][1], boxCorners[1][2],
		boxCorners[0][0], boxCorners[0][1], boxCorners[0][2],
		boxCorners[0][0], boxCorners[1][1], boxCorners[0][2],
		boxCorners[0][0], boxCorners[0][1], boxCorners[0][2],
		boxCorners[1][0], boxCorners[0][1], boxCorners[0][2],

		/* corner 0,0,1 */
		boxCorners[0][0], boxCorners[0][1], boxCorners[1][2],
		boxCorners[0][0], boxCorners[1][1], boxCorners[1][2],
		boxCorners[0][0], boxCorners[0][1], boxCorners[1][2],
		boxCorners[1][0], boxCorners[0][1], boxCorners[1][2],

		/* corner 0,1,0 */
		boxCorners[0][0], boxCorners[1][1], boxCorners[0][2],
		boxCorners[1][0], boxCorners[1][1], boxCorners[0][2],
		boxCorners[0][0], boxCorners[1][1], boxCorners[0][2],
		boxCorners[0][0], boxCorners[1][1], boxCorners[1][2],

		/* corner 1,0,0 */
		boxCorners[1][0], boxCorners[0][1], boxCorners[0][2],
		boxCorners[1][0], boxCorners[0][1], boxCorners[1][2],

		/* corner 1,1,1 */
		boxCorners[1][0], boxCorners[1][1], boxCorners[1][2],
		boxCorners[1][0], boxCorners[1][1], boxCorners[0][2],
		boxCorners[1][0], boxCorners[1][1], boxCorners[1][2],
		boxCorners[1][0], boxCorners[0][1], boxCorners[1][2],
		boxCorners[1][0], boxCorners[1][1], boxCorners[1][2],
		boxCorners[0][0], boxCorners[1][1], boxCorners[1][2],

		/* corner 1,1,0 */
		boxCorners[1][0], boxCorners[1][1], boxCorners[0][2],
		boxCorners[1][0], boxCorners[0][1], boxCorners[0][2],
	];

	/*
	for (var i = 0; i < lineList.length; i += 6) {
		console.log(lineList[i], " ", lineList[i+1], " ", lineList[i+2], " -> ",
			    lineList[i+3], " ", lineList[i+4], " ", lineList[i+5]);
	}
	*/

	var boxLinesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxLinesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineList), gl.STATIC_DRAW);
	var lineCoordLocation = gl.getAttribLocation(program, "a_lineCoord");
	gl.enableVertexAttribArray(lineCoordLocation);
	gl.vertexAttribPointer(lineCoordLocation, 3, gl.FLOAT, false, 0, 0);

	var UVOCoordLocation = gl.getUniformLocation(program, "u_UVOCoord");
	gl.uniform3f(UVOCoordLocation, this.ls.view3d.ofs_U, this.ls.view3d.ofs_V, this.ls.view3d.observerDistance);
	var perspectiveLocation = gl.getUniformLocation(program, "u_perspective");
	gl.uniform1f(perspectiveLocation, $('#perspective').prop('checked') ? 1.0 : 0.0);

	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);

	gl.drawArrays(gl.LINES, 0, lineList.length / 3);
}
