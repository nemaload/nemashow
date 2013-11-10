Template.fileView.filesWithId = function() {
  return Images.find({
    folderId: Session.get("currentFolderId")
  });
}

Template.fileView.alreadyLoaded = function() {
  return Session.get("loadedLiveData");
}

Template.fileView.foldersWithParent = function() {
  return Folders.find({
    parent: Session.get("currentFolderId")
  });
}

Template.fileView.hasFiles = function() {
  if (Images.find({
    folderId: Session.get("currentFolderId")
  }).count() == 0) {
    return false;
  }
  return true;
}

Template.fileView.hasFolders = function() {
  if (Folders.find({
    parent: Session.get("currentFolderId")
  }).count() == 0) {
    return false;
  }
  return true;
}

Template.fileView.hasNothing = function() {
  if (!(Template.fileView.hasFiles() || Template.fileView.hasFolders())) {
    return true;
  }
  return false;
}

Template.fileView.removeFolder = function() {
  if (confirm("Do you really want to delete this folder? Deleting a folder strands all of the files within it.")) {
    Meteor.call('deleteFolder', Session.get("currentFolderId"), function(err, result) {
      if (err) {
        alert(err);
      } else if (result !== "Success") {
        alert(result);
      } else {
	urlrouter.main();
      }
    });

  }
}
Template.fileView.getFolderName = function() {
  var folder = Folders.findOne({
    _id: Session.get("currentFolderId")
  });
  if (typeof(folder) !== "undefined") {
    return folder.name;
  } else {
    return "";
  }
}

Template.fileView.setImageSessionVars = function() {
  var imageObject = Images.findOne(Session.get("currentImageId"));
  var type = imageObject.type ? imageObject.type : 'lf';
  Session.set("currentImageType", type);
  var numFrames;

  if (type == 'lf') {
    numFrames = imageObject.numFrames;

    //optics
    if (imageObject.op_maxu)
      Session.set("op_maxu", imageObject.op_maxu);
    else
      Session.set("op_maxu", 0);
    Session.set("op_pitch", imageObject.op_pitch);
    Session.set("op_flen", imageObject.op_flen);
    Session.set("op_mag", imageObject.op_mag);
    Session.set("op_na", imageObject.op_na);
    Session.set("op_medium", imageObject.op_medium);

    //lenslets
    Session.set("op_x_offset", imageObject.op_x_offset);
    Session.set("op_y_offset", imageObject.op_y_offset);
    Session.set("op_right_dx", imageObject.op_right_dx);
    Session.set("op_right_dy", imageObject.op_right_dy);
    Session.set("op_down_dx", imageObject.op_down_dx);
    Session.set("op_down_dy", imageObject.op_down_dy);

    //crop window
    if (imageObject.cw_x0) {
      Session.set("cw_is_set", 1);
      Session.set("cw_x0", imageObject.cw_x0);
      Session.set("cw_x1", imageObject.cw_y0);
      Session.set("cw_y0", imageObject.cw_x1);
      Session.set("cw_y1", imageObject.cw_y1);
    } else {
      Session.set("cw_is_set", 0);
    }

  } else if (imageObject.type == 'ls') {
    // our metadata is a list of per-frame information that we don't store
    // in the database for now and couldn't put in session even if we did
    // as it's an array
    var numChannels = imageObject.channels.length;
    console.log("loading " + numChannels + " channels");
    Session.set("currentImageChannels", numChannels);
    numFrames = imageObject.numFrames / numChannels;
  }

  Session.set("currentImageNumFrames", numFrames);
  Session.set("currentFrameIndex", 0);
  Session.set("imageSliderMax", numFrames - 1);
  Session.set("imageSliderMin", 0);
  Session.set("startFrameIndex", 0);
  Session.set("endFrameIndex", 0);
  Session.set("createdImageLoadingBar",false);
  //rendering stuff
  Session.set("currentImageGain", imageObject.defaultGain);
  Session.set("currentImageGamma", imageObject.defaultGamma);

  if (imageObject.baseName == "punc31_gCAMP5_td_video32_global_gfpfilter.hdf5") {
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

Template.fileView.events = {
  'mouseenter .fileViewRow': function(e) {
    $(e.target).children().addClass("fileViewRowActive");
  },
  'mouseleave .fileViewRow': function(e) {
    $(e.target).children().removeClass("fileViewRowActive");
  },
  'click .fileViewRow': function(e) {
    urlrouter.viewFileById(Session.get("currentFolderId"), $(e.target).parent().attr("fileid"));
  },
  'dragstart .fileViewRow': function(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', e.target.cells[0].innerHTML); // id
  },
  'click #removeFolder': function(e) {
    e.preventDefault();
    Template.fileView.removeFolder();
  },
  'click .folderViewRow': function(e) {
    Session.set("currentFolderId", $(e.target).parent().attr("folderId"));
  }
}
