# Bust a Shape

A collaborative, real-time tool for creating artwork in the browser. Inspired by [@afragon](https://twitter.com/afragon)'s work with [CSS live coding](https://www.youtube.com/watch?v=MrYOnQTXWzs) ([see a video](https://www.youtube.com/watch?v=ztwSAZ7lJg8))

An experiment by [Chris Ruppel](https://github.com/rupl), [Afra Noubarzadeh](https://github.com/afragon) and [Emre Demirors](https://github.com/emdem).

## Installation and Setup

Assuming you have [node.js](https://nodejs.org) installed, just run the following commands:

```
npm install -g gulp
npm install
```

Now use gulp to run the server:

```
gulp start
```

It will open up the site in your default browser automatically. To really see the magic, open other browser windows and point them at http://localhost:3000, or load it on other devices using the same LAN (the "External" URL will be listed in console with your current IP).

Have fun!

### Docker build/setup

These steps assume you have docker engine installed and setup.

For docker compose:

```
# to build:
docker-compose build

# to run:
docker-compose up

# to run in non-interactive mode:
docker-compose up -d
```

```
# with ports only exposed locally
docker run -d --name bustamove -p 3000:3000 -p 3001:3001 -p 8080:8080 emdem/bustamove

# with ports exposed publicly
docker run -d --name bustamove -p 0.0.0.0:3000:3000 -p 0.0.0.0:3001 -p 0.0.0.0:8080:8080 emdem/bustamove

# check logs with
docker logs bustamove
```

```
docker build -t bustamove .
```


## Multiplayer art

Visit [bustashape.com](http://www.bustashape.com) to try it out with others! Just like a video game, it works best when you have a fast connection with a low ping.

## Video

Here's a very short video of my WIP: https://www.youtube.com/watch?v=Czg--AgziuI
