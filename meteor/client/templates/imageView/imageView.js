  Template.imageView.isViewing = function(view) {
    return Session.get("currentImageView") === view;
    //insert first time rendering function here
    //var imagePath = Images.findOne(Session.get("currentImageId")).imagePath;
    //loadimage(imagePath);
  }