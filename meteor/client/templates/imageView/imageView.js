  Template.imageView.isViewing = function(view) {
  	return Session.get("currentImageView") === view;
  }