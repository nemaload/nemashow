Meteor.subscribe("directory");
Meteor.subscribe("images");
Meteor.subscribe("folders", function onReady() {
  Session.set('loadedLiveData',true);
});

Meteor.subscribe("annotations");
