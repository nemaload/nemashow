// current rendering mode ('image' is source image / '3d' is rendered view)
mode = 'image';

function newmode(newmode) {
	mode = newmode;
	document.getElementById("canvas-image").style.display = mode == "image" ? 'block' : 'none';
	document.getElementById("canvas-3d").style.display = mode == "3d" ? 'block' : 'none';
	document.getElementById("controls-3d").style.display = mode == "3d" ? 'block' : 'none';
	document.getElementById("grid").style.display = mode == "image" && Session.get('currentImageType') == "lf" ? 'inline' : 'none';
	document.getElementById("div-uvpos").style.display = mode == "3d" && Session.get('currentImageType') == "lf" ? 'block' : 'none';
	document.getElementById("perspective-p").style.display = mode == "3d" && Session.get('currentImageType') == "ls" ? 'block' : 'none';
	document.getElementById("controls-lightfield-image").style.display = mode == "image" && Session.get('currentImageType') == "lf" ? 'block' : 'none';
	document.getElementById("controls-lightsheet-image").style.display = mode == "image" && Session.get('currentImageType') == "ls" ? 'block' : 'none';
	document.getElementById("info-lightsheet-image").style.display = mode == "image" && Session.get('currentImageType') == "ls" ? 'block' : 'none';
	document.getElementById("box-lightsheet-3d").style.display = mode == "3d" && Session.get('currentImageType') == "ls" ? 'block' : 'none';
	document.getElementById("maxu-lightfield-image").style.display = mode == "image" && Session.get('currentImageType') == "lf" ? 'block' : 'none';
}

var loading_count = 0;
function updateLoading(loadingDelta) {
	loading_count += loadingDelta;
	document.getElementById("loader").className = loading_count == 0 ? "loaded" : "loading";
	console.log("loading " + (loading_count == 0 ? "loaded" : "loading") + " count " + loading_count);
}

// global variables holding the rendering contexts
lf = new LightFieldRenderer();
ls = new LightSheetRenderer();

// TODO: these will in the future switch based on image type

function loadimage(imagepath) {
	return Session.get('currentImageType') == "ls" ? ls.loadimage(imagepath) : lf.loadimage(imagepath[0]);
}

function render_if_ready(is_new_image) {
	return Session.get('currentImageType') == "ls" ? ls.render_if_ready(is_new_image) : lf.render_if_ready(is_new_image);
}
function render(is_new_image) {
	return Session.get('currentImageType') == "ls" ? ls.render(is_new_image) : lf.render(is_new_image);
}

function mousedrag_set(new_X, new_Y) {
	return Session.get('currentImageType') == "ls" ? ls.mousedrag_set(new_X, new_Y) : lf.mousedrag_set(new_X, new_Y);
}
function mousedrag(new_X, new_Y) {
	return Session.get('currentImageType') == "ls" ? ls.mousedrag(new_X, new_Y) : lf.mousedrag(new_X, new_Y);
}

function setUV(U, V) {
	return Session.get('currentImageType') == "ls" ? ls.setUV(U, V) : lf.setUV(U, V);
}
function updateUV(delta_U, delta_V) {
	return Session.get('currentImageType') == "ls"
		? ls.updateUV(delta_U * ls.view3d.ofs_UV_step, delta_V * ls.view3d.ofs_UV_step)
		: lf.updateUV(delta_U, delta_V);
}
