exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving collection: ' + id);
    db.collection('collections', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 



exports.findAll = function(req, res) {
    db.collection('collections', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


 
exports.addCollection = function(req, res) {
    var collectionObject = req.body;
    console.log('Adding collection: ' + JSON.stringify(collectionObject));
    db.collection('collections', function(err, collection) {
        collection.insert(collectionObject, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

 
exports.updateCollection = function(req, res) {
    var id = req.params.id;
    var collectionObject = req.body;
    console.log('Updating collection: ' + id);
    console.log(JSON.stringify(collection));
    db.collection('collections', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, collectionObject, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating collection: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(collectionObject);
            }
        });
    });
}
 
exports.deleteWine = function(req, res) {
    var id = req.params.id;
    console.log('Deleting collection: ' + id);
    db.collection('collections', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}
