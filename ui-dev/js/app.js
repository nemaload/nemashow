//$(function() {
	
	//Todo
	//change /collections to /groups in the spec for the top organization level
	
	
	
	//first let's define our models
	
	//These represent groups of files, for instance, light-field microscopy and light-sheet microscopy. 
	var FileGroup = Backbone.Model.extend({ 
		
		//the default values(really just a way for me to keep track of these things
		defaults: function() { 
			return {
				id: "emptyID", //the database ID of the group object
				name: "Emtpy file group", // the name of the group
				numFiles: 0 //the number of files it contains
			};
		}
	});
	
	//These represent actual images/imagesets.
	var Image = Backbone.Model.extend({
		
		//this default represents a light-sheet image
		defaults: function() {
			return {
				id: "emptyID", //the database ID of the image object
				name: "emptyImage", //the base name of the image
				size: 0, //the size of the file in bytes
				frames: [], //an array containing the frame paths on server in PNG form
				metadata: {
					createdAt: "1970-01-01T00:00:00Z", //time file was created in ISO8601
					numFrames: 0, //the number of frames in the Image
					originalName: "emptyOriginalName", //the original name of the image
					opticalSystem: "LS", // the name of the optical system used(either LS or LF)
					op_pitch: 0, // the microlens array pitch in um
					op_flen: 0, // the microlens focal length in um
					op_mag: 0, //the objective magnification in times
					op_na: 0, //the objective NA
					op_medium: 0 //the refractive index of the medium
				}
				
			};
		}
	});
	
	//These represent annotations on image objects
	var Annotation = Backbone.Model.extend({
		
		defaults: function() {
			return {
				id: "emptyID", //the database ID of the comment object
				userId: "emptyUserId", //the database ID of the user that made the comment,
				imageId: "emtpyImageId", //the database ID of the image in question
				beginningFrame: 0, //the beginning frame sequence in question
				endFrame:0, //the end of the frame sequence in question
				annotation: "empty annotation", //the actual annotation itself
				createdAt: "1970-01-01T00:00:00Z", //creation date
				editedAt: "1970-01-01T00:00:00Z" // edit date
			};
		}
	});
	
	
	//Now let's define some collections(these URLs need to be changed, don't want to fetch everything at once)
	
	var FileGroupList = Backbone.Collection.extend({
		
		model: FileGroup,
		
		url:'/groups'
		
	});
	
	var ImageList = Backbone.Collection.extend({
		
		model: Image,
		
		url:'/images'
	});
	
	var AnnotationList = Backbone.Collection.extend({
		
		model: Annotation,
		
		url:'/annotations'
	});
	
	//now for the views
	
	
	//Filegroup related views
	
	//this one goes on the sidebar to display filegroups
	var FileGroupView = Backbone.View.extend({
		tagName: 'div', //this is meant to go on the sidebar
		id: 'filegroup-li',
		
		events: {
			"click li": "alertStatus"
		},
		
		alertStatus: function(e){
		//e.preventDefault();
			//$('#imageViewSpan').html(this.model.toJSON().name);
			
		},
		
		template: _.template('<li><a href="#images/1<%= id %>"><%= name %></a></li>'),
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
		
	});
	
	var FileGroupListView = Backbone.View.extend({
	
		initialize: function() {
			this.collection.on('add', this.addOne, this);
			this.collection.on('reset', this.addAll, this);
		},
		
		addOne: function(fileGroup){
			var fileGroupView = new FileGroupView({model: fileGroup});
			this.$el.append(fileGroupView.render().el);
		},
		
		addAll: function() {
			this.collection.forEach(this.addOne, this);
		},
		
		render: function() {
			this.addAll();
		}
	});
	
	//Image related views
	
	var ImageView = Backbone.View.extend({
		tagName: 'tr',
		id: 'image-li',
		
		events: {
			"click h3": "alertStatus"
		},
		
		alertStatus: function(e){
			alert('You clicked me!');
		},
		
		template: _.template('<td><%= id %></td><td><%= name %></td><td><%= size %></td>'),
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
		
			
	});
	
	var ImageListView = Backbone.View.extend({
		initialize: function() {
			this.collection.on('add', this.addOne, this);
			this.collection.on('reset', this.addAll, this);
		},
		
		addOne: function(image){
			var imageView = new ImageView({model: image});
			this.$el.append(imageView.render().el);
		},
		
		addAll: function() {
			this.collection.forEach(this.addOne, this);
		},
		
		render: function() {
			this.addAll();
		}
	});
	
	
	//Routing
	
	
	
	
	
	
	//All below is just testing stuff, ignore...
	
	
	//test data
	
	//filegroups
	var fileGroups = [
	{id:"asdf215ie0", name: "Light-field", numFiles: 50},
	{id:"hfdhrdthw3", name: "Light-sheet", numFiles:30}
	];
	
	var images1 = [
	{id:"1", name:"test1", size:50},
	{id:"2", name:"test2", size:70}
	];
	

	//Initialize some objects
	
	var imageList = new ImageList();
	var fileGroupList = new FileGroupList();
	fileGroupList.reset(fileGroups);
	
	//Initialize views
	var fileGroupListView = new FileGroupListView({collection: fileGroupList});
	
	fileGroupListView.render();
	
	imageList.reset(images);
	var imageListView = new ImageListView({collection: imageList});
	//imageListView.render();
	
	$('#fileGroupSidebar').append(fileGroupListView.el);
	
	//Fetch data from the server
	//fileGroupList.fetch();
	//imageList.fetch();
	
	
	//deal with routing here
	var AppRouter = Backbone.Router.extend({
		routes: {
			"images/:id": "showImage",
			"collections/:id":"showCollection",
			"home": "goHome"
		}
	});
	
	var app_router = new AppRouter;
	
	
	app_router.on('route:showImage', function(id) {
		$('#mainPageSpan').html($('#imageTable').html());
		$('#imageTableBody').append(imageListView.render().el.childNodes);
	});
	
	Backbone.history.start();
	
	
	
	
	
//});