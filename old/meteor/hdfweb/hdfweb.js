//Explanatory notes
//The folder is the top level of organization. It currently contains only files, but eventually it will be able to contain
//other folders. 
//Images is a object collection containing HDF5 images. 

//collections related config
Images = new Meteor.Collection('images');
Folders = new Meteor.Collection('folders');
Annotations = new Meteor.Collection('annotations');


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
  //Session variable guide:
  // currentCollectionId
  Session.setDefault("currentFolderId",null);
  Session.setDefault("currentView", "viewingFirstScreen");
  Session.setDefault("currentImageId", null);
  Session.setDefault("currentImageView", "viewingNothing");
  Session.setDefault("currentWebGLMode", "image");

  //Folder related functions
  Template.folders.folders = function () {
    return Folders.find();
  }

  Template.folders.isCurrentFolder = function (folder) {
    console.log(folder);
    return Session.get("currentFolderId") === folder;
  }

    Template.folders.events = {
    'click li': function(e) {
      e.preventDefault();
      Session.set("currentFolderId", $(e.target).attr("id"));
      Session.set("currentView", "fileListing");
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

}
