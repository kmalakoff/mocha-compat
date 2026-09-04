# Maintaining mocha-compat

Upstream mocha's contributor guide is `.github/CONTRIBUTING.md` and still applies to the mocha code
itself. This file covers what is specific to the fork: the branch layout and how a release is cut.

## Branch layout

Two maintenance lines, published to the same npm package under different majors, each on its own
explicit support branch. Both are named; `master` is only a mirror (see below):

    support/3.x     mocha 3.x base       Node 0.10 -> 26    no ESM test files, no parallel mode
    support/10.x    mocha 10.8.2 base    Node 12.17 -> 26   ESM + parallel

Release from the support branch. Consumers alias by major, so nothing depends on the bare name:

    "mocha-compat-3":  "npm:mocha-compat@^3.6.3"
    "mocha-compat-10": "npm:mocha-compat@^10"

Each line declares its own hyphenated, major-suffixed bin names:

    support/3.x     mocha-compat-3  / _mocha-compat-3
                    mocha-compat    / _mocha-compat    (transitional aliases, same files)
    support/10.x    mocha-compat-10 / _mocha-compat-10

This is load-bearing, not cosmetic. An npm alias keeps the *aliased* package's bin names, so if both
lines declared `mocha` (or both declared `mocha-compat`), a project depending on mocha plus both
aliases would have two packages claiming one bin name. npm links only one of them and chmods only
what it links, leaving the loser non-executable — which is exactly the exit-17 failure this fork was
created to fix. 3.6.4 added the `-3` names and keeps `mocha-compat` / `_mocha-compat` as aliases, so
existing `^3` consumers keep working. Dropping the aliases is a breaking change reserved for a later,
announced release; until then nothing new should reference them.

## master

`master` is a read-only mirror of `support/3.x`, the line that owns npm `latest`, so GitHub's default
view shows a real README and this file. It is fast-forwarded after each 3.x release and never
receives commits, branches, or publishes of its own. Nothing is decided by master's state: the
release sources are the `support/*` branches, each release is the tag `v<version>` on its branch,
and `prepublishOnly` on both lines runs `scripts/require-support-branch.js`, which refuses to publish
from any other branch.

Agents: before editing or publishing, check `git rev-parse --abbrev-ref HEAD` starts with
`support/`. If it is `master`, check out the support branch instead; after a 3.x release,
`git branch -f master support/3.x && git push origin master`.

## Versioning

Start a line at upstream mocha's last version for that major, then increment normally. The 3.x line
set the precedent: upstream ended 3.x at 3.5.3, mocha-compat published 3.5.3, then 3.5.4, 3.5.5,
3.6.0 ... 3.6.3. No `-compat` suffix, no version skipping. Sharing upstream's version while diverging
from it is expected and has never caused confusion.

The 10.x line therefore publishes first as 10.8.2.

## dist-tags

`npm publish` moves `latest` to the highest version published, so publishing 10.8.2 makes a bare
`npm i mocha-compat` serve mocha 10 rather than the 0.10-era fork. That only affects a human typing
the bare install; every consumer pins a major through an alias. `npm publish --tag <name>` publishes
without moving `latest`, and `npm dist-tag add mocha-compat@<version> latest` reverses it at any time.

Every line carries the dist-tag `support-<major>`, matching its branch name: `support-3` and
`support-10`. `latest` stays on 3.x, because published tsds-mocha 1.18.6–1.21.3 depend on
`mocha-compat@*` and `*` resolves to `latest`.

    support/3.x     npm publish --tag support-3
                    npm dist-tag add mocha-compat@<version> latest
    support/10.x    npm publish --tag support-10

Both lines name their tag. A bare `npm publish` on 3.x is refused outright once a 10.x version
exists, because npm will not implicitly move `latest` backwards to a lower version. So 3.x publishes
under `support-3` and then moves `latest` itself.

## Releasing support/3.x

    npm install --allow-git=all      # npm 12 defaults to allow-git=none; a git devDependency
                                     # inherited from upstream 3.x fails EALLOWGIT without it
    make test-node                   # NOT `npm test` — that is `make test && make clean`, and
                                     # make test includes test-browser, needing karma + SauceLabs
    nvu engines make test-node       # same reason

The 3.x test SUITE fails on Node >= 0.12 at `test-integration`: `SyntaxError: Unexpected token m` in
`test/integration/helpers.js`, which JSON.parses a child mocha's stdout while newer Node prepends
warnings to it. That is 2016-era test rot, not a broken package — mocha-compat 3.6.3 itself runs
tests fine on 0.10 through 26. Do not read that red sweep as a regression.

`.ncurc.json` rejects the seven runtime dependencies whose current majors cannot load on Node 0.10
(commander, debug, diff, escape-string-regexp, minimatch, mkdirp, supports-color) plus four
devDependencies ncu pushes to Node-18+ majors. `"upgrade": true` is set, so **any** `ncu` invocation
in this repo writes to package.json — there is no dry run. Re-measure before changing that list:
install the candidate at its latest major and require it on Node 0.10.

## Releasing support/10.x

    nvu 24 npm ci                    # npm ci, NOT npm install -- see the lockfile trap below.
                                     # no --allow-git=all; 10.8.2 has no git dependencies
    nvu 24 npm run test-node         # upstream ships the Node-only subset
    node bin/mocha.js --timeout 10000 --slow 3750 test/integration/parallel.spec.js
    node bin/mocha.js --timeout 10000 --slow 3750 test/integration/options/parallel.spec.js
    npm audit --omit=dev             # must be 0 — production is what consumers inherit

The parallel specs are mandatory. `vendor/serialize-javascript` is reachable only through
parallel-mode worker IPC (`lib/nodejs/buffered-worker-pool.js`), so a green suite that never runs
`--parallel` proves nothing about it. Run that gate on Node 12.17 through 26. Node 12.17 is the
floor: mocha 10 calls `import()` unconditionally and Node unflagged it in 12.17.0; below it every
file fails with `Error: Not supported`. The suite itself is green on 20.20, 22, 24 and 26; on 26 it
needs yargs >= 16.2.2 in the lock (16.2.0 crashes at `require('yargs/yargs')`).

`npm audit` without `--omit=dev` reports ~92 findings from upstream's 2024-era devDependencies. None
reach consumers.

## Traps

- **Use `npm ci` on 10.x.** `npm install` rewrites the committed lockfile (renames, dedupes) and
  `.npmrc` pins `lockfile-version=2` so the file stays npm 6 compatible. The committed lock carries
  the fixed brace-expansion, braces and picomatch versions; keep it committed.
- **rewiremock stubs by module name.** `test/node-unit/buffered-worker-pool.spec.js` names the module
  it stubs; repointing a require without updating both the spy source and the rewiremock key silently
  stops the stub being injected. The parallel specs don't use the spy, so only the full suite catches it.
- **Stale `BUILDTMP/mocha.js`** (a 3.x browserify bundle) survives branch switches and is picked up by
  10.x's eslint glob, producing ~248 false-positive errors from 3.x code. `rm -rf BUILDTMP` first.
- **On 3.x, `mocha.js` at the repo root is tracked**; on 10.x it is gitignored. Cleaning up
  build-artifact-looking names while on 3.x deletes tracked content.
- **One checkout, two lines.** Switching branches swaps `node_modules` for the whole checkout and the
  two lines need different installs. Serialise the work, or use `git worktree`.
