var express = require('express'),
	collections = require('./routes/collections'),
	files = require('./routes/files'),
	groups = require('./routes/groups'),
	datasets = require('./routes/datasets');
 
var app = express();

app.configure(function () {
	app.use(express.logger('default'));
	app.use(express.bodyParser());
});

//Database related stuff
var mongo = require('mongodb');

var Server = mongo.Server;
var	Db = mongo.Db;
var	BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('test', server);
//change this later
db.open(function (err, db) {
	if(!err) {
		console.log("Successfully connected to database");
		db.collection('collections', {strict:true}, function(err, collection) {
			if (err) {
				console.log("Collections collection is empty!")
			}
		});
		db.collection('files', {strict:true}, function(err, collection) {
			if (err) {
				console.log("files collection is empty!")
			}
		});
		db.collection('groups', {strict:true}, function(err, collection) {
			if (err) {
				console.log("groups collection is empty!")
			}
		});
		db.collection('datasets', {strict:true}, function(err, collection) {
			if (err) {
				console.log("datasets collection is empty!")
			}
		});
	}
});


 
//add put, delete, etc TO BE USED BY SCRIPTS ONLY
//Collection related stuff
app.get('/collections', collections.findAll);
app.get('/collections/:id', collections.findById);
app.post('/collections', collections.addCollection);
app.put('/collections/:id', collections.updateCollection);
app.delete('/collections/:id', collections.deleteCollection); //only removes from app, NOT SYSTEM

//File related stuff
app.get('/files', files.findAll);
app.get('/files/:id', files.findById);
app.post('/files', files.addFile);
app.put('/files/:id', files.updateFile);
app.delete('/files/:id', files.deleteFile);

//Group related stuff
app.get('/groups', groups.findAll);
app.get('/groups/:id', groups.findById);
app.post('/groups', groups.addGroup);
app.put('/groups/:id', groups.updateGroup);
app.delete('/groups/:id', groups.deleteGroup);

//Dataset related stuff
//Add metadata/data separation
app.get('/datasets/metadata', datasets.metaFindAll);
app.get('/datasets/metadata/:id', datasets.metaFindById);
app.get('/datasets/data/:id', datasets.dataFindById);
app.post('/datasets', datasets.addDataset);
app.put('/datasets/:id', datasets.updateDataset);
app.delete('/datasets/:id', datasets.deleteDataset);




app.listen(9000);
console.log('Listening on port 9000...');