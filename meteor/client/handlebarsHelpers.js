 //handlebars helper functions
  Handlebars.registerHelper('isAdmin', function() { 
    return Meteor.call('isAdmin');
  });

  //a smarter each to retrieve children
  Handlebars.registerHelper('each_children', function(context, options) {
    var ret = "";
    Template.folders.children(context).forEach(function(child) {
      ret = ret + options.fn(child);
    });
    return ret;

  });

  Handlebars.registerHelper('labelBranch', function(label, options) {
    var data = this;
    return Spark.labelBranch(label, function() {
      return options.fn(data);
    });
  });
