Template.imageInformation.imageObject = function() {
  return Images.findOne(Session.get("currentImageId"));
};

Template.imageInformation.events = {
  'click #magnetLink': function(e) {
    e.preventDefault();
    var currentImage = Images.findOne(Session.get("currentImageId"));
    if (currentImage.type) { // only LS images have this attribute
      window.open("https://s3.amazonaws.com/nemaload.data/light_sheet_hdf5/" + currentImage.baseName + "?torrrent", '_blank');
    } else {
      window.open("https://s3.amazonaws.com/nemaload.data/light_field_hdf5/" + currentImage.baseName + "?torrent", '_blank');
    }
  },
  'click #imageFullView': function(e) {
    e.preventDefault();
    Session.set("currentFrameIndex", 0);
    Session.set("viewingAnnotation", false);
    Session.set("imageSliderMin", 0);
    Session.set("imageSliderMax", Images.findOne(Session.get("currentImageId")).numFrames - 1);
    Template.webgl.setupSliders();
  }
}
