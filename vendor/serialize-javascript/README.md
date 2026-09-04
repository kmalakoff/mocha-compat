# vendored serialize-javascript

serialize-javascript 7.1.1 semantics with the UID generated via `randombytes` instead of
`crypto.getRandomValues`, which is the only reason upstream 7.1.1 declares `engines: >=20`.

Upstream 6.x — what mocha 10.8.2 depends on — carries two advisories (RCE via a spoofed
`toISOString`, RCE via `RegExp.flags`) and there is no fixed version that runs below Node 20.

Kept byte-identical to `function-exec-sync`'s `dist/cjs/serialize-javascript.js` so the two can be
diffed. Regenerate from there rather than editing in place.
