Template.mainView.isViewing = function(view) {
	return Session.get("currentView") === view;
}