#!/usr/bin/env python
import requests
import json
from entropySflowAPI import *

class entropySflow:
    def __init__(self):
        self.hashFlows = {}
        self.ovs_dp_hitrate = False


def main():
    entropy = entropySflow()
    api = entropySflowAPI()

    #Define the Flows
    api.setFlow("TCPflow",
    "ipsource,ipdestination,tcpsourceport,tcpdestinationport")

    #Define the Thresholds
    api.setThreshold("TCPEvent", "ovs_dp_hitrate", 10)

    #Control Events
    response = 200
    while response != -1:
        response = api.getEvent()
        if response == 0: continue
        print(response)


if __name__ == '__main__':
    main()
