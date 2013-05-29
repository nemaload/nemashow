#HDFWeb API Specificaiton
This document specifies the API of HDFWeb, a system designed to allow remote viewing of images stored in the HDF5 file format in-browser. 

This software is being developed for NEMALOAD's visualizations, however after it's initial release it will probably be generalized so that it can be reused for other scientific visualizations.

## Resources
(NOTE: *ALL* IDs must be unique)

### Collections
Collections consist of one or more HDF5 files.
* GET collections/list
  * Returns all names and IDs of collections on the server.
* GET collections/files/:collectionID
	* Returns a list of all files and file IDs in the specified collection

### Files

Files consist of one or more groups. They also have non-HDF5 related properties such as size and modification date.
* GET files/details/:fileID
	* Get the file metadata(size and date modified)
* GET files/groups/:fileID
	* Get a list of groups in the given file.

### Groups

Groups consist of one or more datasets, each representing an image frame in the current use case.
* GET groups/datasets/:groupID
	* Get a list of datasets in the given group
* GET groups/metadata/:groupID
	* Get the HDF5 metadata of the given group

### Datasets

Datasets are multidimensional arrays containing grayscale image data. These correspond to image frames. These also may contain metadata.
* GET datasets/data/:datasetID
	* Returns a representation of the data in the given dataset.
* GET datasets/metadata/:datasetID
	* Returns the metadata of the given dataset.

### Implementation
As I mentioned before, all resources must have a unique ID for this system to work. This can be accomplished by assigning a unique hash as the identifier of each resource in the database.

The frontend of the app will be MVCesque, implemented in a framework such as Backbone.

