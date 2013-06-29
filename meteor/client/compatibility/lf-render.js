var texture = {}; // indexed by mode name

function maxNormalizedSlope() {
	/* Return the maximum slope afforded by the optical system */

	// ???
	image_na = optics.na / optics.mag;
	if (image_na >= 1.0) return 0.0;
	na_slope = image_na / Math.sqrt(1.0 - image_na * image_na);

	// slope of looking at a lens neighboring with central lens
	ulens_slope = optics.pitch / optics.flen;

	return na_slope / ulens_slope;
}

function lenslets_offset2corner(lenslets) {
	/* Walk from the lenslets.offset point to the point of the grid
	 * nearest to the top left corner. */

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


function render(image, is_new_image) {
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
		render_image(image, canvas, gl);
	} else {
		render_lightfield_pinhole(image, canvas, gl);
	}

	if (1) { // is_new_image) { TODO: <canvas> must persist re-renders for this to work properly
		if (texture[mode]) {
			gl.deleteTexture(texture[mode]);
		}
		texture[mode] = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture[mode]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	} else {
		gl.bindTexture(gl.TEXTURE_2D, texture[mode]);
	}
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	//if (mode == "image" && $('#grid').prop('checked'))
	if (mode == "image" && $('#grid').hasClass('active'))
		render_grid(canvas, gl);
}

function render_image(image, canvas, gl) {
	// compile shaders
	vertexShader = createShaderFromScriptElement(gl, "image-vertex-shader");
	fragmentShader = createShaderFromScriptElement(gl, "image-fragment-shader");
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

function setRectangle(gl, x, y, width, height) {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		// bottom triangle
		x1, y1,  x2, y1,  x1, y2,
		// top triangle
		x1, y2,  x2, y1,  x2, y2]),
		gl.STATIC_DRAW);
}

function render_lightfield_pinhole(image, canvas, gl) {
	// compile shaders
	vertexShader = createShaderFromScriptElement(gl, "image-vertex-shader");
	fragmentShader = createShaderFromScriptElement(gl, "lightfield-pinhole-fragment-shader");
	program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var gridCorner = lenslets_offset2corner(lenslets);
	var gridSize = {
		"width": Math.ceil(image.width / lenslets.right[0]),
		"height": Math.ceil(image.height / lenslets.down[1])
	};

	// set(up) parameters
	var canvSizeLocation = gl.getUniformLocation(program, "u_canvSize");
	gl.uniform2f(canvSizeLocation, canvas.width, canvas.height);
	var gammaGainLocation = gl.getUniformLocation(program, "u_gammaGain");
	gl.uniform2f(gammaGainLocation, parseFloat(Session.get("currentImageGamma")), Math.pow(10, parseFloat(Session.get("currentImageGain"))));

	var gridSizeLocation = gl.getUniformLocation(program, "u_gridSize");
	gl.uniform2f(gridSizeLocation, gridSize.width, gridSize.height);
	var rectOffsetLocation = gl.getUniformLocation(program, "u_rectOffset");
	gl.uniform2f(rectOffsetLocation, gridCorner[0] / image.width, -gridCorner[1] / image.height);
	var rectLinearLocation = gl.getUniformLocation(program, "u_rectLinear");
	gl.uniformMatrix2fv(rectLinearLocation, false, [
	lenslets.right[0] / image.width, lenslets.right[1] / image.height, lenslets.down[0] / image.width, lenslets.down[1] / image.height]);
	var UVCoordLocation = gl.getUniformLocation(program, "u_UVCoord");
	gl.uniform2f(UVCoordLocation, ofs_U / lenslets.right[0], ofs_V / lenslets.down[1]);

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

function render_grid(canvas, gl) {
	var vertexShader = createShaderFromScriptElement(gl, "grid-vertex-shader");
	var fragmentShader = createShaderFromScriptElement(gl, "grid-fragment-shader");
	var program = createProgram(gl, [vertexShader, fragmentShader]);
	gl.useProgram(program);

	var gridCorner = lenslets_offset2corner(lenslets);
	var gridSize = {
		"width": Math.ceil(image.width / lenslets.right[0]),
		"height": Math.ceil(image.height / lenslets.down[1])
	};
	var lineList = new Array;
	for (var x = 0; x <= gridSize.width; x++) {
		lineList.push(gridCorner[0] + x * lenslets.right[0]);
		lineList.push(gridCorner[1] + x * lenslets.right[1]);
		lineList.push(gridCorner[0] + x * lenslets.right[0] + gridSize.height * lenslets.down[0]);
		lineList.push(gridCorner[1] + x * lenslets.right[1] + gridSize.height * lenslets.down[1]);
	}
	for (var y = 0; y <= gridSize.height; y++) {
		lineList.push(gridCorner[0] + y * lenslets.down[0]);
		lineList.push(gridCorner[1] + y * lenslets.down[1]);
		lineList.push(gridCorner[0] + y * lenslets.down[0] + gridSize.width * lenslets.right[0]);
		lineList.push(gridCorner[1] + y * lenslets.down[1] + gridSize.width * lenslets.right[1]);
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
