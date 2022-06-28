#!/usr/bin/env python
import requests
import json

API = "http://localhost:8008/"


class entropySflowAPI:
    def __init__(self):
        self.thresholds = {}
        self.flows = {}
        self.threshold = "threshold/"
        self.flow = "flow/"
        self.end = "/json"
        self.eventr = API + "events/json?maxEvents=10&timeout=60"


    def setFlow(self, name, keys, value = "bytes", log = True):
        fwr = {'keys':keys,'value':value,'log':log}
        requests.put(API + self.flow + name + self.end, data=json.dumps(fwr))
        self.flows[keys] = fwr

    def unsetFlow(self, key):
        pass

    def setThreshold(self, name, metric, value, byflow = True):
        thr = {'metric':metric, 'value': value, 'byFlow':byflow}
        requests.put(API + self.threshold + name + self.end, data=json.dumps(thr))
        self.thresholds[metric] = thr

    def unsetThreshold(self, name):
        pass

    def getEvent(self):
        eventID = -1
        r = requests.get(self.eventr + "&eventID=" + str(eventID))
        if r.status_code != 200: return -1
        events = r.json()
        if len(events) == 0: return 0
        eventID = events[0]["eventID"]
        events.reverse()
        for e in events:
          return json.dumps(e)

def main():
    es = entropySflowAPI()


if __name__ == '__main__':
    main()
