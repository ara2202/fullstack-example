#!/bin/bash

echo What should the version be?
read VERSION

docker build -t ara2202/lireddit:$VERSION .
docker push ara2202/lireddit:$VERSION
ssh benawad "docker pull ara2202/lireddit:$VERSION && docker tag ara2202/lireddit:$VERSION dokku/benapi:$VERSION && dokku deploy benapi $VERSION"