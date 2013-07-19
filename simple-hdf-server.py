#!/usr/bin/python
# This is a simple HTTP server for serving resources in the static/ diretory
# and lightsheet HDFv5 data. It is really quick'n'dirty just for experiments
# and will be replaced by something more proper very soon.
#
# Usage:
# ./simple-hdf-server.py static/ ../lightsheet/
# then go to URL http://localhost:8001/
#
# HTTP API:
# * This is NOT based on the specification in README.md since we preprocess
#   the HDF5 data on the server side. This may or may not be good idea in the
#   future, here we just do it for simplicity's sake.
# * By default, all URLs are searched in the static_dir.
# * /lightsheet/ returns a list of lightsheet HDF5 files.
# * /lightsheet/<filename>/ returns file metadata (# of channels and groups -
#   z-sweeps).
# * /lightsheet/<filename>/<channel>/<group>/json returns z-sweep frames metadata
# * /lightsheet/<filename>/<channel>/<group>/png returns z-sweep frames imgdata PNG


### Settings

# The following paths assume that ./simple-hdf-server.py will be executed
# from the Git project root directory. They can be overriden on the command
# line.

# This is directory with the static files to be served.
static_dir = "static/"
# This is directory with the HDF5 files to be served in the /lightsheet/
# HTTP path.
lightsheet_dir = "../lightsheet/"

http_port = 8001


### Code

import sys

import BaseHTTPServer
import os
import mimetypes
import shutil
import posixpath
import urllib
try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO

import tables

import numpy
import scipy.misc
import matplotlib.pyplot as plt

import json


# This is largely copied SimpleHTTPRequestHandler, but further simplified
# and of course customized for static_dir and the lightsheet requests
class HDFHTTPRequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_GET(self):
        """Serve a GET request."""
        (handler, o) = self.send_head(0)
        if o:
            handler.serve_body(self.path, o, self.wfile)

    def do_HEAD(self):
        """Serve a HEAD request."""
        (handler, o) = self.send_head("head_only")
        if o:
            handler.no_body(o)

    def send_head(self, head_only):
        """Common code for GET and HEAD commands.

        This sends the response code and MIME headers.

        Return value is a pair of (handler, o).
        """
        path = self.path
        if path == "/":
            path = "/index.html"

        # Auction the path to handlers
        handler = None
        for hclass in LightsheetRequestHandler, FileRequestHandler:
            if hclass.claim(path):
                handler = hclass
                break

        if handler is None:
            self.send_error(404, "Resource not found")
            return (None, None)

        (o, ctype, reply_size, last_modified) = handler.head_info(path, head_only)

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        if reply_size is not None:
            self.send_header("Content-Length", reply_size)
        if last_modified is not None:
            self.send_header("Last-Modified", self.date_time_string(last_modified))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "Public, max-age=99936000")
        self.end_headers()
        return (handler, o)

class BackendRequestHandler:
    """
    A base class for the HDFHTTPRequestHandler backends.
    """
    @staticmethod
    def claim(path):
        """
        .claim() methods are called in sequence for the handlers.
        """
        return 0
    @staticmethod
    def head_info(path, head_only):
        """
        Shall return a tuple of (o, ctype, reply_size, last_modified).
        The @o is opaque and shall be passed to .serve_body()
        later.
        """
        return (None, None, None, None)
    @staticmethod
    def serve_body(path, o, outputfile):
        """
        Write the body of the request to @outputfile. @o has
        been obtained by head_info().
        """
        pass
    @staticmethod
    def no_body(path, o):
        """
        An alternative to serve_body() - deinitialize @o but do
        not send anything.
        """
        pass

