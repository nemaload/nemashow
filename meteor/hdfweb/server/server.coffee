#Create client-side collections if they don't exist yet
Images = new Meteor.Collection('images')
FileCollections = new Meteor.Collection('fileCollections')
Comments = new Meteor.Collection('comments')

Meteor.startup ->
	#Fill with dummy data for now, erase this upon production
	if Images.find().count() == 0
		Images.insert({name: "Blah"})

	if FileCollections.find().count() == 0
		FileCollections.insert({name: "Blah2"})

	if Comments.find().count == 0
		Comments.insert({imageId: "blah", content: "TEST", beginFrame: 5, endFrame: 10})
		