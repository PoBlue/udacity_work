#!/bin/bash

nvm use v6.2.2

while true
do
    node index.js reqWithCert 4
done
