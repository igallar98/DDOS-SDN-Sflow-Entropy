# DDOS-SDN-Sflow-Entropy
## _A Sflow-RT application for detecting DoS using an entropy approach_

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://github.com/igallar98/DDOS-SDN-Sflow-Entropy)

This application implements a multidimensional denial of service (DoS) detector using Sflow and an entropy approach for detecting different DoS attacks that have different characteristics, improving the traditional entropy approach into a more effective and accurate detection. The results are 100\% detection tested with the most accurate dataset publicly available as a method for detecting DoS and DDoS attacks. Furthermore, by easily adding one line in the configuration file, it is possible to detect new attacks. Moreover, the false-negative ratio is zero because with Sflow it is possible to analyze more attack-dependent variables.


## Features

- Detects DoS and DDoS using an entropy approach, by making use of the protocol Sflow.
- Get the block list or aggresive traffic by using an API REST.
- Easy to add new DoS and DDoS detection methods.

## Requeriments

This application requires [Python3](https://www.python.org/downloads/) to run. The following requirements are needed:
```sh
pip3 install matplotlib, scapy, requests, jsonlib, configparser, datetime
```

The [Sflow-RT](https://sflow-rt.com/) application has to be configured and installed. 
[Mininet](http://mininet.org/) application has to be configured and installed for the test environment. 
[OpenSflow](https://github.com/mininet/openflow/blob/master/INSTALL) application has to be configured and installed for the test environment. 
## Test library

In order to get the normalized entropy and standard deviation graphics, the entropyTest.py was created. It is possible to execute this script using python3: 
```sh
python3 entropyTest.py
```
Inside the source-code, it is needed to configure the DataSets, entropy parameters (the defaults are OK) and the graphs that you want to plot.

## Test Enviroment
Firstly, starts the OpenSflow switch with the following command:
```sh
sudo service openvswitch-switch start
```
Once started, it is needed to startthe SFlow-RT application. You can use the following command in the Sflow-RT path:
```sh
sudo ./sflow-rt/start.sh
```
Finally, you can emulate a SDN network using Mininet. An example topology is available in the Example directory. You can execute:
```sh
sudo python3 topo.py
```
In the Example directory, there are tools for performing attacks. You can use the folowing command in Mininet to perform an UDP Flood attack for example.
```sh
h1 hping3 --udp --flood h2 
``` 

The attacks application can be started using the following command. Remeber to check the configuration file.
```sh
python3 entropySflow.py 
``` 
## Development

Want to contribute? Great! 
Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.
Be sure to update the tests as appropriate.


## License

MIT
