//Explanatory notes
//The folder is the top level of organization. It currently contains only files, but eventually it will be able to contain
//other folders. 
//Images is a object collection containing HDF5 images. 

//collections related config
Images = new Meteor.Collection('images');
Folders = new Meteor.Collection('folders');
Annotations = new Meteor.Collection('annotations');
Admins = new Meteor.Collection('admins'); //all administrator user IDs go in here



//User permission levels?


/*Annotations.allow({
  insert: function (userId, doc) {
    return (userId && annotation.creator === userId);
  },
  update: function (userId, doc, fields, modifier) {
    return doc.creator === userId;
  },
  remove: function (userId, doc) {
    return doc.creator === userId;
  },
  fetch: ['creator']
});

Annotations.deny({
  update: function (userId, docs, fields, modifier) {
    return _.contains(fields, 'creator');
  }
});)*/

//security rules

//Write security rules in here, I think only server side changes are good

//accounts related stuff
Accounts.config({sendVerificationEmail: true, forbidClientAccountCreation: false}); 

if (Meteor.isClient) {
//handlebars helper functions
Handlebars.registerHelper('isAdmin', function () { //DO NOT RELY ON THIS FOR SECURITY, USE ALLOW
  return Meteor.call('isAdmin');
});

//a smarter each to retrieve children
Handlebars.registerHelper('each_children', function (context, options) {
  children = Template.folders.children(context).fetch();
  var ret = "";
  for(var i=0, j=children.length; i<j; i++) {
    ret = ret + options.fn(children[i]);
  }
  return ret;

});


  //Session variable guide:
  // currentCollectionId
  Session.setDefault("currentFolderId",null);
  Session.setDefault("currentView", "viewingFirstScreen");
  Session.setDefault("currentImageId", null);
  Session.setDefault("currentImageView", "viewingNothing");
  Session.setDefault("currentWebGLMode", "image");

  //Folder related functions
  Template.folders.foldersTop = function () {
    return Folders.find({parent: null});
  }

  Template.folders.children = function(parentId) {
    return Folders.find({parent: parentId});
  }

  Template.folders.isCurrentFolder = function (folder) {
    return Session.get("currentFolderId") === folder;
  }

  Template.folders_main.isCurrentFolder = function (folder) {
    return Template.folders.isCurrentFolder(folder);
  }

    Template.folders.events = {
    'click li': function(e) {
      e.preventDefault();
      Session.set("currentFolderId", $(e.target).attr("id"));
      Session.set("currentView", "fileListing");
    },
    'dragover .folderLi': function (e,t) {
      e.preventDefault();
      $(e.target).addClass('dragover');

    },
    'dragleave .folderLi': function (e,t) {
      e.preventDefault();
      $(e.target).removeClass('dragover');
    },
    'drop .folderLi': function (e,t) {
      e.preventDefault();
      e.dataTransfer.dropeffect = 'move';
      if (e.dataTransfer.getData('folderId') =="") {
        Meteor.call('moveFileToFolder', $.trim(e.dataTransfer.getData('text')),$(e.target).attr('id'), function(err, result) {
        if (err){
          alert("There was an error");
        }
        else if (result !== "Success"){
          alert(result);
        }
        $(e.target).removeClass('dragover');
        });
      }
      else if (e.dataTransfer.getData('folderId') !== "") {
        Meteor.call('moveFolderToFolder', $.trim(e.dataTransfer.getData('folderId')), $(e.target).attr('id'), function (err, result) {
          if (err) {
            alert("There wasn an error");
          }
          else if (result !== "Success"){
            alert(result);
          }
          $(e.target).removeClass('dragover');
        });
      }
      //edit this to make the differentiation between folders and images
      
    },
    'dragstart li.folderLi': function (e,t) {
      e.dataTransfer.effectAllowed = 'move';
      console.log();
      e.dataTransfer.setData('folderId', $.trim($(e.target).children().clone().remove().end().attr('id')));
    }
  }

  //FileView related objects

  Template.fileView.filesWithId = function() {
    return Images.find({folderId: Session.get("currentFolderId")});
  }

  Template.fileView.getFolderName = function() {
    return Folders.findOne({_id: Session.get("currentFolderId")}).name;
  }

  Template.fileView.events = {
    'mouseenter .fileViewRow' : function (e) {
      $(e.target).children().addClass("fileViewRowActive");
    },
    'mouseleave .fileViewRow' : function(e) {
      $(e.target).children().removeClass("fileViewRowActive");
    },
    'click .fileViewRow': function(e) {
      Session.set("currentImageId", $(e.target).parent().attr("fileid"));
      Session.set("currentImageView", "viewingImage");
    },
    'dragstart .fileViewRow' : function (e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text', e.target.cells[0].innerHTML); // id
    }
  }

  Template.header.connectionStatus = function () {
    return Meteor.status().status;
  }

  Template.mainView.isViewing = function (view) {
    return Session.get("currentView") === view;
  }
  //UI related stuff
  //Header stuff

  Template.header.events = {
    'click #triggerAbout': function() {
      Session.set("currentView", "viewingAbout");
    },
    'click #triggerHelp': function() {
      Session.set("currentView", "viewingHelp");
    },
    'click #triggerFirstScreen': function() {
      Session.set("currentView", "viewingFirstScreen");
    }
  }

  //image information stuff

  Template.imageInformation.imageObject = function () {
    return Images.findOne(Session.get("currentImageId"));
  };

  Template.imageView.isViewing = function (view) {
    return Session.get("currentImageView") === view;
    //insert first time rendering function here
    //var imagePath = Images.findOne(Session.get("currentImageId")).imagePath;
    //loadimage(imagePath);
  }

  //annotations related stuff
  Template.imageAnnotations.annotationsForImage = function () {
    console.log('Found annotations for images');
    return Annotations.find({imageId: Session.get("currentImageId")});
  }

  //webgl related stuff
  Template.webgl.renderImage = function () {
    var imageObject = Images.findOne(Session.get("currentImageId"));
    //var imagePath = imageObject.path;
    imagePath = "/images/lensgrid.png";

    loadimage(imagePath);
    if (Session.get("currentWebGLMode") === "image") {
    newmode("lightfield");
    newmode("image");  
    }
    else {
      newmode("lightfield");
    }
    
  }

  Template.webgl.needsGridBox = function () {
    if (Session.get("currentWebGLMode") === "image"){
      return true;
    }
    else {
      return false;
    }
  }
  Template.webgl.rendered = function () {
    //load image with ID stored in current session variable
    Template.webgl.renderImage();
    updateUV_display();

  }
  //WebGL related stuff
  Template.webgl.events = {
    'change #imageselect' : function (e) {
      console.log("Image changed");
      loadimage($(e.target).val());
      //change this with session variable
    },

    'change #rendermode' : function (e) {
      console.log("Mode changed");
      
      newmode($(e.target).val());
      Session.set("currentWebGLMode", $('#rendermode').val());
      render(image,1);
    },
    'mousedown #canvas-lightfield' : function (e) {
      console.log("mousedown" + e.pageX);
      mousedrag_X = e.pageX;
      mousedrag_Y = e.pageY;
      $(window).mousemove(function () {
        console.log("mousedrag" + e);
        mousedrag(e.pageX, e.pageY);
      });
      $(window).mouseup(function() {
        console.log("mouseup");
        $(window).unbind("mousemove");
        $(window).unbind("mouseup");
      });
    },
    'change #gain' : function (e) {
      console.log("Gain changed");
      $('#gain_current').html(Math.pow(10, $(e.target).val()).toFixed(2));
      render_if_ready(image,0);
    }, 
    //this might cause some problems, not having the .change(), also check spelling
    'change #grid' : function() {
      console.log("Grid changed");
      render_if_ready(image, 0);
    }
  }






}


