const test = require('node:test');
const assert = require('node:assert/strict');
const { Collection } = require('discord.js');

const { cooldownRemainingMs, ensureTimestamps } = require('../utils/cooldown.js');

test('ensureTimestamps creates and reuses one collection per command', () => {
	const cooldowns = new Collection();
	const first = ensureTimestamps(cooldowns, 'ping');
	const second = ensureTimestamps(cooldowns, 'ping');

	assert.ok(first instanceof Collection);
	assert.equal(first, second);
	assert.equal(cooldowns.size, 1);
});

test('cooldownRemainingMs reports the remaining time', () => {
	const timestamps = new Collection([['user-1', 1_000]]);

	assert.equal(cooldownRemainingMs(timestamps, 'user-1', 3_000, 2_000), 2_000);
	assert.equal(cooldownRemainingMs(timestamps, 'user-1', 3_000, 3_500), 500);
});

test('cooldownRemainingMs expires and ignores unknown users', () => {
	const timestamps = new Collection([['user-1', 1_000]]);

	assert.equal(cooldownRemainingMs(timestamps, 'user-1', 3_000, 4_000), 0);
	assert.equal(cooldownRemainingMs(timestamps, 'user-2', 3_000, 1_100), 0);
});
