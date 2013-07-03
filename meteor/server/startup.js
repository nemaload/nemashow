Meteor.startup(function() {
  var fs = Npm.require('fs');
  var cp = Npm.require('child_process');
  console.log("Configuring MongoDB...");
  var mongoConfigure = cp.exec('mongo --host 127.0.0.1:3002 admin --eval "db.runCommand({setParameter:1, textSearchEnabled: true})"', function(error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: ' + error.code);
      console.log('Signal received: ' + error.signal);
    }
    cp.exec("mongo --host 127.0.0.1:3002 meteor --eval 'db.annotations.ensureIndex({comment:\"text\"})'", function(error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: ' + error.code);
        console.log('Signal received: ' + error.signal);
      }
      console.log("MongoDB Configuration done!")
    });
  });



  fs.symlinkSync('../../../../data', '.meteor/local/build/static/data');
});