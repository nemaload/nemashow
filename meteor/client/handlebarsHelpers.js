 Handlebars.registerHelper('isAdmin', function() {
  Meteor.call('isAdmin', function (err, result) {
    if (err || result ==false) {
      Session.set("isAdmin", false);
    }
    else if (result == true) {
      Session.set("isAdmin", true);
    }
  });
  return Session.get("isAdmin");
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