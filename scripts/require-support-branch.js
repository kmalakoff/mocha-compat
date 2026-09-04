// Refuses to publish from any branch but support/*. master mirrors support/3.x and is never a release source.
var branch = require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
if (branch.indexOf('support/') !== 0) {
  console.error('mocha-compat publishes only from a support/* branch; HEAD is ' + branch);
  process.exit(1);
}
