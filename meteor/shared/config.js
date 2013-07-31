Images = new Meteor.Collection('images');
Folders = new Meteor.Collection('folders');
Annotations = new Meteor.Collection('annotations');

Accounts.config({
	sendVerificationEmail: true,
	forbidClientAccountCreation: false
});

Images.allow({
        insert: function (userId, doc) {
                if (Meteor.call('isAdmin'))
                        return true;
        },
        update: function (userId, doc, fieldNames, modifier) {
                if (Meteor.call('isAdmin'))
                        return true;

        },
        remove: function (userId, doc) {
                if (Meteor.call('isAdmin'))
                        return true;
        }
});

Folders.allow({
        insert: function (userId, doc) {
                if (Meteor.call('isAdmin'))
                        return true;
        },
        update: function (userId, doc, fieldNames, modifier) {
                if (Meteor.call('isAdmin'))
                        return true;
        },
        remove: function (userId, doc) {
                if (Meteor.call('isAdmin'))
                        return true;
        }
});

Annotations.allow({
        insert: function (userId, doc) {
                if (Meteor.call('isAdmin'))
                        return true;
        },
        update: function (userId, doc, fieldNames, modifier) {
                if (Meteor.call('isAdmin'))
                        return true;
        },
        remove: function (userId, doc) {
                if (Meteor.call('isAdmin'))
                        return true;
        }
});
