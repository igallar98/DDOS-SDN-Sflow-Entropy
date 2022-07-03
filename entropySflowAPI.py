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
        self.eventr = API + "events/json?maxEvents=1&timeout=1"
        self.events = {}


    def setFlow(self, name, keys, value = "bytes", log = True):
        fwr = {'keys':keys,'value':value,'log':log}
        requests.put(API + self.flow + name + self.end, data=json.dumps(fwr))
        self.flows[keys] = fwr

    def unsetFlow(self, key):
        pass

    def setThreshold(self, name, metric, value, byflow = True, timeout = 2):
        thr = {'metric':metric, 'value': value, 'byFlow':byflow, 'timeout':timeout}
        requests.put(API + self.threshold + name + self.end, data=json.dumps(thr))
        self.thresholds[metric] = thr
        self.events[name] = -1

    def unsetThreshold(self, name):
        pass

    def getEvent(self, unique = True):
        eventID = -1
        r = requests.get(self.eventr + "&activeTimeout=1&maxEvents=1&eventID=" + str(eventID))
        if r.status_code != 200: return -1
        events = r.json()
        if len(events) == 0: return 0
        eventID = events[0]["eventID"]
        thresholdID = events[0]["thresholdID"]
        if unique == True and eventID != self.events[thresholdID]:
            self.events[thresholdID] = eventID
            events.reverse()
            for e in events:
              return json.dumps(e)
        else:
            return 0

def main():
    es = entropySflowAPI()


if __name__ == '__main__':
    main()
