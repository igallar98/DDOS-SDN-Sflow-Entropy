#!/usr/bin/env python
import requests
import json
from entropySflowAPI import *
from entropySflowCalc import *
from APIRest import *
import time
import configparser
import os
from threading import Thread


UPDATE_TIME = 11
blockOn = False
blockDict = {}

class entropySflow:
    def __init__(self):
        self.hashFlows = {}
        self.managedEvents = {}
        self.config = configparser.RawConfigParser(delimiters=('='))
        self.config.optionxform = str
        self.config.read('config.cfg')
        self.thresholds = dict(self.config.items('THRESHOLDS'))
        self.flows = dict(self.config.items('FLOW_METRICS'))
        self.general = dict(self.config.items('GENERAL'))
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
            flowcf = self.flows[flw]
            if int(flowcf) == 1:
                self.api.setFlow(flw, flw)
                self.api.setFlow("Flow" + str(i), flw)
            elif int(flowcf) == 2:
                self.api.setFlow(flw, flw)
            else:
                self.api.setFlow("Flow" + str(i), flw)

            i+=1

    def controlFlow(self, flow):
        global blockDict
        allflows = {}
        blocklist = {}
        entropyCalc = entropySflowCalc()
        while True:
            allflows = self.api.getFlows(metric = flow, allflows = allflows)
            #print(allflows)
            if sum(allflows.values()) >= 50:
                blockDict = dict(entropyCalc.calculateEntropy(hflows = allflows), **blockDict)
                allflows.clear()



    def controlFlows(self):
        global blockDict
        global blockOn
        
        i = 0
        for _ in self.flows:
            f = "Flow" + str(i)
            self.threadsflow[f] = Thread(target=self.controlFlow, args=(f, ))
            self.threadsflow[f].start()
            i+=1

        apirest = APIRest()
        pid = os.fork()
        if pid == 0:
            apirest.start(self.general["ip"], self.general["port"])
        else:
            while True:
                if blockOn == False:
                    FinalblockDict = {"AggressiveTraffic": blockDict}
                else:
                    FinalblockDict = {"AttackInProgress": blockDict}
                json.dump(FinalblockDict, open( "index.html", 'w'))
                time.sleep(1)




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
