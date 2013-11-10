//webgl related stuff

function frameURL(idx) {
  var imageObject = Images.findOne(Session.get("currentImageId"));
  if (imageObject == null) // XXX: sometimes this just happens even though followup calls will succeed :(
    return null;
  var newURL;
  /** If we were to depend on *Path attributes of MongoDB:
  if (Session.get('currentImageType') == 'lf') {
    if (Session.get("useAmazonData")) {
      newURL = imageObject.amazonPath[idx];
    } else {
      newURL = imageObject.webPath[idx];
    }
  } else {
    newURL = imageObject.relPath[idx];
  } */
  if (Session.get('currentImageType') == 'lf') {
    newURL = imageObject.baseName + "-" + idx;
  } else {
    var framesPerChannel = (imageObject.numFrames/imageObject.channels.length);
    newURL = imageObject.baseName + "/" + Math.floor(idx / framesPerChannel) + "/" + idx % framesPerChannel;
  }
  return newURL;
}

function setFrame(idx) {
  console.log("frame " + Session.get("currentFrameIndex") + " -> " + idx);
  Session.set("currentFrameIndex", idx);
}

var playFrames_delay = 2000; // [ms]
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
    if (Session.get('currentImageType') == "ls" && Session.get("currentImageChannels") == 2) {
      var imagePaths = [
        frameURL(Session.get("currentFrameIndex")),
        frameURL(Session.get("currentFrameIndex") + Session.get("currentImageNumFrames")),
      ];
      loadimage(imagePaths);
    } else {
      var imagePath = frameURL(Session.get("currentFrameIndex"));
      loadimage([imagePath, imagePath]);

      var baseName = Images.findOne(Session.get("currentImageId")).baseName;
      if (baseName == "punc31_gCAMP5_td_video32_global_gfpfilter.hdf5") {
	// XXX: video-specific defaults hack, TODO make a generic way to do this
	Session.set("currentPoseZoom", 0.2);
	Session.set("currentPoseShift", -22);
	Session.set("currentPoseAngle", 90);
      } else {
	Session.set("currentPoseZoom", 0.2);
	Session.set("currentPoseShift", 0);
	Session.set("currentPoseAngle", 0);
      }
    }
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

function updatePoseZoom(val) {
  $('#pose_zoom_current').html(parseFloat(val).toFixed(2));
  Session.set("currentPoseZoom", val);
  render_if_ready(0);
}
function updatePoseShift(val) {
  $('#pose_shift_current').html(parseFloat(val).toFixed(2));
  Session.set("currentPoseShift", val);
  render_if_ready(0);
}
function updatePoseAngle(val) {
  $('#pose_angle_current').html(parseFloat(val).toFixed(2));
  Session.set("currentPoseAngle", val);
  render_if_ready(0);
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
  var gridbtn = $("#grid").button();
  if (Session.get("showGrid"))
    gridbtn.addClass("active");
  gridbtn = $("#griduv").button();
  if (Session.get("showGridUV"))
    gridbtn.addClass("active");
  $('.btn-group').button();
  $("#bbplot").button();

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
  $("#zoomSlider").val(Session.get('currentImageZoom')).off('change').change(function() {
    console.log('zoomSlider ' + this.value);
    $('#zoom_current').html(parseFloat(this.value).toFixed(2));
    Session.set("currentImageZoom", this.value);
    render_if_ready(0);
  }).change();
  $("#poseZoomSlider").val(Session.get('currentPoseZoom')).off('change').change(function() {
    updatePoseZoom(this.value);
  }).change();
  $("#poseZoomMinus").off('click').click(function() {
    var val = parseFloat(Session.get('currentPoseZoom')) - 0.1;
    updatePoseZoom(val);
  });
  $("#poseZoomPlus").off('click').click(function() {
    var val = parseFloat(Session.get('currentPoseZoom')) + 0.1;
    updatePoseZoom(val);
  });
  $("#poseShiftSlider").val(Session.get('currentPoseShift')).off('change').change(function() {
    updatePoseShift(this.value);
  }).change();
  $("#poseShiftMinus").off('click').click(function() {
    var val = parseFloat(Session.get('currentPoseShift')) - 1.0;
    updatePoseShift(val);
  });
  $("#poseShiftPlus").off('click').click(function() {
    var val = parseFloat(Session.get('currentPoseShift')) + 1.0;
    updatePoseShift(val);
  });
  $("#poseAngleSlider").val(Session.get('currentPoseAngle')).off('change').change(function() {
    updatePoseAngle(this.value);
  }).change();
  $("#poseAngleMinus").off('click').click(function() {
    var val = parseFloat(Session.get('currentPoseAngle')) - 1.0;
    updatePoseAngle(val);
  });
  $("#poseAnglePlus").off('click').click(function() {
    var val = parseFloat(Session.get('currentPoseAngle')) + 1.0;
    updatePoseAngle(val);
  });

  var maxu = Session.get('op_maxu') > 0 ? Session.get('op_maxu') : lf.maxNormalizedSlope();
  console.log('maxu ', maxu);
  $("#maxuSlider").val(maxu).off('change').change(function() {
    console.log('maxuSlider ' + this.value);
    $('#maxu_current').html(parseFloat(this.value).toFixed(2));
    Session.set("op_maxu", this.value);
    render_if_ready(0);
  }); // do not fire .change() as we don't want to explicitly set op_maxu unconditionally
  $('#maxu_current').html(parseFloat(maxu).toFixed(2));
}

