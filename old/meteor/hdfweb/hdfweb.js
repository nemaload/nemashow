//Explanatory notes
//The folder is the top level of organization. It currently contains only files, but eventually it will be able to contain
//other folders. 
//Images is a object collection containing HDF5 images. 

//collections related config
Images = new Meteor.Collection('images');
Folders = new Meteor.Collection('folders');

//accounts related stuff
Accounts.config({sendVerificationEmail: true, forbidClientAccountCreation: false}); 

if (Meteor.isClient) {
  //Session variable guide:
  // currentCollectionId
  Session.setDefault("currentFolderId",null);
  Session.setDefault("currentView", "viewingFirstScreen");

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
      alert($(e.target).parent().attr("fileid"));
      console.log($(e.target).parent().attr(fileid));
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

  Template.webgl.rendered = function {
    //$(document).ready() stuff goes here
    
  }
  //WebGL related stuff
  Template.webgl.events = {
    'change #imageselect' = function () {
      console.log("Image changed");

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
