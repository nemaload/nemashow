[![Nemaload Logo](http://nemaload.davidad.org/png/nemaload)](http://nemaload.davidad.org)

#NEMASHOW

Nemashow is a web application which enables the public to access interactive visualizations of data produced by the [NEMALOAD](http://nemaload.davidad.org) project. Nemashow is built on the [Meteor](http://meteor.com/) framework, and uses [WebGL](http://webgl.org) for visualizations.

##Setup
###Overview
The process of getting a working copy of NEMASHOW can be grouped into several broad steps:
	
1. Ensuring your setup meets the necessary requirements and has the necessary dependencies
2. Downloading the repositories and, optionally, the project dataset
3. Running setup scripts

###Requirements
####Browser
A WebGL capable browser is necessary to view the visualizations(we use the latest [Chrome](https://www.google.com/intl/en/chrome/browser/) builds; you can test your browser [here](http://www.doesmybrowsersupportwebgl.com/).) Support for other browsers is not guaranteed.

####Operating System
#####Running NEMASHOW
In production, NEMASHOW runs on servers running Ubuntu 13.04. However, development takes place on other Linux distributions, as well as Mac OS X.

#####Viewing NEMASHOW
Usually, if a WebGL capable browser can be successfully installed and tested, NEMASHOW will work.

One notable exception is light-sheet visualizations with the prerelease version of Mac OSX 10.9, due to a strange bug involving Cross Origin Resource Sharing. However, this OS version can be used when the light-sheet images and web app are hosted on the same server.

####Storage Space
If you'd like to store the raw dataset, ~30GB of space is necessary. To store the PNG renderings of the files, ~7GB is necessary. 

###Dependencies
####Meteor
The easiest way to install [Meteor](http://www.meteor.com/) is to run the command `$ curl https://install.meteor.com | sh` on a [supported platform.](https://github.com/meteor/meteor/wiki/Supported-Platforms)

####Meteorite
We use several Meteorite packages in the NEMASHOW application. This package is best installed with [npm](http://nodejs.org/download/) using the command `npm install -g meteorite`.

####MongoDB
The [MongoDB command line tools](http://www.mongodb.org/downloads) are necessary to run some setup scripts.

####Python Libraries
If you choose to run the HDF server or computation server, several Python libraries are required as well as their various dependencies, including:

* Tables
* MatplotLib
* SciPy


###Data
The application expects to find data in `meteor/data` (absent from this repository). The actual dataset is many gigabytes; while we are currently working to make it publicly available, for now just contact us if you're interested.

###Usage
To run the website, run the `mrt` command from the `meteor` directory and point your browser at `http://localhost:3000/`.
To access lightsheet images data, you also need to run the `./simple-hdf-server.py ../data` command, where `../data` is the directory holding HDF5 lightsheet data files.
To access lightsheet bounding box plotting functionality, also run the `./computation-server.py ../data` command.

###Administration
To make a user an administrator, direct database access is required. In the `db.users` collection, simply set a user's `admin` field to `"admin"`.

##Roadmap
Nemashow's support for light-field visualizations is nearly complete. Our goals for the short term include integrating light-sheet visualizations, improving reusability of workflow utilities, and making the application scalable for public deployment. 

## License
This program is free software: you can redistribute it and/or modify it under the terms of the [GNU General Public License](http://www.gnu.org/licenses/gpl.html) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the [GNU General Public License](http://www.gnu.org/licenses/gpl.html) for more details.

