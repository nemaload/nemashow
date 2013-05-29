![HDFWeb Logo](http://i.imgur.com/6mlZGk6.jpg)
#HDFWeb Specification
This document specifies the API of HDFWeb, a system designed to allow remote viewing of images stored in the HDF5 file format in-browser. 

This software is being developed for NEMALOAD's visualizations, however after it's initial release it will probably be generalized so that it can be reused for other scientific visualizations.

This software is pre-alpha, so all of this is subject to change quite often.
##API 
### Resources

Note, only GET is meant to be used by the web app and end user(for now). The others are for scripts which maintain the app by interacting with the files at a lower level.

#### Collections
Collections consist of one or more HDF5 files.
* GET collections
	* Returns all names and IDs of collections on the server.

```GET collections```
```json
{
   "collections":[
      {
         "name":"worms",
         "id":"5sa35gbmle"
      },
      {
         "name":"flies",
         "id":"2za32gb5el"
      }
   ]
}
```

* GET collections/:id
	* Returns a list of all files and file IDs in the specified collection

```GET collections/2za32gb5el```	
```json
{
   "files":[
      {
         "name":"Epi_63xZeiss_1.4_3beads_w_lenses1.hdf5",
         "id":"AofWKYWz6Q"
      },
      {
         "name":"Kohler_63xZeiss_1.4_pollen_wo_lenses.hdf5",
         "id":"GiELmFmpdZ"
      }
   ]
}
```

* POST collections
	* Creates a new collection with the specified name.
* PUT collections/:id
	* Updates the specified collection by adding files through their id.
* DELETE collections/:id
	* Deletes the specified collection.

#### Files

Files consist of one or more groups. They also have non-HDF5 related properties such as size and modification date.
* GET files
	* Get a list of all files

```GET files```
```json

{
    "files":[{
            "name": "Epi_63xZeiss_1.4_3beads_w_lenses1.hdf5",
            "id": "AofWKYWz6Q"
        }, {
            "name": "Kohler_63xZeiss_1.4_pollen_wo_lenses.tif",
            "id": "GiELmFmpdZ"
        }, {
            "name": "MT21063_video11.hdf5",
            "id": "66vd2RGEXm"
    }]

}
```
* GET files/:id
	* Get the metadata of the given file

``` GET files/66vd2RGEXm```
```json
{
   "metadata":[
      {
         "name":"MT21063_video11.hdf5",
         "size":2367970585,
         "modified":"2003-08-04 12:30:45",
         "path":"/this/is/not/secure/so/needs/authentication/at/some/point",
         "groups":[
            {
               "name":"frames",
               "id":"CkaRvZe3A5"
            }
         ]
      }
   ]
}
```
* POST files
	* Registers a file in the database from it's path on the machine.
* PUT files/:id
	* Queues an update of that file's data by the maintenance script
* DELETE files/:id
	* Deletes a file from the database(stays on local machine)

#### Groups

Groups consist of one or more datasets, each representing an image frame in the current use case.

* GET groups/:id
	* Get the HDF5 metadata of the given group.

```GET groups/CkaRvZe3A5```
```json
{
   "metadata":[
      {
         "name":"frames",
         "size":1,
         "attributes":[
            {
               "createdAt":[
                  {
                     "value":"2013-05-25 04:01:45",
                     "type":"String, length=19",
                     "size":1
                  }
               ]
            },
            {
               "numFrames":[
                  {
                     "value":1,
                     "type":"64-bit integer",
                     "size":1
                  }
               ]
            },
            {
               "originalName":[
                  {
                     "value":"Epi_63xZeiss_1.4_3beads_w_lenses1.hdf5",
                     "type":"String, length=33",
                     "size":1
                  }
               ]
            }
         ]
      }
   ]
}
```
* POST groups
	* Adds a group
* PUT groups/:id
	* Updates a group
* DELETE groups/:id
	* Removes a group

#### Datasets

Datasets are multidimensional arrays containing grayscale image data. These correspond to image frames. These also may contain metadata.
* GET datasets/metadata
	* Returns metadata information on all datasets
* GET datasets/metadata/:id
	* Returns the metadata of the given dataset.
* GET datasets/data/:id
	* Returns the link to the  PNG representation of the given dataset
* POST datasets
	* Adds a dataset
* PUT datasets/:id
	* Edits a dataset
* DELETE datasets/:id
	* Deletes a dataset


### Implementation
As I mentioned before, all resources must have a unique ID for this system to work. This can be accomplished by assigning a unique hash as the identifier of each resource in the database.

The frontend of the app will be MVCesque, implemented in a framework such as Backbone.

