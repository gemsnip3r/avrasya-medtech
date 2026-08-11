import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession, canWriteKind } from '../api/crm/_lib/security.js';

test('signed session round-trips and rejects tampering', () => {
  const secret='test-secret-that-is-long-enough';
  const token=signSession({uid:'u1',role:'Admin'},secret,60);
  assert.equal(verifySession(token,secret).uid,'u1');
  assert.equal(verifySession(token+'x',secret),null);
});

test('expired session is rejected', () => {
  const secret='test-secret-that-is-long-enough';
  const token=signSession({uid:'u1'},secret,-1);
  assert.equal(verifySession(token,secret),null);
});

test('role permissions restrict sensitive collections', () => {
  assert.equal(canWriteKind('Admin','users'),true);
  assert.equal(canWriteKind('Satış Temsilcisi','users'),false);
  assert.equal(canWriteKind('Bayi','finance'),false);
  assert.equal(canWriteKind('Satış Müdürü','customers'),true);
});
