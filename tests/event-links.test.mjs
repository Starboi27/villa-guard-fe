import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventDetailPath, legacyEventPath } from '../src/lib/eventLinks.js';

const id = '8f1c2a7e-3b9d-4f4e-9a51-2c6d0e7b1a10';

test('notification login returns to the detail, including after a session expires on a report page', () => {
  for (const suffix of ['', '/', '/report', '/report/complete']) {
    assert.equal(eventDetailPath(`/events/${id}${suffix}`), `/events/${id}`);
  }
  assert.equal(eventDetailPath(`/events/${id.toUpperCase()}`), `/events/${id}`);
});

test('login never follows external, malformed, or unrelated return paths', () => {
  for (const path of [undefined, {}, '/events', `https://other.test/events/${id}`,
    `//other.test/events/${id}`, `/events/${'-'.repeat(36)}`, `/events/${id}extra`,
    `/events/${id}/other`, `/events/${id}?returnTo=https://other.test`]) {
    assert.equal(eventDetailPath(path), null);
  }
});

test('legacy notification hashes resolve to the same event detail', () => {
  assert.equal(legacyEventPath(`#event=${id}`), `/events/${id}`);
  assert.equal(legacyEventPath('#event=invalid'), null);
  assert.equal(legacyEventPath(`#other=${id}`), null);
});
