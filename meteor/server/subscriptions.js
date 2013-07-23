//publish emails for annotations
Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1}});
});
Meteor.publish("folders", function () {
  return Folders.find();
});
Meteor.publish("annotations", function() {
  return Annotations.find();
});
Meteor.publish("images", function() {
  return Images.find({},{fields : { originalPath : 0, webPath : 0, amazonPath:0, relPath:0}});
});
