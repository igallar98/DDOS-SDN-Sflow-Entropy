#!/usr/bin/env python
import requests
import json
from entropySflowAPI import *
import time
import configparser
import os
from threading import Thread

UPDATE_TIME = 11
blockOn = False

class entropySflow:
    def __init__(self):
        self.hashFlows = {}
        self.managedEvents = {}
        self.config = configparser.RawConfigParser()
        self.config.read('config.cfg')
        self.thresholds = dict(self.config.items('THRESHOLDS'))
        self.flows = dict(self.config.items('FLOW_METRICS'))
        self.api = entropySflowAPI()

    def defineThresholds(self):
        i=0
        for thr in self.thresholds:
            self.api.setThreshold("Event" + str(i), thr, self.thresholds[thr], byflow = False)
            i+=1

    def controlEvents(self):
        global blockOn
        response = 200
        prevTimestamp = 0
        while response != -1:
            response = self.api.getEvent()
            t = time.time()
            if (t - prevTimestamp) >= UPDATE_TIME:
                blockOn = False
            if response == 0: continue
            prevTimestamp = time.time()
            blockOn = True

    def defineFlows(self):
        i=0
        for flw in self.flows:
            self.api.setFlow("Flow" + str(i), self.flows[flw])
            i+=1


    def controlFlows(self):
        self.api.getFlows()


def main():
    entropy = entropySflow()
    entropy.defineThresholds()
    entropy.defineFlows()

    thread1 = Thread(target=entropy.controlEvents, args=())
    thread1.start()
    #thread1.join()

    entropy.controlFlows()




    #Define the Flows
    #api.setFlow("TCPflow",
    #"ipsource,ipdestination,tcpsourceport,tcpdestinationport")

    #Define the Thresholds


    #Control Events



if __name__ == '__main__':
    main()