class LightsheetRequestHandler(BackendRequestHandler):
    """
    A backend for HDFHTTPRequestHandler handling lightsheet requests.
    @o is a tuple of ("file", <filehandle>) or ("string", <stringbody>).
    """
    @staticmethod
    def claim(path):
        return path.startswith("/lightsheet/") or path == "/lightsheet"

    @staticmethod
    def head_info(path, head_only):
        words = path.split('/')
        words = filter(None, words)
        if len(words) == 1:
            (o, ctype) = LightsheetRequestHandler.lightsheet_index()
        if len(words) == 2:
            (o, ctype) = LightsheetRequestHandler.lightsheet_file_metadata(words[1])
        if len(words) == 5 and words[4] == "json":
            (o, ctype) = LightsheetRequestHandler.lightsheet_subgroup_metadata(words[1], words[2], words[3], head_only)
        if len(words) == 5 and words[4] == "png":
            (o, ctype) = LightsheetRequestHandler.lightsheet_subgroup_png(words[1], words[2], words[3], head_only)
        if o[0] == "string":
            reply_size = str(len(o[1]))
        else: # "file"
            fs = os.fstat(o[1].fileno())
            reply_size = str(fs[6])
        return (o, ctype, reply_size, None)

    @staticmethod
    def serve_body(path, o, outputfile):
        if o[0] == "string":
            f = StringIO()
            f.write(o[1])
            f.seek(0)
        else: # "file"
            f = o[1]
        FileRequestHandler.copyfile(f, outputfile)

    @staticmethod
    def no_body(path, o):
        if o[0] == "file":
            o[1].close()

    @staticmethod
    def lightsheet_index():
        list = os.listdir(lightsheet_dir)
        list = filter(lambda a: a.endswith(".hdf5"), list)
        list.sort(key=lambda a: a.lower())
        s = json.dumps(list)
        return (("string", s), "application/json")

    @staticmethod
    def lightsheet_file_metadata(filename):
        if filename not in LightsheetRequestHandler.lsfile_cache:
            LightsheetRequestHandler.lsfile_cache[filename] = LightsheetFile(lightsheet_dir + "/" + filename)
        ls = LightsheetRequestHandler.lsfile_cache[filename].get_group_info()
        s = json.dumps(ls)
        return (("string", s), "application/json")

    @staticmethod
    def lightsheet_subgroup_metadata(filename, channel, group, head_only):
        if filename not in LightsheetRequestHandler.lsfile_cache:
            LightsheetRequestHandler.lsfile_cache[filename] = LightsheetFile(lightsheet_dir + "/" + filename)
        objpath = "/images/.ch" + channel + "/" + group
        metadata = LightsheetRequestHandler.lsfile_cache[filename].subgroup_metadata(objpath, head_only)
        s = json.dumps(metadata)
        return (("string", s), "application/json")

    @staticmethod
    def lightsheet_subgroup_png(filename, channel, group, head_only):
        if filename not in LightsheetRequestHandler.lsfile_cache:
            LightsheetRequestHandler.lsfile_cache[filename] = LightsheetFile(lightsheet_dir + "/" + filename)
        objpath = "/images/.ch" + channel + "/" + group
        imgdata = LightsheetRequestHandler.lsfile_cache[filename].subgroup_imgdata(objpath, head_only)

        scipy.misc.imsave("/tmp/rawls.png", imgdata)
        f = open("/tmp/rawls.png", "rb")
        os.unlink("/tmp/rawls.png")

        return (("file", f), "image/png")

    lsfile_cache = {}

class FileRequestHandler(BackendRequestHandler):
    """
    A backend for HDFHTTPRequestHandler handling file requests.
    Some of the calls are also referenced by LightsheetRequestHandler
    (dirty, dirty pasky...).
    """
    @staticmethod
    def claim(path):
        try:
            with open(FileRequestHandler.translate_path(path)): pass
        except IOError:
            return 0
        return 1

    @staticmethod
    def head_info(path, head_only):
        ctype = FileRequestHandler.guess_type(path)
        f = open(FileRequestHandler.translate_path(path), 'rb')
        fs = os.fstat(f.fileno())
        reply_size = str(fs[6])
        last_modified = fs.st_mtime
        return (f, ctype, reply_size, last_modified)

    @staticmethod
    def serve_body(path, o, outputfile):
        FileRequestHandler.copyfile(o, outputfile)
        o.close()
    @staticmethod
    def no_body(path, o):
        o.close()

    @staticmethod
    def translate_path(path):
        """Translate a /-separated PATH to the local filename syntax.

        Components that mean special things to the local file system
        (e.g. drive or directory names) are ignored.  (XXX They should
        probably be diagnosed.)

        """
        # abandon query parameters
        path = path.split('?',1)[0]
        path = path.split('#',1)[0]
        path = posixpath.normpath(urllib.unquote(path))
        words = path.split('/')
        words = filter(None, words)
        path = static_dir
        for word in words:
            drive, word = os.path.splitdrive(word)
            head, word = os.path.split(word)
            if word in (os.curdir, os.pardir): continue
            path = os.path.join(path, word)
        return path

    @staticmethod
    def copyfile(source, outputfile):
        """Copy all data between two file objects.

        The SOURCE argument is a file object open for reading
        (or anything with a read() method) and the DESTINATION
        argument is a file object open for writing (or
        anything with a write() method).

        The only reason for overriding this would be to change
        the block size or perhaps to replace newlines by CRLF
        -- note however that this the default server uses this
        to copy binary data as well.

        """
        shutil.copyfileobj(source, outputfile)

    @staticmethod
    def guess_type(path):
        """Guess the type of a file.

        Argument is a PATH (a filename).

        Return value is a string of the form type/subtype,
        usable for a MIME Content-type header.

        The default implementation looks the file's extension
        up in the table FileRequestHandler.extensions_map, using application/octet-stream
        as a default; however it would be permissible (if
        slow) to look inside the data to make a better guess.

        """

        base, ext = posixpath.splitext(path)
        if ext in FileRequestHandler.extensions_map:
            return FileRequestHandler.extensions_map[ext]
        ext = ext.lower()
        if ext in FileRequestHandler.extensions_map:
            return FileRequestHandler.extensions_map[ext]
        else:
            return FileRequestHandler.extensions_map['']

    if not mimetypes.inited:
        mimetypes.init() # try to read system mime.types
    extensions_map = mimetypes.types_map.copy()

