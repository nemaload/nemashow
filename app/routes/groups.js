exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving group: ' + id);
    db.collection('groups', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 



exports.findAll = function(req, res) {
    db.collection('groups', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


 
exports.addGroup = function(req, res) {
    var group = req.body;
    console.log('Adding group: ' + JSON.stringify(collectionObject));
    db.collection('groups', function(err, collection) {
        collection.insert(group, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

 
exports.updateGroup = function(req, res) {
    var id = req.params.id;
    var group = req.body;
    console.log('Updating group: ' + id);
    console.log(JSON.stringify(collection));
    db.collection('groups', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, collectionObject, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating group: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(collectionObject);
            }
        });
    });
}
 
exports.deleteGroup = function(req, res) {
    var id = req.params.id;
    console.log('Deleting group: ' + id);
    db.collection('groups', function(err, collection) {
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
