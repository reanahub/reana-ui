const { getLoaders, loaderByName } = require("@craco/craco");
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
          "@menus": "./src/styles/menus",
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
  webpack: {
    configure: (webpackConfig) => {
      // With the current production browserslist targets, Babel rewrites
      // jsroot's `import.meta?.url` so a bare `import.meta` survives webpack
      // and makes the preview chunk invalid as a classic script ("Cannot use
      // 'import.meta' outside a module"). Development targets do not trigger
      // this, so check the production output. Exclude jsroot from the
      // dependency Babel rule (the one without `include`) and let webpack
      // resolve the URL. This leaves ES2020 syntax in the jsroot chunks.
      const { matches } = getLoaders(
        webpackConfig,
        loaderByName("babel-loader"),
      );
      const dependencyRules = matches
        .map(({ parent, index }) => parent[index])
        .filter((rule) => !rule.include);
      if (dependencyRules.length !== 1) {
        throw new Error(
          `craco.config.js: expected one babel-loader rule for dependencies, found ${dependencyRules.length}`,
        );
      }
      const [dependencyRule] = dependencyRules;
      dependencyRule.exclude = [
        dependencyRule.exclude,
        /node_modules[\\/]jsroot[\\/]/,
      ].filter(Boolean);
      return webpackConfig;
    },
  },
};
