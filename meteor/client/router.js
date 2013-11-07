var Router = Backbone.Router.extend({
  routes: {
    "": "main",
    "help": "help",
    "about": "about",
    "search/:searchTerm": "search",
    "view/:folder": "viewFolder",
    "view/:folder/:filename": "viewFileByName",
    "viewid/:folder/:fileid": "viewFileById"
  },

  main: function() {
    Session.set("currentView", "viewingFirstScreen");
    Session.set("currentImageView", "viewingNothing");
    this.navigate('/');
  },

  help: function() {
    Session.set("currentView", "viewingHelp");
    Session.set("currentImageView", "viewingNothing");
    this.navigate('/help');
  },

  about: function() {
    Session.set("currentView", "viewingAbout");
    Session.set("currentImageView", "viewingNothing");
    this.navigate('/about');
  },

  search: function(searchTerm) {
    Session.set("currentView", "searchResults");
    Session.set("currentSearchTerm", searchTerm);
    Session.set("currentImageView", "viewingNothing");
    this.navigate('/search/' + searchTerm);
  },

  viewFolder: function(folder) {
    Session.set("currentView", "fileListing");
    Session.set("currentFolderId", folder);
    Session.set("currentImageView", "viewingNothing");
    this.navigate('/view/' + folder);
  },

  viewFile: function(folder, filename, fileid) {
    Session.set("currentView", "fileListing");
    Session.set("currentFolderId", folder);
    Session.set("currentImageId", fileid);
    Template.fileView.setImageSessionVars();
    Session.set("currentImageView", "viewingImage");
    Session.set("currentWebGLMode", "image");
    $("#rendermode").val("image");
    this.navigate('/view/' + folder + '/' + filename);
  },

  viewFileById: function(folder, fileid) {
    var filename = Images.findOne(fileid).baseName;
    this.viewFile(folder, filename, fileid);
  },

  viewFileByName: function(folder, filename) {
    var fileid = Images.findOne({ baseName: filename })._id;
    this.viewFile(folder, filename, fileid);
  }
});

urlrouter = new Router;
Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
