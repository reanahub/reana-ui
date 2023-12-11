# Use Node 18
# hadolint ignore=DL3029
FROM --platform=$BUILDPLATFORM docker.io/library/node:18 as react-build

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
