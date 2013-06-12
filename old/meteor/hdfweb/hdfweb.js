

//collections related config
Images = new Meteor.Collection('images');
FileCollections = new Meteor.Collection('fileCollections');



//accounts related stuff
Accounts.config({sendVerificationEmail: true, forbidClientAccountCreation: false}); 

if (Meteor.isClient) {
  //be mindful of these session variables
  Session.setDefault("currentCollectionId",null);
  Session.setDefault("currentView", "viewingFirstScreen");


  Template.collections.collections = function () {
    return FileCollections.find();
  }

  Template.fileView.filesWithId = function() {
    return Images.find({collectionId: Session.get("currentCollectionId")});
  }

  Template.header.connectionStatus = function () {
    return Meteor.status().status;
  }

  Template.mainView.isViewing = function (view) {
    return Session.get("currentView") === view;
  }

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
  Template.collections.events = {
    'click li': function(e) {
      e.preventDefault();
      Session.set("currentCollectionId", $(e.target).attr("id"));
      Session.set("currentView", "fileListing");
    }

  }






  //image related stuff
  /*Template.images.helpers({
    images: function() {
      return Images.find();
    }
  });*/


}


if (Meteor.isServer) {

  Meteor.startup(function () {
    
    //FileCollections.insert({name:"Light-field Microscopy"});
    //FileCollections.insert({name:"Light-sheet Microscopy"});
    //Images.insert({baseName : "Test1", Size :"20050", collectionId:"test"});
  });
  //add some dummy data

}
