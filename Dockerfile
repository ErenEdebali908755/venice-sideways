# Docker Official Images on ECR; digest verified identical to Docker Hub.
FROM public.ecr.aws/docker/library/node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
WORKDIR /app
COPY --chown=node:node public ./public
COPY --chown=node:node server.mjs published-routes.mjs community-proxy.mjs event-proxy.mjs package.json ./
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
