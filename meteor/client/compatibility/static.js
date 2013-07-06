// current rendering mode ('image' is source image / '3d' is rendered view)
mode = 'image';

function newmode(newmode) {
	mode = newmode;
	document.getElementById("canvas-image").style.display = mode == "image" ? 'block' : 'none';
	document.getElementById("canvas-3d").style.display = mode == "3d" ? 'block' : 'none';
	document.getElementById("controls-lightfield").style.display = mode == "3d" ? 'block' : 'none';
}

// global variable holding the lightfield rendering context
lf = new LightFieldRenderer();

// TODO: these will in the future switch based on image type

function loadimage(imagepath) {
	return lf.loadimage(imagepath);
}

function render_if_ready(is_new_image) {
	return lf.render_if_ready(is_new_image);
}
function render(is_new_image) {
	return lf.render(is_new_image);
}

function mousedrag(new_X, new_Y) {
	return lf.mousedrag(new_X, new_Y);
}
