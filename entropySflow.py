#!/usr/bin/env python
import requests
import json
from entropySflowAPI import *
import time
import configparser


class entropySflow:
    def __init__(self):
        self.hashFlows = {}
        self.managedEvents = {} 
        self.config = configparser.RawConfigParser()
        self.config.read('config.cfg')
        self.thresholds = dict(self.config.items('THRESHOLDS'))
        self.flows = dict(self.config.items('FLOW_METRICS'))



def main():
    entropy = entropySflow()
    api = entropySflowAPI()

    #Define the Flows
    #api.setFlow("TCPflow",
    #"ipsource,ipdestination,tcpsourceport,tcpdestinationport")

    #Define the Thresholds
    i=0
    for thr in entropy.thresholds:
        api.setThreshold("Event" + str(i), thr, entropy.thresholds[thr], byflow = False)
        i+=1

    #Control Events
    response = 200
    while response != -1:
        response = api.getEvent()
        if response == 0: continue
        print(response)



if __name__ == '__main__':
    main()
