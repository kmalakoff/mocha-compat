# vendored inflight

inflight 1.0.6, byte-identical to the published tarball. Reached only from `../glob/glob.js`, which
requires it by relative path.

Upstream deprecated it for leaking memory and published no successor. It is vendored rather than
installed so a consumer's production tree carries no deprecated package; see `../glob/README.md` for
why glob itself cannot simply be upgraded.

Regenerate with `npm pack inflight@1.0.6` rather than editing in place.
