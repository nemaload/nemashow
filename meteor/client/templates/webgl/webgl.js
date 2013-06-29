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

Template.webgl.annotationNote = function() {
  if (Session.get("viewingAnnotation")) {
    var currentAnnotation = Annotations.findOne(Session.get("currentAnnotationId"));
    return "Currently viewing annotation by " + Meteor.users.findOne(currentAnnotation.userId).emails[0].address;
  }

}

Template.webgl.currentFrameIndex = function() {
  return Session.get("currentFrameIndex");
}

Template.webgl.maxFrame = function() {
  return Session.get("imageSliderMax");
}

Template.webgl.minFrame = function() {
  return Session.get("imageSliderMin");
}

Template.webgl.needsGridBox = function() {
  if (Session.get("currentWebGLMode") === "image") {
    return true;
  } else {
    return false;
  }
}

Template.webgl.shouldShowSlider = function() {
  if (Session.get("currentImageNumFrames") == 1) {
    return false;
  }
  return true;
}

Template.webgl.currentImageGain = function() {
  return Session.get("currentImageGain");
}

Template.webgl.currentImageGamma = function() {
  return Session.get("currentImageGamma");
}

Template.webgl.setupSliders = function() {
  if (Session.get("currentImageNumFrames") > 1) {
    $("#imageSlider").slider({
      value: Session.get("currentFrameIndex"),
      orientation: "horizontal",
      range: "min",
      min: Session.get("imageSliderMin"),
      max: Session.get("imageSliderMax"),
      step: 1,
      //max: Session.get("currentImageNumFrames") -1,
      animate: true,
      change: function() {
        var newURL = Images.findOne(Session.get("currentImageId")).webPath[$("#imageSlider").slider("value")];
        Session.set("currentFrameURL", newURL);
        Session.set("currentFrameIndex", $("#imageSlider").slider("value"));
      }
    });

  }
  $("#rendermode").val(Session.get("currentWebGLMode"));
  $("#grid").button();
  $('.btn-group').button();
  $("#gainSlider").slider({
    value: Session.get("currentImageGain"),
    min: -1,
    max: 1,
    step: 0.05,
    orientation: "horizontal",
    range: "min",
    animate: true,
    change: function() {
      $('#gain_current').html(Math.pow(10, $("#gainSlider").slider("value")).toFixed(2));
      Session.set("currentImageGain", $("#gainSlider").slider("value"));
      render_if_ready(image, 0);
    },
      slide: function(event, ui) {
        $('#gain_current').html(Math.pow(10, ui.value).toFixed(2));
        Session.set("currentImageGain", ui.value);
        render_if_ready(image, 0);
      }
  });


  $("#gammaSlider").slider({
    value: Session.get("currentImageGamma"),
    min: 0.5,
    max: 1.5,
    step: 0.01,
    orientation: "horizontal",
    range: "min",
    animate: true,
    change: function() {
      $('#gamma_current').html(parseFloat($("#gammaSlider").slider("value")).toFixed(2));
      Session.set("currentImageGamma", $("#gammaSlider").slider("value"));
      render_if_ready(image, 0);
    }
,
      slide: function(event, ui) {
        $('#gamma_current').html(Math.pow(10, ui.value).toFixed(2));
        Session.set("currentImageGamma", ui.value);
        render_if_ready(image, 0);
      }
  });

}
Template.webgl.rendered = function() {
  Template.webgl.renderImage();
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
