#!/usr/bin/env python
import requests
import json


class entropySflow:
    def __init__(self):
        self.hashFlows = {}


def main():
    es = entropySflow()


if __name__ == '__main__':
    main()


flowTCP = {'keys':'ipsource,ipdestination,tcpsourceport,tcpdestinationport',
 'value':'bytes','log':True}
requests.put('http://localhost:8008/flow/tcp/json',data=json.dumps(flowTCP))

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
