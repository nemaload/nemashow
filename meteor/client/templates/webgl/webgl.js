//webgl related stuff
Template.webgl.renderImage = function() {
  if (Session.get("currentWebGLMode") === "image") {
    newmode("lightfield");
    newmode("image");
  } else {
    newmode("lightfield");
  }
  render_if_ready(image, 0);
}

Template.webgl.created = function() {
  console.log("webgl created");
  Deps.autorun(function () {
    console.log("autorun " + Session.get("currentImageId") + " " + Session.get("currentFrameURL"));
    var imageObject = Images.findOne(Session.get("currentImageId"));
    imagePath = Session.get("currentFrameURL");
    loadimage(imagePath);
  });
}

Template.webglControls.annotationNote = function() {
  if (Session.get("viewingAnnotation")) {
    var currentAnnotation = Annotations.findOne(Session.get("currentAnnotationId"));
    return "Currently viewing annotation by " + Meteor.users.findOne(currentAnnotation.userId).emails[0].address;
  }
}

Template.webglControls.currentFrameIndex = function() {
  return Session.get("currentFrameIndex");
}

Template.webglControls.maxFrame = function() {
  return Session.get("imageSliderMax");
}

Template.webglControls.minFrame = function() {
  return Session.get("imageSliderMin");
}

Template.webglControls.needsGridBox = function() {
  return (Session.get("currentWebGLMode") === "image");
}

Template.webglControls.shouldShowSlider = function() {
  return (Session.get("currentImageNumFrames") > 1);
}

Template.webgl.setupSliders = function() {
  if (Session.get("currentImageNumFrames") > 1) {
    $("#imageSlider").val(Session.get('currentFrameIndex')).off('change').change(function() {
      var newURL = Images.findOne(Session.get("currentImageId")).webPath[this.value];
      Session.set("currentFrameURL", newURL);
      Session.set("currentFrameIndex", this.value);
    });
  }

  $("#rendermode").val(Session.get("currentWebGLMode"));
  $("#grid").button();
  $('.btn-group').button();

  $("#gainSlider").val(Session.get('currentImageGain')).off('change').change(function() {
    console.log('gainSlider ' + this.value);
    $('#gain_current').html(Math.pow(10, this.value).toFixed(2));
    Session.set("currentImageGain", this.value);
    render_if_ready(image, 0);
  }).change();
  $("#gammaSlider").val(Session.get('currentImageGamma')).off('change').change(function() {
    console.log('gammaSlider ' + this.value);
    $('#gamma_current').html(parseFloat(this.value).toFixed(2));
    Session.set("currentImageGamma", this.value);
    render_if_ready(image, 0);
  }).change();
}

Template.webgl.rendered = function() {
  Template.webgl.renderImage();
}

Template.webglControls.rendered = function() {
  updateUV_display();
  Template.webgl.setupSliders();
}

Template.webgl.events = {
  'change #rendermode': function(e) {
    console.log("Mode changed");

    newmode($(e.target).val());
    Session.set("currentWebGLMode", $('#rendermode').val());
    render(image, 1);
  },

  'mousedown #canvas-lightfield': function(e) {
    mousedrag_X = e.pageX;
    mousedrag_Y = e.pageY;
    $(window).mousemove(function() {
      mousedrag(event.pageX, event.pageY);
    });
    $(window).mouseup(function() {
      $(window).unbind("mousemove");
      $(window).unbind("mouseup");
    });
  },

  'click #grid': function() {
    $("#grid").toggleClass('active');
    render_if_ready(image, 0);
  },

  'click #setDefaults': function(e) {
    e.preventDefault();

    Meteor.call('changeDefaultGainAndGamma', Session.get("currentImageGain"), Session.get("currentImageGamma"), Session.get("currentImageId"), function(err, result) {
      if (err) {
        alert(err);
      } else if (result != "Success") {
        alert(result);
      }
    });
  }
}
