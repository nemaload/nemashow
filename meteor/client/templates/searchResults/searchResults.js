Template.searchResults.currentSearchTerm = function() {
  return Session.get("currentSearchTerm");
}

Template.searchResults.searchResultsIntermediate = function() {
  var query = Session.get("currentSearchTerm");
  Meteor.call("search", ".*" + query.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + ".*", "full", function(err, result) {
    if (result.length == 0) {
      result = [];
    }
    var json_result = JSON.stringify(result);
    Session.set("searchJSON", json_result);
  });
}

Template.searchResults.searchResults = function() {
  Template.searchResults.searchResultsIntermediate();
  var searchObject = JSON.parse(Session.get("searchJSON"));
  if (typeof(searchObject) == "undefined") {
    return;
  }
  var returnObject = [];
  for (var i = 0; i < searchObject.length; i++) {
    var id = searchObject[i]._id;
    var userName = Meteor.users.findOne(searchObject[i].userId).emails[0].address;
    var comment = searchObject[i].comment;
    var imageName = Images.findOne(searchObject[i].imageId).baseName;
    if (typeof(imageName) == "undefined") {
      imageName = "undefined";
    }
    var startFrame = searchObject[i].startFrame;
    var endFrame = searchObject[i].endFrame;
    returnObject.push({
      _id: id,
      user: userName,
      comment: comment,
      imageName: imageName,
      startFrame: startFrame,
      endFrame: endFrame
    });
  }
  console.log(returnObject);
  return returnObject;
}

Template.searchResults.events = {
  'click .fileViewRow': function(e) {
    var image = Images.findOne(Annotations.findOne($(e.target).parent().attr("annotationId")).imageId)._id;
    console.log(image);
    Session.set("currentImageId", image);
    Template.fileView.setImageSessionVars();
    Session.set("currentImageView", "viewingImage");
    Session.set("viewingAnnotation", false);
    $("body").animate({
      scrollTop: $(document).height()
    }, 1000); //perhaps make this more sophisticated with a callback later
  }
}