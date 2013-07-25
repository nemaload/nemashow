[![Nemaload Logo](http://nemaload.davidad.org/png/nemaload)](http://nemaload.davidad.org)
_presents_
#Nemashow
Nemashow is a web application which will enable the public to access interactive visualizations of data produced by the [NEMALOAD](http://nemaload.davidad.org) project. Nemashow is built on the [Meteor](http://meteor.com/) framework, and uses [WebGL](http://webgl.org) for visualizations.

##Setup
####NOTE: This material is currently out of date and is in the process of being rewritten.
####If you're interested in setting this up, please [contact us](mailto://michaelschmatz@gmail.com).
###Dependencies
Aside from Meteor itself (`$ curl https://install.meteor.com | sh`) and a WebGL-capable browser (we use the latest [Chrome](https://www.google.com/intl/en/chrome/browser/) builds; you can test your browser [here](http://www.doesmybrowsersupportwebgl.com/)), you'll also need:
* [Meteorite](https://github.com/oortcloud/meteorite): `$ npm install -g meteorite`
* [MongoDB](http://www.mongodb.org/downloads) command-line tools

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

