var Router = Backbone.Router.extend({
  routes: {
    "": "main",
    "help": "help",
    "about": "about",
    "search/:searchTerm": "search",
    "view/:folder": "viewFolder",
    "view/:folder/:filename": "viewFileByName",
    "view/:folder/:filename/:frameidx": "viewFileByName",
    "viewid/:folder/:fileid": "viewFileById",
    "viewid/:folder/:fileid/:frameidx": "viewFileById"
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

  viewFile: function(folder, filename, fileid, frameidx) {
    Session.set("currentView", "fileListing");
    Session.set("currentFolderId", folder);
    Session.set("currentImageId", fileid);
    Template.fileView.setImageSessionVars();
    if (frameidx != null) {
      Session.set("currentFrameIndex", frameidx);
    }
    Session.set("currentImageView", "viewingImage");
    Session.set("currentWebGLMode", "image");
    $("#rendermode").val("image");
    this.navigate('/view/' + folder + '/' + filename + (frameidx != null ? '/' + frameidx : ''));
  },

  viewFileById: function(folder, fileid, frameidx) {
    var filename = Images.findOne(fileid).baseName;
    this.viewFile(folder, filename, fileid, frameidx);
  },

  viewFileByName: function(folder, filename, frameidx) {
    var fileid = Images.findOne({ baseName: filename })._id;
    this.viewFile(folder, filename, fileid, frameidx);
  }
});

urlrouter = new Router;
Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
