//compile this as a package
package hdfwebdaemon

import (
	"fmt"
	"github.com/sbinet/go-hdf5/pkg/hdf5"
	"labix.org/v2/mgo"
	"labix.org/v2/mgo/bson"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

//Holds details about an HDF5 file(comments are equivalent in original go program)
//after the demo convert this to work with S3, no file transfers from local machine
type HDF5Image struct {
	//Id           bson.ObjectId "_id" //letting mongo handle this
	//Path         string //originalPath
	originalPath string
	//PNGPath      string //webPath
	webPath string
	// Name         string //baseName
	baseName string
	// FileSize     int64 //size
	size int64
	// NumFrames    uint16 //numFrames
	numFrames uint16
	// CreatedAt    string //creationDate
	creationDate string
	// OriginalName string //originalName
	originalName string
	// Pitch        float64 //op_pitch
	op_pitch float64
	// Flen         float64 //op_flen
	op_flen float64
	// Mag          float64 //op_mag
	op_mag float64
	// Abbe         bool //op_abbe
	op_abbe bool
	// Na           float64 //op_na
	op_na float64
	// Medium       float64 //op_medium
	op_medium float64
}

func RunS3Sync(repoAddress, localFolder string) {
	//for us this is s3://nemaload.data
	fmt.Println("Starting sync from S3 to local machine...(this takes a LONG time, do not run until optimized)")
	exec.Command("s3cmd", "sync", repoAddress, localFolder)
	fmt.Println("Completed sync!")
}

func GetHDF5Attribute(attribute string, group string, filepath string) string {
	//example usage:
	//testString := GetHDF5Attribute("createdAt", "images", "/mnt/data_xz/20130301/lensgrid.hdf5")
	out, err := exec.Command("h5dump", "-a", "/"+group+"/"+attribute, filepath).Output()
	if err != nil {
		panic(err)
	}
	outString := string(out)
	var dataLocation int
	dataLocation = strings.LastIndex(outString, "DATA")
	outString = outString[dataLocation:]
	dataLocation = strings.Index(outString, "(0): ")
	outString = outString[dataLocation+5:]
	//find newline
	dataLocation = strings.Index(outString, "\n")
	outString = outString[:dataLocation]
	//stripping quotes
	outString = strings.Replace(outString, "\"", "", -1)
	return outString
}

func GetHDFFileList(rootDirectory string) []string {
	var hdf5files []string

	err := filepath.Walk(rootDirectory, func(path string, file os.FileInfo, err error) error {
		if !file.IsDir() && filepath.Ext(path) == ".hdf5" {
			hdf5files = append(hdf5files, path)
		}
		return nil
	})
	if err != nil {
		fmt.Println("An error occurred while scanning files. Exiting!")
		os.Exit(1)
	}
	return hdf5files
}

func RemoveInvalidFiles(pathList []string) []string {
	for i, filepath := range pathList {
		if !hdf5.IsHdf5(filepath) {
			pathList = pathList[:i+copy(pathList[i:], pathList[i+1:])] // that's a fun delete function
		}
	}
	return pathList
}
func InsertImageIntoDatabase(path string, session *mgo.Session) {
	c := session.DB("meteor").C("images")
	//gather image data into object here
	newImage := HDF5Image{}
	newImage.originalPath = path
	//newImage.Id = bson.NewObjectId() // let's let mongo set this to avoid collisions, also commented out in schema
	newImage.baseName = filepath.Base(path)
	newImage.originalName = GetHDF5Attribute("originalName", "images", path)
	//check for uniquness here, will not add any files which have a basename already in the database
	result = HDF5Image{}
	err := c.Find(bson.M{"originalName": newImage.originalName}).One(&result)
	if err == nil {
		print "File already exists in database according to baseName, skipping..."
	}else {
		print err
		fi, _ := os.Stat(path)
		newImage.size = fi.Size()
		number, _ := strconv.Atoi(GetHDF5Attribute("numFrames", "images", path))
		newImage.numFrames = uint16(number)
		newImage.creationDate = GetHDF5Attribute("createdAt", "images", path)
		//inserting default parameters for optics for now, CHANGE THIS
		newImage.op_pitch = 150
		newImage.op_flen = 3000
		newImage.op_mag = 60
		newImage.op_abbe = false
		newImage.op_na = 1.4
		newImage.op_medium = 1.515
		//end default parameters
		err := c.Insert(&newImage)
		if err != nil {
			panic(err)
		}
	}

}
func ConvertHDF5ToPNG(inputPath string, newRootDirectory string, session *mgo.Session) {

	newPath := strings.Join([]string{inputPath, ":/images/0"}, "")
	fmt.Println("Saving to", newPath)
	_, err := exec.Command("h5topng", "-r","-8", newPath).Output() //WARNING CHECK OUTPUT, 8 MIGHT BE A PROBLEM
	if err != nil {
		panic(err)
	}
	fmt.Println("Just converted", newPath)
	basePath := filepath.Base(inputPath)
	basePath = strings.Join([]string{basePath, ".png"}, "")
	basePath = strings.Join([]string{newRootDirectory, basePath}, "")

	pngPath := strings.Join([]string{inputPath, ".png"}, "")
	fmt.Println("Copying from", pngPath, "to", newRootDirectory)
	_, err = exec.Command("cp", pngPath, newRootDirectory).Output()
	if err != nil {
		panic(err)
	}

	//find path here
	//result := HDF5Image{}
	c := session.DB("meteor").C("images")

	colQuerier := bson.M{"originalPath": inputPath}
	change := bson.M{"$set": bson.M{"webPath": basePath}}
	fmt.Println("Set PNG path to", basePath)
	newErr := c.Update(colQuerier, change)
	if newErr != nil {
		panic(newErr)
	}
}

/*func TestDB() {
	session, err := mgo.Dial("localhost")
	if err != nil {
		panic(err)
	}
	defer session.Close()

	c := session.DB("test").C("files")
	err = c.Insert(&HDF5Image{bson.NewObjectId(), "/mnt/blah.hdf5", "blah.hdf5", int64(42)})
	if err != nil {
		panic(err)
	}
	result := HDF5Image{}
	err = c.Find(bson.M{"name": "blah.hdf5"}).One(&result)
	if err != nil {
		panic(err)
	}

	fmt.Println("Name:", result.Name, "ID:", result.Id)

}*/

func TestAttributes() {
	testString := GetHDF5Attribute("createdAt", "images", "/mnt/data_xz/20130301/lensgrid.hdf5")
	fmt.Println(testString)
}
