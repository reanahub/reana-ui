FROM node as react-build
WORKDIR /code
COPY ./reana-ui/package.json /code/reana-ui/package.json
RUN cd reana-ui && yarn install
COPY . /code
RUN cd reana-ui && \
    yarn && \
    yarn build

FROM nginx
COPY --from=react-build /code/reana-ui/build /usr/share/nginx/html
COPY nginx/reana-ui.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
