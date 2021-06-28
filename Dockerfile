FROM node:16 as build
WORKDIR /app
VOLUME [ "/db" ]
ENTRYPOINT ["/usr/local/bin/node"]
CMD yarn config set workspaces-experimental true
COPY . .
RUN yarn --ignore-engines