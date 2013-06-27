Template.imageInformation.imageObject = function() {
    return Images.findOne(Session.get("currentImageId"));
  };

  Template.imageInformation.events = {
    'click #magnetLink': function(e) {
      e.preventDefault();
      alert("This feature is not available at this time.");
    },
    'click #frameLink': function(e) {
      e.preventDefault();
      window.open(Session.get("currentFrameURL"));
    },
    'click #shareTwitter': function(e) {
      e.preventDefault();
      alert("This feature is not available at this time.");
    },
    'click #imageFullView' : function (e) {
      Session.set("currentFrameIndex", 0);
      Session.set("viewingAnnotation", false);
      Session.set("imageSliderMin",0);
      Session.set("imageSliderMax",Images.findOne(Session.get("currentImageId")).numFrames -1);
      Template.webgl.setupSliders();
    }
  }