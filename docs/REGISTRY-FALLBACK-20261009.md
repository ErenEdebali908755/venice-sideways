# Official image registry fallback — 9 October 2026

Repeated Docker Hub token endpoint HTTP 504 errors blocked GitHub CI and Railway builds. The Docker Official Images publisher also distributes Node through Amazon ECR Public. Only the registry URL and immutable digest are changed; Node variants and application files are unchanged by this repair.

Primary source: https://aws.amazon.com/blogs/containers/docker-official-images-now-available-on-amazon-elastic-container-registry-public/
Publisher repository: https://gallery.ecr.aws/docker/library/node

Anonymous manifest GETs on 2026-10-09 returned identical OCI index bytes from Docker Hub and ECR, including identical linux/amd64 and linux/arm64 descriptors:

| Tag | OCI index SHA-256 |
| --- | --- |
| 22-alpine | 0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 |
| 24-bookworm-slim | d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 |

Build using the exact Dockerfile in CI; do not skip Docker, application or browser gates. No registry credential, application secret, production schema or route content is changed. These are inbound public package downloads; private application images are still built on the existing GitHub/Railway services. Future base-image updates must intentionally refresh and verify the pinned digest.