Template.webgl.rendered = function() {
  Template.webgl.renderImage();
}

Template.webglControls.rendered = function() {
  if (! Session.get("createdImageLoadingBar")) {
    $(".loadingRow").empty();
    var divWidth = 100.0/Session.get("currentImageNumFrames");
    for (var i=0; i < Session.get("currentImageNumFrames"); i++)
    {
          console.log("loadedThing");
      $("<div />", {
          "class":"gridCell notLoaded",
          id: "imageLoading" + i
      }).css({
          "width": divWidth + "%"
      }).appendTo(".loadingRow");
    }
    Session.set("createdImageLoadingBar", true);
  }
  if (Session.get('currentImageType') == 'lf')
    lf.updateUV_display();
  Template.webgl.setupSliders();
}

// intensities[] are expensive to compute, so let's try to cache them
var intensitiesCache = {};
function intensitiesPlot(intensities) {
  document.getElementById('plot-outer').style.display = 'block';
  $.getScript('https://github.com/flot/flot/raw/master/jquery.flot.js', function() {
    $.plot($('#plot-inner'), [intensities], {
      'xaxis': {'show': false},
      'yaxis': {'show': false},
      'grid': {'minBorderMargin': 0, 'borderWidth': 0},
      'lines': {'lineWidth': 2}, 'shadowSize': 0});
  });
}

Template.webgl.events = {
  'change #rendermode': function(e) {
    console.log("Mode changed");

    newmode($(e.target).val());
    Session.set("currentWebGLMode", $('#rendermode').val());
    render(1);
  },

  'mousedown #canvas-3d, mousedown #canvas-image': function(e) {
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
    var gridbtn = $("#grid").toggleClass('active');
    Session.set("showGrid", gridbtn.hasClass('active'));
    render_if_ready(0);
  },

  'click #griduv': function() {
    var gridbtn = $("#griduv").toggleClass('active');
    Session.set("showGridUV", gridbtn.hasClass('active'));
    render_if_ready(0);
  },

  'click #bbplot': function() {
    var bbplot = $("#bbplot");
    bbplot.toggleClass('active');
    if (bbplot.hasClass('active')) {
      var baseName = Images.findOne(Session.get("currentImageId")).baseName;
      var boxCoords = document.getElementById("box-x0").value + ','
                      + document.getElementById("box-y0").value + ','
                      + document.getElementById("box-z0").value + '-'
                      + document.getElementById("box-x1").value + ','
                      + document.getElementById("box-y1").value + ','
                      + document.getElementById("box-z1").value;
      var channelNum = document.getElementById("bbplot-chan").value;
      var normStr = document.getElementById("bbplot-norm").value;
      var metadatapath = baseName + "/box-intensity/" + channelNum + "/" + boxCoords + (normStr ? "?" + normStr : "");
      var metadataurl = computationUrl + metadatapath;
      if (intensitiesCache[metadatapath]) {
        intensitiesPlot(intensitiesCache[metadatapath]);
      } else {
        updateLoading(+1);
        $.getJSON(metadataurl, function(data) {
          var intensities = [];
          for (var i = 0; i < data.intensity.length; i++)
            intensities[i] = [i, data.intensity[i]];
          intensitiesCache[metadatapath] = intensities;
          intensitiesPlot(intensities);
          updateLoading(-1);
        });
      }
    } else {
      document.getElementById('plot-outer').style.display = 'none';
    }
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

  'click #maxuResetDefault': function(e) {
    e.preventDefault();
    Session.set("op_maxu", Images.findOne(Session.get("currentImageId")).op_maxu);
    if (!(Session.get('op_maxu') > 0)) {
      delete lf.optics.maxu;
    }
    var maxu = parseFloat(lf.maxNormalizedSlope());
    $('#maxu_current').html(maxu.toFixed(2));
    $('#maxuSlider').val(maxu);
    render_if_ready(0);
  },
  'click #maxuResetOptics': function(e) {
    e.preventDefault();
    Session.set("op_maxu", 0);
    delete lf.optics.maxu;
    var maxu = parseFloat(lf.maxNormalizedSlope());
    $('#maxu_current').html(maxu.toFixed(2));
    $('#maxuSlider').val(maxu);
    render_if_ready(0);
  },

  'change #box': function(ev) {
    render_if_ready(0);
  },
  'change #perspective': function(ev) {
    render_if_ready(0);
  },
  'change #neurons': function(ev) {
    render_if_ready(0);
  }
}
