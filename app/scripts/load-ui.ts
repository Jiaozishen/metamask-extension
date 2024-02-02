// currently only used in webpack build.

// The root compartment will populate this with hooks
global.stateHooks = {} as any;

if (process.env.LAVAMOAT) {
  // TODO: lavamoat support
  throw new Error('LAVAMOAT not supported in webpack build yet');
} else {
  (async function () {
    process.env.ENABLE_SENTRY && (await import('./sentry-install'));
    await import('./init-globals');
    await import('./runtime-cjs');
    await import('./ui');
  })();
}
