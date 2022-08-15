from scapy.all import *
from math import log, sqrt
import matplotlib.pyplot as plt

#Test Plot
PLOT_ENTROPY = True
PLOT_WM = True

#Weighted arithmetic mean
HISTORICSAMPLES = 5
WEIGHTEDMEAN = [0.05, 0.10, 0.20, 0.25, 0.4]

#DDOS THRESHOLDS
WM_THRESHOLD = 0.001
EDDOS_INDICATOR = 0.5
DDOS_THRESHOLD = 5
DDOS_RESET = 10
BLOCK = False
#quitarblocklistdeaqui
class entropySflowCalc:
    def __init__(self):
        self.hashFlows = {}
        self.hEntropyValue = 0
        self.hEntropy = []
        self.ddosCount = 0
        self.ddosReset = 0
        self.destData = {}
        self.blockData = {}
        self.blockList = {}
        self.plotEntropy = []
        self.plotWM = []
        self.plotWindow = []


    def calculateEntropy(self, hflows):
        self.hashFlows = hflows
        prob = entropy = totalPkts = totalEntropy = 0
        allProbs = []

        totalPkts = sum(self.hashFlows.values())
        for key, value in self.hashFlows.items():
            if totalPkts == 0:
                prob = 1
            else:
                #Calculate the probability of the flow
                prob = float(self.hashFlows[key])/totalPkts
                allProbs.append(prob)

            try:
                #Calculate the entropy of the flow
                entropy = prob * log(prob, 2)
            except ValueError as e:
                continue


            totalEntropy = totalEntropy + entropy

        totalEntropy = -(totalEntropy)


        #Normalized entropy
        if len(self.hashFlows) == 1:
            totalEntropy = 0
        else:
            totalEntropy = totalEntropy / log(len(self.hashFlows), 2)

        #print(totalEntropy)
        #PLOT
        if PLOT_ENTROPY:
            self.plotEntropy.append(totalEntropy)

        if self.plotWindow == []:
            self.plotWindow.append(totalPkts)
        else:
            self.plotWindow.append(self.plotWindow[-1]+totalPkts)


        self.hEntropy.append(totalEntropy)

        self.weightedMean()

        self.DDosDetection()
        self.blockList.clear()
        return self.blockList

    def DosReset(self):
        self.ddosReset = 0
        self.ddosCount = 0

    def getPlots(self):
        return (self.plotEntropy, self.plotWM, self.plotWindow)


    def DDosDetection(self):
        if self.ddosReset >= DDOS_RESET:
            self.DosReset()
        elif self.ddosCount >= DDOS_THRESHOLD:
            self.DosReset()
            if self.hEntropyValue > EDDOS_INDICATOR:
                self.DDosMitigation()
            else:
                self.DosMitigation()


    def DDosMitigation(self):
        print("DDos detected")

    def DosMitigation(self):
        blockdest  = sorted(self.hashFlows.items(), key=operator.itemgetter(1))[-1]
        if blockdest[0] not in self.blockList.keys():
            print("Blocking all the traffic from " + str(blockdest[0]))
            self.blockList[blockdest[0]] = -1

    def weightedMean(self):
        sum  = 0
        i = 0

        if len(self.hEntropy) >= HISTORICSAMPLES:
            self.hEntropy = self.hEntropy[-HISTORICSAMPLES:]
            self.hEntropyValue = 0


        for e in self.hEntropy:
            self.hEntropyValue = self.hEntropyValue + (e * WEIGHTEDMEAN[i])
            i+=1

        #print("\n Historic Entropy: " + str(self.hEntropyValue))
        for i in range(0, len(self.hEntropy)):
            sum = sum + ((self.hEntropy[i] - self.hEntropyValue) ** 2)

        std_dev = sqrt(sum / len(self.hEntropy))

        #Plot
        if PLOT_WM:
            self.plotWM.append(std_dev)
        #print("D" + str(std_dev))
        if std_dev <= WM_THRESHOLD:
            self.ddosCount += 1
