#!/bin/bash

echo "Installing nemashow in current directory..."
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

#install meteor
curl https://install.meteor.com | sh
#install mongo
apt-get update
apt-get -y install mongodb-clients
apt-get -y install git 
apt-get -y install python-software-properties python g++ make
add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get -y install nodejs
npm install -g meteorite
git clone https://github.com/nemaload/nemashow.git
cd nemashow/meteor
wget indra.davidad.net/dump.tar
tar -xf dump.tar
echo "Installing NEMASHOW Meteorite packages..."
mrt install
echo "Populating database, waiting for Mongo initialization..."
sudo meteor &
sleep 25
mongorestore --host 127.0.0.1:3002 
ps aux | grep meteor | awk '{print $2}' | xargs sudo kill -9
echo "Meteor stack installed."

