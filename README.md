# mocha-compat

A fork of [mocha](https://github.com/mochajs/mocha), published as `mocha-compat`, maintained so that
old and new Node versions can each run a mocha that works there — and so that both can be installed
alongside real `mocha` in one project.

Two maintenance lines are published from the same npm package under different majors. Install the one
you need as an alias; the alias name is also the bin name.

| Line | Install | Bins | Node | Branch |
|------|---------|------|------|--------|
| 3.x | `"mocha-compat-3": "npm:mocha-compat@^3"` | `mocha-compat-3`, `_mocha-compat-3` | 0.10 → 26 | [`support/3.x`](../../tree/support/3.x) |
| 10.x | `"mocha-compat-10": "npm:mocha-compat@^10"` | `mocha-compat-10`, `_mocha-compat-10` | 12.17 → 26 | [`support/10.x`](../../tree/support/10.x) |

The 3.x line is a fork of mocha 3.5.3 and has no ESM or parallel mode. The 10.x line is a fork of
mocha 10.8.2 and has both. Both vendor their deprecated dependencies so that `npm audit --omit=dev`
is clean and a consumer's production tree carries no deprecated package.

`mocha-compat-3` also still declares the unhyphenated `mocha-compat` and `_mocha-compat` bins, as
transitional aliases for consumers that predate the rename.

## This branch

`master` is the fork's front door: this README and `CONTRIBUTING.md`, and no mocha source. Neither
line lives here, because with two of them choosing one would be arbitrary. The code and the releases
live on the `support/*` branches, each release tagged `v<version>` on its own branch, and
`prepublishOnly` refuses to publish from anywhere else.

Start at [CONTRIBUTING.md](CONTRIBUTING.md) for the branch layout, the versioning and dist-tag rules,
both release procedures, and the traps.
