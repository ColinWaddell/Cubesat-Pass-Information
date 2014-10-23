import sys
import time
import os
import httplib2
import MySQLdb
import math
import string
import ephem
import urllib2
import argparse
import datetime
import json

from math import degrees
from calendar import timegm



def get_location(tle, now=None, lat=None, lng=None):
    """Compute the current location of the satellite specified in tle.
       Returns relevant position data.
       Code pulled from https://github.com/gleitz/spheremusic/blob/master/satellites.py
    """
    now = now or datetime.datetime.utcnow()
    lat = lat or 55.901353
    lng = lng or -4.314035

    satellite = ephem.readtle(str(tle[0]), str(tle[1]), str(tle[2]))

    # Compute for current location
    observer = ephem.Observer()
    observer.lat = lat
    observer.lon = lng
    observer.elevation = 0
    observer.date = now
    satellite.compute(observer)
    lon = degrees(satellite.sublong)
    lat = degrees(satellite.sublat)

    # Return the relevant timestamp and data
    data = {'position': {'latitude': lat,
                         'longitude': lon},
            'visible': float(repr(satellite.alt)) > 0 and float(repr(satellite.alt)) < math.pi,
            'altitude': satellite.alt,
            'azimuth': satellite.az,
            'range': satellite.range,
            'velocity': satellite.range_velocity,
            'name': satellite.name}
    return data


    
def datetime_periodic(now=None):
    """ Produce an array of dates, separated by 30 second spanning
        90 minutes prior to current moment, to 90 minutes future.
        Returns an array of datetime objects.
    """
    now = now or datetime.datetime.utcnow()
    date_from = now + datetime.timedelta(seconds=-30*90)
    date_to   = now + datetime.timedelta(seconds= 30*90)


    dates=[]
    while now<=date_to:
        dates.append(now)
        now+=datetime.timedelta(seconds=30)

    return dates




def GetTLE(satName=None):
    """ Grab the celestrak TLE data for cubesat of name satName
        Returns an array with each line a string of TLE data.
    """

    satName = satName or "UKUBE"

    # grab the latest keps
    tles = urllib2.urlopen('http://www.celestrak.com/NORAD/elements/cubesat.txt').readlines()

    # strip off the header tokens and newlines
    tles = [item.strip() for item in tles]

    # clean up the lines
    tles = [(tles[i],tles[i+1],tles[i+2]) for i in xrange(0,len(tles)-2,3)]

    tle = [ '', 
            '',
            '',
            ''
          ]

    for s in tles:
        for a in s:
            if satName in a:
                tle[0] = satName
                tle[0] = s[0]
                tle[1] = s[1]
                tle[2] = s[2]

    return tle





tle_data = GetTLE()


recent_data = []

for date in datetime_periodic():
    satellite_data = get_location(tle_data, date)

    recent_data.append({
        'datetime' : date.ctime(),
        'position' : {
            'latitude'  : satellite_data['position']['latitude'],
            'longitude' : satellite_data['position']['longitude']
        }
    })

print json.dumps(recent_data)