class LightsheetFile:
    """
    An accessor class for lightsheet HDF5 files based on the workflow-utils
    script hdf-utils/export_hdf5.py. It also caches the data it generated
    as we are going to request the imgdata and metadata separately.
    """
    def __init__(self, filename):
        self.filename = filename
        self.h5file = tables.open_file(filename, mode = "r")

    def get_group_info(self):
        """
        Retrieve info about all channels and groups within.
        """
        ls = {}
        channel_list = [i for (i, node) in self.h5file.get_node('/', '/images')._v_children.items()]
        for ch in channel_list:
            ch = ch[len(".ch"):]
            group_list = [i for (i, node) in self.h5file.get_node('/', '/images/.ch' + ch)._v_children.items()]
            group_list = map(int, group_list)
            group_list.sort()
            ls[int(ch)] = group_list
        return ls

    def get_subgroup(self, objpath):
        """
        Load a set of image frames from a given subgroup, sorted by the
        ls_z_measured value.
        Returns a pair of (imgdata, metadata).
        """
        node0 = self.h5file.get_node('/', objpath + '/0')

        rowlen = 8
        imgrows = []
        metadata = {'size_x': int(node0.shape[0]), 'size_y': int(node0.shape[1]), 'framedata': []}
        j = 0

        for (i, node) in sorted(self.h5file.get_node('/', objpath)._v_children.items(), key = lambda i: i[1].attrs['ls_z_measured']):
            if len(imgrows) <= j/rowlen:
                imgrows.append(node.read())
            else:
                imgrows[j/rowlen] = numpy.hstack((imgrows[j/rowlen], node.read()))
            metadata['framedata'].append(
                    {'t': int(node.attrs['ls_time']),
                     'n': int(node.attrs['ls_n']),
                     'z_r': float(node.attrs['ls_z_request']),
                     'z': float(node.attrs['ls_z_measured'])})
            j += 1

        # Fully extend the last row
        imgrows[-1] = numpy.hstack((imgrows[-1], numpy.zeros([metadata['size_y'], rowlen * metadata['size_x'] - imgrows[-1].shape[1]])))

        imgdata = numpy.vstack(imgrows)
        self.cache[objpath] = { "imgdata": imgdata, "metadata": metadata }

    def subgroup_metadata(self, objpath, multiread):
        if objpath not in self.cache or "metadata" not in self.cache[objpath]:
            self.get_subgroup(objpath)
        m = self.cache[objpath]["metadata"]
        if not multiread:
            del self.cache[objpath]["metadata"]
        return m

    def subgroup_imgdata(self, objpath, multiread):
        if objpath not in self.cache or "imgdata" not in self.cache[objpath]:
            self.get_subgroup(objpath)
        i = self.cache[objpath]["imgdata"]
        if not multiread:
            del self.cache[objpath]["imgdata"]
        return i

    cache = {}


if sys.argv[1:]:
    static_dir = sys.argv[1]
if sys.argv[2:]:
    lightsheet_dir = sys.argv[2]
if sys.argv[3:]:
    http_port = sys.argv[3]

httpd = BaseHTTPServer.HTTPServer(("", http_port), HDFHTTPRequestHandler)
print("serving at port", http_port)
httpd.serve_forever()
