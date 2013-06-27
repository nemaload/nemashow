![HDFWeb Logo](http://i.imgur.com/6mlZGk6.jpg)

#HDFWeb 
HDFWeb is a web application which enables the public to access interactive visualizations of data produced by the NEMALOAD project. It is written with the Meteor framework, and uses WebGL for visualizations.

##Setup
###Dependencies
There are two dependencies necessary to run the Meteor application: the Meteorite package manager, as well as the MongoDB client tools. 

###Administration
To make a user an administrator, direct database access is required. In the users collection, simply set the "admin" field in the user document in question to "admin".

###Data
If you wish to access the project data set, please contact us.

##Roadmap
HDFWeb's support for light-field visualizations is nearly complete. Our goals for the short term include integrating light-sheet visualizations, improving reusability of workflow utilities, and making the application scalable. 

## Licensing
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

