FROM node:14-alpine as build
WORKDIR /app
VOLUME [ "/db" ]
ENTRYPOINT ["/usr/local/bin/node"]

COPY ./package.json ./
RUN yarn --no-lockfile
COPY . .
RUN node_modules/.bin/lerna bootstrap
