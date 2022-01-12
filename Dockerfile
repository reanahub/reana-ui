FROM node:16 as react-build
WORKDIR /code
COPY . /code
# hadolint ignore=DL3003
RUN cd reana-ui && \
    yarn && \
    yarn build

FROM nginx:1.19
COPY --from=react-build /code/reana-ui/build /usr/share/nginx/html
COPY nginx/reana-ui.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
