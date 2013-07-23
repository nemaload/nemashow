#!/usr/bin/env python

import subprocess
import json
import sys

#usage is ./insertPreloadData.py [outputfile] [username] [password] [url] [collection #1 #2 #3 ... #n]
#appends to outputfile
originalCollectionNames = sys.argv[5:]
outputFile = str(sys.argv[1])
username = str(sys.argv[2])
password = str(sys.argv[3])
mongoURL = str(sys.argv[4])
insertionStringArray = []
for originalCollectionName in originalCollectionNames:
        print "Getting remote mongo data..."
        #call the mongo command for getting the JSON
        p = subprocess.Popen(["mongo",mongoURL,"-u",username,"-p" + password,"-quiet","--eval","printjson(db."+ originalCollectionName + ".find().toArray())"], stdout=subprocess.PIPE)
        resultjsons = p.communicate()[0]
        collectionJSON = json.loads(resultjsons)
        for document in collectionJSON:
                insertionString = "localCollection.insert(" + json.dumps(document)[:-1] + ",originalCollection: \"" + originalCollectionName + "\"})"
                insertionStringArray.append(insertionString)

#open the optimizationdata.js file in the repository
with open(outputFile,"a") as optimizationFile:
        for insertionString in insertionStringArray:
                optimizationFile.write(insertionString)
                optimizationFile.write("\n")
