package main

import "fmt"
import "labix.org/v2/mgo"
import "labix.org/v2/mgo/bson"
import "nemaload/hdfwebdaemon"

func main() {
	session, err := mgo.Dial("localhost")
	if err != nil {
		panic(err)
	}
	defer session.Close()

	fileList := hdfwebdaemon.RemoveInvalidFiles(hdfwebdaemon.GetHDFFileList("/mnt/"))
	for _, path := range fileList {
		hdfwebdaemon.insertImageIntoDatabase(path, session)
	}

}
