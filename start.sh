#!/bin/sh

/usr/src/app/wait-for-it.sh -h rabbitmq -p 5672 -t 120
node emailServer.js