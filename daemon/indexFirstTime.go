package main

//Just some notes about using this with HDFWeb. Make a symbolic link from 
import (
	"flag"
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

func main() {
	session, err := mgo.Dial("127.0.0.1:3002")
	if err != nil {
		panic(err)
	}
	flag.Parse()
	if flag.NArg() != 2 {
		fmt.Println("First argument is path to HDF5 files, second is PNG output directory")
	}
	fmt.Print(flag.Arg(0))
	fmt.Printf(flag.Arg(1))
	defer session.Close()

	HDF5FileDirectory := flag.Arg(0)
	PNGOutputDirectory := flag.Arg(1)
	fileList := RemoveInvalidFiles(GetHDFFileList(HDF5FileDirectory))
	fmt.Println("Computed file list...")

	for _, path := range fileList {
		InsertImageIntoDatabase(path, session)
	}
	fmt.Println("Finished inserting images...")
	for _, path := range fileList {
		ConvertHDF5ToPNG(path, PNGOutputDirectory, session)
	}
	fmt.Println("Finished script")
}

//Holds details about an HDF5 file(comments are equivalent in original go program)
//after the demo convert this to work with S3, no file transfers from local machine
type HDF5Image struct {
	Id bson.ObjectId "_id" //letting mongo handle this
	//Path         string //originalPath
	OriginalPath string "originalPath"
	//PNGPath      string //webPath
	WebPath string "webPath"
	// Name         string //baseName
	BaseName string "baseName"
	// FileSize     int64 //size
	Size int64 "size"
	// NumFrames    uint16 //numFrames
	NumFrames uint16 "numFrames"
	// CreatedAt    string //creationDate
	CreationDate string "creationDate"
	// OriginalName string //originalName
	OriginalName string "originalName"
	// Pitch        float64 //op_pitch
	Op_pitch float64 "op_pitch"
	// Flen         float64 //op_flen
	Op_flen float64 "op_flen"
	// Mag          float64 //op_mag
	Op_mag float64 "op_mag"
	// Abbe         bool //op_abbe
	Op_abbe bool "op_abbe"
	// Na           float64 //op_na
	Op_na float64 "op_na"
	// Medium       float64 //op_medium
	Op_medium float64 "op_medium"
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
	session.SetMode(mgo.Monotonic, true)
	c := session.DB("meteor").C("dbtest")

	//gather image data into object here
	newImage := HDF5Image{}
	newImage.OriginalPath = path
	newImage.Id = bson.NewObjectId() // let's let mongo set this to avoid collisions, also commented out in schema
	newImage.BaseName = filepath.Base(path)
	newImage.OriginalName = GetHDF5Attribute("originalName", "images", path)
	fi, _ := os.Stat(path)
	newImage.Size = fi.Size()
	//check for uniquness here, will not add any files which have a basename already in the database
	result := HDF5Image{}
	err := c.Find(bson.M{"originalName": newImage.OriginalName, "size": newImage.Size}).One(&result)
	if err == nil {
		fmt.Println("File already exists in database")
	} else {
		number, _ := strconv.Atoi(GetHDF5Attribute("numFrames", "images", path))
		newImage.NumFrames = uint16(number)
		newImage.CreationDate = GetHDF5Attribute("createdAt", "images", path)
		//inserting default parameters for optics for now, CHANGE THIS
		newImage.Op_pitch = 150
		newImage.Op_flen = 3000
		newImage.Op_mag = 60
		newImage.Op_abbe = false
		newImage.Op_na = 1.4
		newImage.Op_medium = 1.515
		fmt.Println(newImage.BaseName)
		//end default parameters
		err := c.Insert(&newImage)
		if err != nil {
			panic(err)
		}
	}

}
func ConvertHDF5ToPNG(inputPath string, newRootDirectory string, session *mgo.Session) {
	numFrames, _ := strconv.Atoi(GetHDF5Attribute("numFrames", "images", inputPath))
	//start here
	var basePath string
	var newPath string
	var webPath []string
	var webFileName string
	// webPath = append(webPath, stringToAppend)
	c := session.DB("meteor").C("dbtest")
	for i := 0; i < numFrames; i++ {
		extensionString := ":/images/" + strconv.Itoa(i)

		newPath = strings.Join([]string{inputPath, extensionString}, "")
		basePath = filepath.Base(inputPath)
		basePath = strings.Join([]string{basePath, "-", strconv.Itoa(i)}, "") // each frame gets a number at the end
		basePath = strings.Join([]string{basePath, ".png"}, "")
		webFileName = basePath
		webFileName = "/data/" + webFileName
		basePath = strings.Join([]string{newRootDirectory, basePath}, "")
		//fmt.Println(basePath)
		//fmt.Println(newPath)
		//fmt.Println("h5topng", "-r", "-8", newPath, "-o", basePath)
		webPath = append(webPath, webFileName)
		_, err := exec.Command("h5topng", "-r", "-8", newPath, "-o", basePath).Output() //WARNING CHECK OUTPUT, 8 MIGHT BE A PROBLEM
		if err != nil {
			panic(err)
		}
		fmt.Println("Just converted", newPath)
	}
	fmt.Println(inputPath)
	colQuerier := bson.M{"originalPath": inputPath}
	change := bson.M{"$set": bson.M{"webPath": basePath}}
	newErr := c.Update(colQuerier, change)
	if newErr != nil {
		if newErr != mgo.ErrNotFound {
			panic(newErr)
		}
	}
	fmt.Println("Successfully converted", inputPath)

	//incorporate file number, and have each file appended to an array which then is pushed into webpath
	/*pngPath := strings.Join([]string{inputPath, ".png"}, "")
	fmt.Println("Copying from", pngPath, "to", newRootDirectory)
	_, err := exec.Command("cp", pngPath, newRootDirectory).Output()
	if err != nil {
		panic(err)
	}*/

	//find path here
	//result := HDF5Image{}

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
