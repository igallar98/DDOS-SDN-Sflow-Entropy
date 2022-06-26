from scapy.all import *
from math import log, sqrt
import matplotlib.pyplot as plt

#Test Files
PCAPFILE = "./Datasets/Normal-h3_2.pcap"
PCAPFILE2 = "./Datasets/Normal-h3_1.pcap"
PCAPFILEDDOS = "./Datasets/SYN.pcap"
PCAPFILEDOS = "./Datasets/syn.pcap"
PCAPFILEUDPDDOS = "./Datasets/UDP.pcap"

#Test Plot
PLOT_ENTROPY = True
PLOT_WM = True

#Window
WINDOW = 50

#Weighted arithmetic mean
HISTORICSAMPLES = 5
WEIGHTEDMEAN = [0.05, 0.10, 0.20, 0.25, 0.4]

#DDOS THRESHOLDS
WM_THRESHOLD = 0.001
EDDOS_INDICATOR = 0.5
DDOS_THRESHOLD = 6
DDOS_RESET = 10
BLOCK = False

class entropyCalc:
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


    def parseFlowTest(self, file, type):
        scapy_cap = rdpcap(file)
        print("Read PCAP ok")
        i = 0
        for pkt in scapy_cap:
                if IP in pkt:
                    if type in pkt:
                        destInfo = (pkt[IP].dst, pkt[type].dport)
                        if BLOCK:
                            if pkt[IP].dst in self.blockList:
                                if self.blockList[pkt[IP].dst] == pkt[type].dport:
                                    continue
                            elif pkt[IP].src in self.blockList:
                                continue


                        dataEntropy = pkt[IP].src
                        packetInfo = 1
                        if dataEntropy in self.hashFlows:
                            self.hashFlows[dataEntropy] = self.hashFlows[dataEntropy] + packetInfo
                        else:
                            self.hashFlows[dataEntropy] =  packetInfo


                        if destInfo in self.destData:
                            self.destData[destInfo] += 1
                        else:
                            self.destData[destInfo] = 0
                        i += 1
                    if i >= WINDOW:
                        self.calculateEntropy()
                        self.ddosReset += 1
                        #print(self.hashFlows)
                        i = 0
                        self.destData = {}
                        self.hashFlows.clear()

    def calculateEntropy(self):
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
        blockdest  = sorted(self.destData.items(), key=operator.itemgetter(1))[-1]
        print("Blocking all the traffic to " + str(blockdest[0]))
        self.blockList[blockdest[0][0]] = blockdest[0][1]


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

        if std_dev <= WM_THRESHOLD:
            self.ddosCount += 1



def main():
    e = entropyCalc()

    #e.parseFlowTest(PCAPFILE, TCP)
    #e.parseFlowTest(PCAPFILEDDOS, TCP)
    #e.parseFlowTest(PCAPFILE2, TCP)
    e.parseFlowTest(PCAPFILEDDOS, TCP)

    plots = e.getPlots()

    if PLOT_ENTROPY:
        plt.scatter(plots[2], plots[0], label= "stars", color= "green",
                marker= "*")
        plt.show()

    if PLOT_WM:
        plt.scatter(plots[2], plots[1], label= "stars", color= "blue",
                marker= "*")
        plt.show()



if __name__ == '__main__':
    main()
