# Use Node 18
# hadolint ignore=DL3029
FROM --platform=$BUILDPLATFORM docker.io/library/node:18 AS react-build

# Use default answers in installation commands
ENV DEBIAN_FRONTEND=noninteractive

# Copy cluster component source code
WORKDIR /code
COPY . /code

# Build frontend application
# hadolint ignore=DL3003,DL3008
RUN apt-get update -y && \
    apt-get install --no-install-recommends -y \
      build-essential \
      libcairo2-dev \
      libgif-dev \
      libjpeg-dev \
      libpango1.0-dev \
      librsvg2-dev && \
    cd reana-ui && \
    yarn --network-timeout 600000 && \
    yarn build && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Serve frontend application
FROM docker.io/library/nginx:1.25
COPY --from=react-build /code/reana-ui/build /usr/share/nginx/html
COPY nginx/reana-ui.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Set image labels
LABEL org.opencontainers.image.authors="team@reanahub.io"
LABEL org.opencontainers.image.created="2024-03-04"
LABEL org.opencontainers.image.description="REANA reproducible analysis platform - web user interface component"
LABEL org.opencontainers.image.documentation="https://reana-ui.readthedocs.io/"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/reanahub/reana-ui"
LABEL org.opencontainers.image.title="reana-ui"
LABEL org.opencontainers.image.url="https://github.com/reanahub/reana-ui"
LABEL org.opencontainers.image.vendor="reanahub"
# x-release-please-start-version
LABEL org.opencontainers.image.version="0.9.5"
# x-release-please-end
