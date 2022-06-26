sudo service openvswitch-switch start &

sudo ryu-manager ryu.app.simple_switch,ryu.app.ofctl_rest &

sudo ./sflow-rt/start.sh &

sudo mn --custom sflow-rt/extras/sflow.py --link tc,bw=10 --controller=remote,ip=127.0.0.1 --topo tree,depth=2,fanout=2
