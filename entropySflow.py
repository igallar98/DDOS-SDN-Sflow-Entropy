#!/usr/bin/env python
import requests
import json
from entropySflowAPI import *
from entropySflowCalc import *
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
        self.threadsflow = {}

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
            self.api.setFlow("Flow" + str(i), flw)
            i+=1

    def controlFlow(self, flow):
        allflows = {}
        blocklist = {}
        entropyCalc = entropySflowCalc()
        while True:
            allflows = self.api.getFlows(metric = flow, allflows = allflows)
            print(allflows)
            if sum(allflows.values()) >= 50:
                blocklist = entropyCalc.calculateEntropy(hflows = allflows)
                allflows.clear()
            #if blocklist:
                #print(blocklist)


    def controlFlows(self):
        i = 0
        for _ in self.flows:
            f = "Flow" + str(i)
            self.threadsflow[f] = Thread(target=self.controlFlow, args=(f, ))
            self.threadsflow[f].start()
            i+=1



        for flow in self.flows:
            metricf = self.flows[flow].split(",")
            i = 0
            for m in metricf:
                print(m)
                self.api.setFlow("B" + flow + str(i), m)
                i+=1


        #while True:




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
