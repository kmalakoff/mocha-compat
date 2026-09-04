# vendored glob

glob 8.1.0, byte-identical to the published tarball except that `require('inflight')` in `glob.js`
points at `../inflight/inflight.js`.

Upstream deprecated glob 8 as unsupported, and it pulls `inflight`, which is deprecated for leaking
memory. Neither has a fix on this line: glob 9 removed the sync and callback API that
`lib/cli/lookup-files.js` uses, and mocha only escaped glob in 11. Vendoring both is what keeps the
production tree free of deprecated packages, the same way `support/3.x` does it.

Regenerate with `npm pack glob@8.1.0` and re-apply the one inflight line rather than editing in place.