if (Meteor.isServer) {

  Meteor.startup(function () {
    
    //FileCollections.insert({name:"Light-field Microscopy"});
    //FileCollections.insert({name:"Light-sheet Microscopy"});
    //Images.insert({baseName : "Test1", Size :"20050", collectionId:"test"});
  });
  //add some dummy data
  Meteor.methods( {
    isAdmin: function () {
      var user = Meteor.user();
      if (!("string" === typeof (user.admin) && "admin" == (user.admin))) {
        return false;
      }
      return true;
    },
    moveFileToFolder: function (file,folder) {
      if (Meteor.call('isAdmin')){
        Images.update(file, {$set: {folderId: folder}});
        return "Success";
      }
      else
      {
        return "You must be an administrator to move files.";
      }
    },
    moveFolderToFolder: function (movingFolder, destinationFolder) {
      if (Meteor.call('isAdmin')) {
        //Transverse destination folder parents to see if folder is contained within the source folder
        var invalidOperation = false;
        var currentTransversalFolderId = Folders.findOne(destinationFolder).parent;
        while (typeof(currentTransversalFolderId) !== "undefined") {
          console.log("Transversed once");
          if (currentTransversalFolderId == movingFolder) {
            console.log("Yay");
            invalidOperation = true;
            break;
          }
          else {
            currentTransversalFolderId = Folders.findOne(currentTransversalFolderId);
            console.log(typeof(currentTransversalFolderId));
            if (typeof(currentTransversalFolderId) !== "undefined") {
              currentTransversalFolderId = currentTransversalFolderId.parent;
              console.log(currentTransversalFolderId);
            }
          }
        }
        //check if invalid bool is set
        if (invalidOperation) {
          return "You cannot move a parent folder into any of it's children";
        }
        else {
          Folders.update(movingFolder, {$set: {parent: destinationFolder}});
          return "Success";        
        }
      }
      else {
        return "You must be an administrator to move folders."
      }
    },
    //Utility function which provides quick access to make users administrators
    makeUserAdmin: function (userId) {
      if (Meteor.call('isAdmin')) {
        Meteor.users.update({_id: userId}, { $set : { "profile.type": "admin" } }, function (err) {
          if (err) {
            return err;          
          }
          else {
            return "The user was successfully updated.";
          }
        });
      }
      else
      {
        return "You must be an admin to do that.";
      }
    }
  });
}
