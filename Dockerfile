FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node public ./public
COPY --chown=node:node server.mjs package.json ./
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
