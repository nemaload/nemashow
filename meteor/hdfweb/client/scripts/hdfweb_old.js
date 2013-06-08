//collections related config
Images = new Meteor.Collection('images');
FileCollections = new Meteor.Collection('fileCollections');

//accounts related stuff
Accounts.config({sendVerificationEmail: true, forbidClientAccountCreation: false}); 

if (Meteor.isClient) {
  //boilerplate code
  Template.hello.loggedInGreeting = function () {
    if (Meteor.user().profile !== undefined)
    {
        return "Welcome back, " + Meteor.user().profile.name.split(" ")[0] +"!";        
    }
    else
    {
      if(Meteor.user().emails[0].verified == true)
      {
        return "Wecome back, " + Meteor.user().emails[0].address + "!";       
      }
      else 
      {
        return "Please verify your email address!(change this lol)"
      }
      
    }
  }

  Template.fileCollectionsSidebar.collections = function () {
    return FileCollections.find();
  }

  Template.header.connectionStatus = function () {
    return Meteor.status().status
  }

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });


  //image related stuff
  Template.images.helpers({
    images: function() {
      return Images.find();
    }
  });
}



if (Meteor.isServer) {
  Meteor.startup(function () {
    
    //FileCollections.insert({name:"Light-field Microscopy"});
    //FileCollections.insert({name:"Light-sheet Microscopy"});
    //Images.insert({baseName : "Test1", Size :"20050"});
  });
  //add some dummy data

}
