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
};
