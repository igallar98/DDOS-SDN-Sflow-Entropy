#!/usr/bin/env python
import requests
import json

API = "http://localhost:8008/"
class entropySflowAPI:
    def __init__(self):
        self.thresholds = {}
        self.threshold = "threshold/"
        self.end = "/json"

    def setThreshold(self, name, metric, value, byflow = True):
        thr = {'metric':metric, 'value': value, 'byFlow':byflow}
        requests.put(API + self.threshold + name + self.end, data=json.dumps(thr))
        self.thresholds[metric] = thr

    def unsetThreshold(self, name):
        pass

    def getEvent():

def main():
    es = entropySflowAPI()


if __name__ == '__main__':
    main()

threshold = {'metric':'ovs_dp_hitrate', 'value': 90, 'byFlow':True}
requests.put('http://localhost:8008/threshold/large-tcp/json',data=json.dumps(threshold))


eventurl = 'http://localhost:8008/events/json?maxEvents=10&timeout=60'
eventID = -1
while 1 == 1:
  r = requests.get(eventurl + "&eventID=" + str(eventID))
  if r.status_code != 200: break
  events = r.json()
  if len(events) == 0: continue

  eventID = events[0]["eventID"]
  events.reverse()
  for e in events:
    print(json.dumps(e))
