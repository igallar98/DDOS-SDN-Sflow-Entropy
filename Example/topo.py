#!/usr/bin/python

from mininet.topo import Topo
from mininet.net import Mininet
from mininet.util import dumpNodeConnections
from mininet.log import setLogLevel
from mininet.util import customClass
from mininet.link import TCLink
from mininet.cli import CLI

# Compile and run sFlow helper script
# - configures sFlow on OVS
# - posts topology to sFlow-RT
exec(open('sflow-rt/extras/sflow.py').read())
# Rate limit links to 10Mbps
link = customClass({'tc':TCLink}, 'tc,bw=10')
class SingleSwitchTopo(Topo):
    def build(self, n=2):
        switch = self.addSwitch('s1')
        # Python's range(N) generates 0..N-1
        for h in range(n):
            host = self.addHost('h%s' % (h + 1))
            self.addLink(host, switch)

def simpleTest():
    topo = SingleSwitchTopo(n=4)
    net = Mininet(topo, link=link)
    net.start()
    print("Dumping host connections")
    dumpNodeConnections(net.hosts)
    print("Testing bandwidth between h1 and h4")
    h1, h4 = net.get( 'h1', 'h4' )
    #net.iperf( (h1, h4) )
    net.start()

    CLI(net)
    net.stop()


if __name__ == '__main__':
    # Tell mininet to print useful information
    setLogLevel('info')
    simpleTest()
