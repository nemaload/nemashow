//webgl related stuff

function frameURL(idx) {
  var newURL;
  if (Session.get('currentImageType') == 'lf') {
    if (Session.get("useAmazonData")) {
      newURL = Images.findOne(Session.get("currentImageId")).amazonPath[idx];
    } else {
      newURL = Images.findOne(Session.get("currentImageId")).webPath[idx];
    }
  } else {
    newURL = Images.findOne(Session.get("currentImageId")).relPath[idx];
  }
  return newURL;
}

function setFrame(idx) {
  console.log("frame " + Session.get("currentFrameIndex") + " -> " + idx);
  Session.set("currentFrameIndex", idx);
}

var playFrames_delay = 500; // [ms]
var playFrames_timer;
function playFrames() {
  playFrames_timer = window.setInterval(function() {
      if (Session.get("currentFrameIndex") >= Session.get("imageSliderMax")) {
        console.log(Session.get("currentFrameIndex") + " >= " + Session.get("imageSliderMax"));
        stopPlayFrames();
        return;
      }
      setFrame(Session.get("currentFrameIndex") + 1);
      $("#imageSlider").val(Session.get('currentFrameIndex'))
    }, playFrames_delay);
  console.log("timer" + playFrames_timer);
  $('#frameanim_button').attr('value', '[]');
  $('#frameanim_button').off('click').click(stopPlayFrames);
}
function stopPlayFrames() {
  if (playFrames_timer != null) {
    console.log("clearInterval" + playFrames_timer);
    window.clearInterval(playFrames_timer);
  }
  $('#frameanim_button').attr('value', '>');
  $('#frameanim_button').off('click').click(function() {
    if (Session.get("currentFrameIndex") >= Session.get("imageSliderMax"))
      setFrame(0);
    playFrames();
  });
};


Template.webgl.renderImage = function() {
  if (Session.get("currentWebGLMode") === "image") {
    newmode("3d");
    newmode("image");
  } else {
    newmode("3d");
  }
  render_if_ready(0);
}

Template.webgl.created = function() {
  console.log("webgl created");
  Deps.autorun(function () {
    var imagePath = frameURL(Session.get("currentFrameIndex"));
    console.log("autorun " + Session.get("currentImageId") + " " + imagePath);
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

Template.webglControls.shouldShowSlider = function() {
  return (Session.get("currentImageNumFrames") > 1);
}

Template.webgl.setupSliders = function() {
  console.log("setupSliders");
  if (Session.get("currentImageNumFrames") > 1) {
    $("#imageSlider").val(Session.get('currentFrameIndex')).off('change').change(function() {
      setFrame(parseInt(this.value));
    });
    $("#frameprev_button").off('click').click(function() {
      if (Session.get("currentFrameIndex") > Session.get("imageSliderMin"))
        setFrame(Session.get("currentFrameIndex") - 1);
    });
    $("#framenext_button").off('click').click(function() {
      if (Session.get("currentFrameIndex") < Session.get("imageSliderMax"))
        setFrame(Session.get("currentFrameIndex") + 1);
    });
    if (! $("#frameanim_button").val())
      stopPlayFrames(); // sets up frameanim_button
  }

  $("#rendermode").val(Session.get("currentWebGLMode"));
  $("#grid").button();
  $('.btn-group').button();

  $("#gainSlider").val(Session.get('currentImageGain')).off('change').change(function() {
    console.log('gainSlider ' + this.value);
    $('#gain_current').html(Math.pow(10, this.value).toFixed(2));
    Session.set("currentImageGain", this.value);
    render_if_ready(0);
  }).change();
  $("#gammaSlider").val(Session.get('currentImageGamma')).off('change').change(function() {
    console.log('gammaSlider ' + this.value);
    $('#gamma_current').html(parseFloat(this.value).toFixed(2));
    Session.set("currentImageGamma", this.value);
    render_if_ready(0);
  }).change();
}

Template.webgl.rendered = function() {
  Template.webgl.renderImage();
}

Template.webglControls.rendered = function() {
  if (Session.get('currentImageType') == 'lf')
    lf.updateUV_display();
  Template.webgl.setupSliders();
}

Template.webgl.events = {
  'change #rendermode': function(e) {
    console.log("Mode changed");

    newmode($(e.target).val());
    Session.set("currentWebGLMode", $('#rendermode').val());
    render(1);
  },

  'mousedown #canvas-3d': function(e) {
    mousedrag_set(e.pageX, e.pageY);
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
    render_if_ready(0);
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
  },

  'change #box': function(ev) {
    render_if_ready(0);
  },
  'change #perspective': function(ev) {
    render_if_ready(0);
  }
}
