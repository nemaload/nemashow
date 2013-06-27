Template.folders.foldersTop = function() {

  return Folders.find({
    parent: null
  });
}

Template.folders.isCurrentFolder = function(folder) {
  return Session.get("currentFolderId") === folder;
}

Template.folders.events = {
  'click .folderLi': function(e) {
    e.preventDefault();
    Session.set("currentFolderId", $(e.target).attr("id"));
    Session.set("currentView", "fileListing");
  },
  'dragover .folderLi': function(e, t) {
    e.preventDefault();
    $(e.target).addClass('dragover');

  },
  'dragover #topLevelFolder': function(e, t) {
    e.preventDefault();
    $(e.target).addClass('dragover');
  },
  'dragleave #topLevelFolder': function(e, t) {
    e.preventDefault();
    $(e.target).removeClass('dragover');
  },
  'dragleave .folderLi': function(e, t) {
    e.preventDefault();
    $(e.target).removeClass('dragover');
  },
  'drop .folderLi': function(e, t) {
    e.preventDefault();
    console.log(e.dataTransfer.getData('folderId'));
    e.dataTransfer.dropeffect = 'move';
    if (e.dataTransfer.getData('folderId') == "") {
      Meteor.call('moveFileToFolder', $.trim(e.dataTransfer.getData('text')), $(e.target).attr('id'), function(err, result) {
        if (err) {
          alert("There was an error");
        } else if (result !== "Success") {
          alert(result);
        }
        $(e.target).removeClass('dragover');
      });
    } else if (e.dataTransfer.getData('folderId') !== "") {
      Meteor.call('moveFolderToFolder', $.trim(e.dataTransfer.getData('folderId')), $(e.target).attr('id'), function(err, result) {
        if (err) {
          alert("There wasn an error");
        } else if (result !== "Success") {
          alert(result);
        }
        $(e.target).removeClass('dragover');
      });
    }
    //edit this to make the differentiation between folders and images
  },
  'dragstart li.folderLi': function(e, t) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('folderId', $.trim($(e.target).children().clone().remove().end().attr('id')));
  },
  'drop #topLevelFolder': function(e, t) {
    e.preventDefault();
    e.dataTransfer.dropeffect = 'move';
    if (e.dataTransfer.getData('folderId') == "") {
      alert("All files must be in a folder.");
    } else if (e.dataTransfer.getData('folderId') !== "") {
      Meteor.call('moveFolderToFolder', $.trim(e.dataTransfer.getData('folderId')), null, function(err, result) {
        if (err) {
          alert("There was an error.");
        } else if (result !== "Success") {
          alert(result);
        }
        $(e.target).removeClass('dragover');
      });
    }

  },
  'click #addFolder': function(e) {
    e.preventDefault();
    var folderName = prompt("Enter folder name: ");
    //add validation here
    if (folderName == null) {
      return;
    }
    Meteor.call('makeFolder', folderName, function(err, result) {
      if (err) {
        alert("There was an error.");
      } else if (result !== "Success") {
        alert(result);
      }
    });
  }
}