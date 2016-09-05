FROM node:argon
MAINTAINER emdem 'emre.x.demirors@gmail.com'

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install -g gulp
RUN npm install
COPY . /usr/src/app

EXPOSE 3000
EXPOSE 3001
EXPOSE 8080
CMD ["gulp", "start"]
