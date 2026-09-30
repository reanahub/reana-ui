const fs = require("fs");
const path = require("path");
const CracoAlias = require("craco-alias");

const JSROOT_DIR = path.resolve(path.dirname(require.resolve("jsroot")), "..");
const MATHJAX_DIR = path.dirname(
  require.resolve("mathjax/es5/tex-svg.js", { paths: [JSROOT_DIR] }),
);

// Third-party files of the sandboxed ROOT file viewer in
// `public/root-viewer/app/`. jsroot loads MathJax from `../mathjax/3.2.0/`
// relative to the viewer page, together with the TeX extensions it configures.
const ROOT_VIEWER_FILES = [
  // The package's `jsroot.min.js` is a build of another jsroot version, so
  // publish `jsroot.js` and let the production build minify it.
  {
    target: "root-viewer/app/jsroot.js",
    source: path.join(JSROOT_DIR, "build", "jsroot.js"),
    minimized: false,
  },
  {
    target: "root-viewer/mathjax/3.2.0/es5/tex-svg.js",
    source: path.join(MATHJAX_DIR, "tex-svg.js"),
    minimized: true,
  },
  ...["color", "mathtools", "physics", "upgreek"].map((extension) => ({
    target: `root-viewer/mathjax/3.2.0/es5/input/tex/extensions/${extension}.js`,
    source: path.join(
      MATHJAX_DIR,
      "input",
      "tex",
      "extensions",
      `${extension}.js`,
    ),
    minimized: true,
  })),
];

/**
 * Webpack plugin publishing files from `node_modules`, e.g.
 * `{ target: "published/path.js", source: "/path/to/file.js", minimized: true }`.
 * Files marked as `minimized` are not minified again in production builds.
 */
class PublishFilesPlugin {
  constructor(files) {
    this.files = files;
  }

  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap("PublishFilesPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "PublishFilesPlugin",
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          for (const { target, source, minimized } of this.files) {
            compilation.fileDependencies.add(source);
            compilation.emitAsset(
              target,
              new sources.RawSource(fs.readFileSync(source)),
              { minimized },
            );
          }
        },
      );
    });
  }
}

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
    plugins: {
      add: [new PublishFilesPlugin(ROOT_VIEWER_FILES)],
    },
  },
};
