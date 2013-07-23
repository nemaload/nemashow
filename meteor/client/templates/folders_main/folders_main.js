Template.folders_main.children = function(parentId) {
        //call stack error lies here
        if (Session.get("loadedLiveData")) {
                return Folders.find({
                        parent: parentId
                });
        }
        else
                return localCollection.find({parent: parentId});

}

Template.folders_main.hasChildren = function(parentId) {
        var numFolders = (Session.get("loadedLiveData")) ? Folders.find({parent: parentId}).count() : localCollection.find({parent: parentId}).count();
        if (numFolders > 0) {
                return true;
        } else {
                return false;
        }
}

Template.folders_main.isCurrentFolder = function(folder) {
        return Template.folders.isCurrentFolder(folder);
}
