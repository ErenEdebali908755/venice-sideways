FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node public ./public
COPY --chown=node:node lib ./lib
COPY --chown=node:node server.mjs published-routes.mjs community-proxy.mjs event-proxy.mjs relay-security.mjs package.json ./
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
