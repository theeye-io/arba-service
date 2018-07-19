FROM quay.io/aptible/nodejs:v8.1.x
MAINTAINER Javier Ailbirt.


ENV destDir /src/arba-service
# Create app directory
RUN mkdir -p ${destDir}
#Set working Directory
WORKDIR ${destDir}
# Install app dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    mongodb-clients \
    git-core \
    libkrb5-dev \
  && rm -rf /var/lib/apt/lists/*
COPY package.json .
RUN npm install --loglevel error
# Bundle app source
COPY . .
#Fix Permissions.
RUN mkdir .tmp
RUN chmod -R 1777 .tmp
# Bundle app source
EXPOSE 3000
#By default run prod, If development is requiered This command would be override by docker-compose up
CMD [ "npm", "start" ]
