import webpack from 'webpack';
import type WebpackDevServerType from 'webpack-dev-server';
import { noop, logStats, __HMR_READY__ } from './utils/helpers';
import config from './webpack.config.js';

// disable browserslist stats as it needlessly traverses the filesystem multiple
// times looking for a stats file that doesn't exist.
require('browserslist/node.js').getStat = noop;

/**
 * Builds the extension
 *
 * @returns a Promise that resolves when the build is complete, but before
 * caching has been persisted. In watch mode, the Promise never resolves.
 */
export function build(onComplete: () => void = noop) {
  const isDevelopment = config.mode === 'development';

  if (__HMR_READY__ && config.watch) {
    // Use `webpack-dev-server` to enable HMR
    const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
    const options = {
      hot: isDevelopment,
      liveReload: isDevelopment,
      server: {
        // TODO: is there any benefit to using https?
        type: 'https',
      },
      // always use loopback, as 0.0.0.0 tends to fail on some machines (WSL2?)
      host: 'localhost',
      devMiddleware: {
        // browsers need actual files on disk
        writeToDisk: true,
      },
      // we don't need/have a "static" directory, so disable it
      static: false,
      allowedHosts: 'all',
    } as const satisfies WebpackDevServerType.Configuration;

    const server = new WebpackDevServer(options, webpack(config));
    server.start();
  } else {
    console.error(`🦊 Running ${config.mode} build…`);
    const compiler = webpack(config);
    if (config.watch) {
      // once HMR is ready (__HMR_READY__ variable), this section should be removed.
      compiler.watch(config.watchOptions, (err, stats) => {
        logStats(config, err ?? undefined, stats);
        console.error('🦊 Watching for changes…');
      });
    } else {
      compiler.run((err, stats) => {
        logStats(config, err ?? undefined, stats);
        // `onComplete` must be called synchronously _before_ `compiler.close`
        // or the caller might observe output from the `close` command.
        onComplete();
        compiler.close(noop);
      });
    }
  }
}
