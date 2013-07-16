#!/usr/bin/python
# This is a simple HTTP server that provides an API for various computations
# on the HDF5 data files.
#
# Usage:
# ./computation-server.py ../lightsheet/
# then go to URL http://localhost:8002/
#
# HTTP API:
# * /<filename>/box-intensity/<channel>/<group>/x1,y1,z1-x2,y2,z2 returns
#   a JSON-formatted list of frame values representing the intensity
#   of the bounding box contents
# * box-intensity append ?wholenorm to normalize this intensity by the global
#   frame brightness
# * box-intensity append ?chnorm to normalize this intensity by the other
#   channel intensity

# This is directory with the HDF5 files to be served in the /lightsheet/
# HTTP path.
lightsheet_dir = "../lightsheet/"

http_port = 8002


import sys

if sys.argv[1:]:
    lightsheet_dir = sys.argv[1]
if sys.argv[2:]:
    http_port = sys.argv[2]


import tables

import numpy
import scipy.misc
import matplotlib.pyplot as plt

class BoxIntensity:
    """
    Computation of box intensity over time.
    """
    def __init__(self, filename, channel):
        self.filename = lightsheet_dir + '/' + filename
        self.h5file = tables.open_file(self.filename, mode = "r")

        self.objpath = "/images/.ch" + str(channel)
        self.objnode = self.h5file.get_node('/', self.objpath)

        self.ch2objpath = "/images/.ch" + str(1 - channel)
        self.ch2objnode = self.h5file.get_node('/', self.ch2objpath)

    def of_subgroup(self, sgnode, box, wholenorm = 0):
        imgdata = sgnode.read()
        imgbox = imgdata[box[0][0]:box[1][0]+1, box[0][1]:box[1][1]+1]
        # print '  ' + str(imgbox[0,0])
        avg = numpy.average(imgbox)
        if wholenorm:
            avg /= numpy.average(imgdata)
        return avg

    def of_group(self, gnode, gpath, box, wholenorm = 0, chnorm = 0):
        slicevals = []
        for (i, node) in sorted(gnode._v_children.items(), key = lambda x: x[1].attrs['ls_z_measured']):
            z = node.attrs['ls_z_measured']
            if z >= box[0][2] and z <= box[1][2]:
                # print ' ' + str(z)
                value = self.of_subgroup(node, box, wholenorm)
                if chnorm and self.ch2objnode:
                    ch2node = self.h5file.get_node(self.ch2objpath, gpath + '/' + str(i))
                    val2 = self.of_subgroup(ch2node, box, wholenorm);
                    value /= val2
                slicevals.append(value)
        return numpy.average(slicevals)

    def of_all(self, box, wholenorm = 0, chnorm = 0):
        values = []
        for (i, node) in sorted(self.objnode._v_children.items(), key = lambda x: float(x[0])):
            # print i
            values.append(self.of_group(node, str(i), box, wholenorm, chnorm))
        return values


from flask import *
from functools import update_wrapper
app = Flask(__name__)

# http://flask.pocoo.org/snippets/56/
def crossdomain(origin=None, methods=None, headers=None,
                attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

@app.route('/<string:filename>/box-intensity/<int:channel>/<string:boxcoords>')
@crossdomain(origin='*')
def box_intensity(filename, channel, boxcoords):
    boxi = BoxIntensity(filename, channel)
    box = map(lambda k: map(lambda kk: float(kk), k),
              map(lambda k: k.split(','),
                  boxcoords.split('-')))
    return jsonify({'intensity': boxi.of_all(box,
            wholenorm = request.args.has_key('wholenorm'),
            chnorm = request.args.has_key('chnorm')
        )})

if __name__ == '__main__':
    # app.run(port = http_port)
    app.run(port = http_port, debug = True)
