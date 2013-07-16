//publish emails for annotations
Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1}});
});
