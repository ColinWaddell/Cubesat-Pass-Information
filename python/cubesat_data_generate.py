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
import json
import datetime

from datetime import datetime,tzinfo,timedelta
from math import degrees
from calendar import timegm

CELESTRAK_URL = 'http://www.celestrak.com/NORAD/elements/cubesat.txt'
TIME_MAX = 90
TIME_MIN = 180
TIME_INC = 180


class Zone(tzinfo):
  def __init__(self,offset,isdst,name):
    self.offset = offset
    self.isdst = isdst
    self.name = name
  def utcoffset(self, dt):
    return timedelta(hours=self.offset) + self.dst(dt)
  def dst(self, dt):
    return timedelta(hours=1) if self.isdst else timedelta(0)
  def tzname(self,dt):
    return self.name

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
    GMT = Zone(1,False,'GMT')
    now = now or datetime.now(GMT)
    date_from = now + timedelta(seconds=-TIME_INC*TIME_MIN)
    date_to   = now + timedelta(seconds= TIME_INC*TIME_MAX)

    dates=[]
    while date_from<=date_to:
        dates.append(date_from)
        date_from+=timedelta(seconds=30)

    return dates


def GetTLE(satName=None):
    """ Grab the celestrak TLE data for cubesat of name satName
        Returns an array with each line a string of TLE data.
    """

    satName = satName or "UKUBE"

    # grab the latest keps
    tles = urllib2.urlopen(CELESTRAK_URL).readlines()

    # strip off the header tokens and newlines
    tles = [item.strip() for item in tles]

    # clean up the lines
    tles = [(tles[i],tles[i+1],tles[i+2]) for i in xrange(0,len(tles)-2,3)]

    tle = [ '',
            '',
            ''
          ]

    for s in tles:
        for a in s:
            if satName in a:
                tle[0] = s[0]
                tle[1] = s[1]
                tle[2] = s[2]

    return tle



""" ===========================================================================
    ===========================================================================
    Calculate UKUBE's position at a bunch of times, and output a json result

"""

""" Grab the current TLE data for UKUBE"""
tle_data = GetTLE()

""" Hold the position data at various times"""
recent_data = []

""" Loop  through an array of time, 90 mins
    in the past, to 90 mins in the future,
    incrementing every 30 seconds.
"""
for date in datetime_periodic():
    satellite_data = get_location(tle_data, date)

    recent_data.append({
        'datetime' : date.strftime('%Y-%m-%d %H:%M:%S %Z'),
        'position' : {
            'latitude'  : satellite_data['position']['latitude'],
            'longitude' : satellite_data['position']['longitude']
        }
    })

""" Return a json formatted output """
print json.dumps(recent_data)



