Session.setDefault("currentFolderId", null);
Session.setDefault("userIsAdmin", false);
Session.setDefault("currentView", "viewingFirstScreen");
Session.setDefault("currentImageId", null);
Session.setDefault("currentImageView", "viewingNothing");
Session.setDefault("currentImageType", "ls");
Session.setDefault("currentWebGLMode", "3d");
Session.setDefault("currentFrameIndex", 0); //frameindex
Session.setDefault("startFrameIndex", 0);
Session.setDefault("endFrameIndex", 0);
Session.setDefault("currentSearchTerm", "");
Session.setDefault("searchJSON", "{}");
//image slider related things
Session.setDefault("currentImageNumFrames", 1);
Session.setDefault("imageSliderMin", 0);
Session.setDefault("imageSliderMax", 0);
Session.setDefault("currentAnnotationId", "");
//Annotation related functions
Session.setDefault("writingComment", false);
Session.setDefault("viewingAnnotation", false);
//rendering related things
Session.setDefault("currentImageGain", 0);
Session.setDefault("currentImageGamma", 1);
Session.setDefault("currentImageZoom", 0);
Session.setDefault("showGrid", false);
Session.setDefault("showGridUV", false);
//worm pose information
// XXX hardcoded defaults; should be stored near backbone in .json, or in mongodb
// XXX always overriden in Template.webgl.created()
Session.setDefault("currentPoseZoom", 0.2);
Session.setDefault("currentPoseShift", 0);
Session.setDefault("currentPoseAngle", 0);

//How to change to local rendering mode
Session.setDefault("useAmazonData",true);

//Preloading
Session.setDefault("loadedLiveData",false);
