#!/bin/bash -ex

STAG=ubuntu@ec2-52-31-96-176.eu-west-1.compute.amazonaws.com
DEV=ubuntu@ec2-52-212-105-112.eu-west-1.compute.amazonaws.com

if [ $# -eq 0 ]
  then
    echo "Usage: $0 DEV|STAG"
  exit
fi

if [[ $1 == 'DEV' ]]
then 
   EC2=$DEV
fi

if [[ $1 == 'STAG' ]]
then
   EC2=$STAG
fi

docker build . -t dashboardui-img
docker save -o dashboardui-img.tar dashboardui-img
gzip -f dashboardui-img.tar
scp dashboardui-img.tar.gz $EC2:/tmp

ssh $EC2 "sudo systemctl stop dashboard-ui-docker"
ssh $EC2 "docker rm -f dashboardui && docker rmi -f dashboardui-img"
ssh $EC2 "cd /tmp && gunzip -f dashboardui-img.tar.gz && docker load -i dashboardui-img.tar"
ssh $EC2 "rm -f dashboardui-img.tar && docker create -p 39738:9000 --network=ssaas-network --hostname dashboardui --name dashboardui dashboardui-img"
ssh $EC2 "sudo systemctl start dashboard-ui-docker"

