#!/bin/bash

nvm use v6.2.2

while true
do
    node index.js reqWithCert 0.8
    sleep 0.4
done
