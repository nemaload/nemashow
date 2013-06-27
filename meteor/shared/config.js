Images = new Meteor.Collection('images');
Folders = new Meteor.Collection('folders');
Annotations = new Meteor.Collection('annotations');

Accounts.config({
	sendVerificationEmail: true,
	forbidClientAccountCreation: false
});