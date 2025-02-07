const CracoAlias = require("craco-alias");

module.exports = {
  plugins: [
    { plugin: require("@semantic-ui-react/craco-less") },
    {
      plugin: CracoAlias,
      options: {
        source: "options",
        baseUrl: "./",
        aliases: {
          "~": "./src",
          "@palette": "./src/styles/palette",
        },
      },
    },
  ],
  devServer: {
    proxy: [
      {
        context: [
          "/api/**",
          // this matches URLs to Jupyter notebooks (but also a bit more)
          "/+([a-f0-9])-+([a-f0-9])-+([a-f0-9])-+([a-f0-9])-+([a-f0-9])/**",
        ],
        // `localhost` is replaced by `127.0.0.1` as sometimes it resolves to `::1` (IPv6 instead of IPv4)
        target: process.env.REANA_SERVER_URL?.replace("localhost", "127.0.0.1"),
        secure: false,
        // needed to proxy websockets to Jupyter notebooks
        ws: true,
      },
    ],
  },
  eslint: {
    enable: false,
  },
};
