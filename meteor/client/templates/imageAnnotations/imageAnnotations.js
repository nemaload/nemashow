  //annotations related stuff
  Template.imageAnnotations.annotationsForImage = function() {
    console.log('Found annotations for images');
    return Annotations.find({
      imageId: Session.get("currentImageId")
    });
  }

  Template.imageAnnotations.sameFrame = function(startFrame, endFrame) {
    if (startFrame == endFrame) {
      return true;
    }
    return false;
  }

  Template.imageAnnotations.writingComment = function() {
    if (Session.get("writingComment")) {
      return "in";
    }
    return "";
  }
  Template.imageAnnotations.rendered = function() {
    $('[rel=tooltip]').tooltip();
  }

  Template.imageAnnotations.noAnnotations = function() {
    if (Annotations.find({
      imageId: Session.get("currentImageId")
    }).count() == 0) {
      return true;
    }
    return false;
  }
  Template.imageAnnotations.currentStartFrame = function() {
    return Session.get("startFrameIndex");
  }

  Template.imageAnnotations.creator = function(userId) {
    return Meteor.users.findOne(userId).emails[0].address;
  }

  Template.imageAnnotations.currentEndFrame = function() {
    return Session.get("endFrameIndex");
  }

  Template.imageAnnotations.events = {
    'click #submitAnnotation': function(e) {
      e.preventDefault();
      var startFrame = Session.get('startFrameIndex');
      var endFrame = Session.get('endFrameIndex');
      var comment = $('textarea#commentInput').val();
      Meteor.call('createAnnotation', startFrame, endFrame, comment, Session.get("currentImageId"), function(err, result) {
        if (err) {
          alert(err);
        } else if (result != "Success") {
          alert(result);
        } else {
          $('.commmentInput').val('');
        }
      });
    },
    'click #endButton': function(e) {
      //get input from slider here
      //merge these two events into one, getting target to set proper value
      Session.set("endFrameIndex", Session.get("currentFrameIndex"));
    },
    'click #startButton': function(e) {
      Session.set("startFrameIndex", Session.get("currentFrameIndex"));
    },
    'click .icon-remove-sign': function(e) {
      Meteor.call('removeAnnotation', $(e.target).attr('id'), function(err, result) {
        if (err) {
          alert(err);
        } else if (result != "Success") {
          alert(result);
        }
      });
    },
    'click .icon-eye-open' : function (e) {
      e.preventDefault();
      var annotation = Annotations.findOne($(e.target).attr('annotationid'));
      Session.set("imageSliderMin", annotation.startFrame);
      Session.set("currentFrameIndex", annotation.startFrame);
      Session.set("imageSliderMax", annotation.endFrame);
      Session.set("viewingAnnotation", true);
      Session.set("currentAnnotationId", annotation._id);
    },

    'click #writeCommentLink': function(e) {
      var writingState = Session.get("writingComment");
      if (!writingState) Session.set("writingComment", true);
      else Session.set("writingComment", false);
    }
  }