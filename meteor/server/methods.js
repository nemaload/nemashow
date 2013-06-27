Meteor.methods({
  //to promote a user to admin, just find the user's ID, and in the mongo console, update the admin
  //record to "admin"
  //for example, db.users.update({_id:"PFmfFFMhe9H99Bfo9"},{$set:{admin:"admin"}})
  isAdmin: function() {
    var user = Meteor.user();
    if (!("string" === typeof(user.admin) && "admin" == (user.admin))) {
      return false;
    }
    return true;
  },
  search: function(searchterm, mode) {
    //thanks Thimo Brinkmann! https://groups.google.com/forum/#!topic/meteor-talk/x9kYnO52Btg
    var searchterm_mod = '';

    var searchterms = searchterm.trim().split(" ");
    for (var i = 0; i < searchterms.length; i++) {
      searchterm_mod += '\"' + searchterms[i] + '\"' + ' ';
    }

    searchterm_mod = searchterm_mod.replace(/\.\*|\(|\)/g, "").trim();

    Future = Npm.require('fibers/future');

    var fut = new Future();

    Meteor._RemoteCollectionDriver.mongo.db.executeDbCommand({
      "text": "annotations",
      search: searchterm,
      limit: 10
    }, function(error, results) {
      if (results && results.documents[0].ok === 1) {
        var ret = results.documents[0].results;
        if (mode == "autocomplete") {
          fut.ret(_.uniq(_.map(_.pluck(ret, 'obj'), function(text) {
            return text.comment;
          })));
        } else {
          fut.ret(_.uniq(_.map(_.pluck(ret, 'obj'), function(text) {
            return text;
          })));

        }
      }
    });
    return fut.wait();
  },
  createAnnotation: function(startFrame, endFrame, comment, image) {
    var user = Meteor.user();
    if (startFrame <= endFrame) {
      //maybe run some comment validation here
      if (comment == "") {
        return "The input cannot be blank";
      } else {
        Annotations.insert({
          startFrame: startFrame,
          endFrame: endFrame,
          comment: comment,
          userId: user._id,
          imageId: image
        });
        return "Success";
      }
    } else {
      return "The start frame must be less than or equal to the end frame";
    }
  },
  removeAnnotation: function(annotationId) {
    if (Meteor.call('isAdmin')) {
      Annotations.remove(annotationId);
      return "Success";
    }
  },
  changeDefaultGainAndGamma: function(defaultGain, defaultGamma, imageId) {
    if (Meteor.call('isAdmin')) {
      Images.update(imageId, {
        $set: {
          "defaultGain": defaultGain,
          "defaultGamma": defaultGamma
        }
      });
      return "Success";
    }
    return "You must be an administrator to do that."
  },
  makeFolder: function(folderName) {
    if (Meteor.call('isAdmin')) {
      Folders.insert({
        name: folderName
      });
      return "Success";
    } else {
      return "You must be an administrator to create folders.";
    }
  },
  deleteFolder: function(folderId) {
    //TODO: move all files in the folder to the top level
    if (Meteor.call('isAdmin')) {
      Folders.remove(folderId);
      return "Success";
    }
    return "There was an error removing the folder";
  },
  moveFileToFolder: function(file, folder) {
    if (Meteor.call('isAdmin')) {
      Images.update(file, {
        $set: {
          folderId: folder
        }
      });
      return "Success";
    } else {
      return "You must be an administrator to move files.";
    }
  },
  moveFolderToFolder: function(movingFolder, destinationFolder) {
    if (Meteor.call('isAdmin')) {
      var invalidOperation = false;
      if (destinationFolder == null) {
        Folders.update(movingFolder, {
          $set: {
            parent: null
          }
        });
        return "Success";
      }
      if (destinationFolder == movingFolder) {
        return "You cannot move a folder into itself."
      }
      var currenttraversalFolderId = Folders.findOne(destinationFolder).parent;
      while (typeof(currenttraversalFolderId) !== "undefined") {
        if (currenttraversalFolderId == movingFolder) {
          console.log("Yay");
          invalidOperation = true;
          break;
        } else {
          currenttraversalFolderId = Folders.findOne(currenttraversalFolderId);
          console.log(typeof(currenttraversalFolderId));
          if (typeof(currenttraversalFolderId) !== "undefined") {
            currenttraversalFolderId = currenttraversalFolderId.parent;
            console.log(currenttraversalFolderId);
          }
        }
      }
      //check if invalid bool is set
      if (invalidOperation) {
        return "You cannot move a parent folder into any of it's children";
      } else {
        Folders.update(movingFolder, {
          $set: {
            parent: destinationFolder
          }
        });
        return "Success";
      }
    } else {
      return "You must be an administrator to move folders."
    }
  },
  //Utility function which provides quick access to make users administrators
  makeUserAdmin: function(userId) {
    if (Meteor.call('isAdmin')) {
      Meteor.users.update({
        _id: userId
      }, {
        $set: {
          "profile.type": "admin"
        }
      }, function(err) {
        if (err) {
          return err;
        } else {
          return "The user was successfully updated.";
        }
      });
    } else {
      return "You must be an admin to do that.";
    }
  }
});