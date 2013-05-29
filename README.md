#HDFWeb API Specification
This document specifies the API of HDFWeb, a system designed to allow remote viewing of images stored in the HDF5 file format in-browser. 

This software is being developed for NEMALOAD's visualizations, however after it's initial release it will probably be generalized so that it can be reused for other scientific visualizations.

This software is pre-alpha, so all of this is subject to change quite often.

## Resources

Note, only GET is meant to be used by the web app and end user(for now). The others are for scripts which maintain the app by interacting with the files at a lower level.

### Collections
Collections consist of one or more HDF5 files.
* GET collections
	* Returns all names and IDs of collections on the server.

```json
{
    [{
            name: "worms",
            id: "5sa35gbmle"
        }, {
            name: "flies",
            id: "2za32gb5el"
        }
    ]
}
```

* GET collections/:id
	* Returns a list of all files and file IDs in the specified collection
	
```json
{
    [{
            name: "Epi_63xZeiss_1.4_3beads_w_lenses1.hdf5",
            id: "AofWKYWz6Q"
        }, {
            name: "Kohler_63xZeiss_1.4_pollen_wo_lenses.tif",
            id: "GiELmFmpdZ"
        }
    ]
}
```

* POST collections
	* Creates a new collection with the specified name
* PUT collections/:id
	* Updates the specified collection
* DELETE collections/:id
	* Deletes the specified collection.

### Files

Files consist of one or more groups. They also have non-HDF5 related properties such as size and modification date.
* GET files
	* Get the file metadata(size and date modified)
* GET files/:id
	* Get a list of groups in the given file.
* POST files
	* Adds a file
* PUT files/:id
	* Updates a file
* DELETE files/:id
	* Deletes a file

### Groups

Groups consist of one or more datasets, each representing an image frame in the current use case.
* GET groups
	* Get a list of datasets in the given group
* GET groups/:id
	* Get the HDF5 metadata of the given group
* POST groups
	* Adds a group
* PUT groups/:id
	* Updates a group
* DELETE groups/:id
	* Removes a group

### Datasets

Datasets are multidimensional arrays containing grayscale image data. These correspond to image frames. These also may contain metadata.
* GET datasets/metadata
	* Returns metadata information on all datasets
* GET datasets/metadata/:id
	* Returns the metadata of the given dataset.
* GET datasets/data/:id
	* Returns the PNG representation of the given dataset
* POST datasets
	* Adds a dataset
* PUT datasets/:id
	* Edits a dataset
* DELETE datasets/:id
	* Deletes a dataset


### Implementation
As I mentioned before, all resources must have a unique ID for this system to work. This can be accomplished by assigning a unique hash as the identifier of each resource in the database.

The frontend of the app will be MVCesque, implemented in a framework such as Backbone.

