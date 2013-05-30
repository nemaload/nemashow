exports.metaFindById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving dataset: ' + id);
    db.collection('datasets', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.dataFindById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving dataset: ' + id);
    db.collection('datasets', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 



exports.metaFindAll = function(req, res) {
    db.collection('datasets', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


 
exports.addDataset = function(req, res) {
    var dataset = req.body;
    console.log('Adding dataset: ' + JSON.stringify(collectionObject));
    db.collection('datasets', function(err, collection) {
        collection.insert(dataset, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

 
exports.updateDataset = function(req, res) {
    var id = req.params.id;
    var dataset = req.body;
    console.log('Updating dataset: ' + id);
    console.log(JSON.stringify(collection));
    db.collection('datasets', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, collectionObject, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating dataset: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(collectionObject);
            }
        });
    });
}
 
exports.deleteDataset = function(req, res) {
    var id = req.params.id;
    console.log('Deleting dataset: ' + id);
    db.collection('datasets', function(err, collection) {
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
