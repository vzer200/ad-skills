const test = require('node:test');
const assert = require('node:assert/strict');

const login = require('../lib/login');

test('SSH probe forces the selected key and disables unrelated identities', () => {
  const args = login.buildSshProbeArgs('/root/.ssh/id_ed25519');

  assert.deepEqual(args.slice(0, 6), [
    '-i',
    '/root/.ssh/id_ed25519',
    '-o',
    'IdentitiesOnly=yes',
    '-o',
    'BatchMode=yes'
  ]);
  assert.equal(args.at(-1), 'git@git.sangfor.com');
});
