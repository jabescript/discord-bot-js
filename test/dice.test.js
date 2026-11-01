const test = require('node:test');
const assert = require('node:assert/strict');

const { parseDice, rollDice } = require('../utils/dice.js');

test('parseDice accepts standard notation', () => {
	assert.deepEqual(parseDice('2d6'), { count: 2, sides: 6 });
	assert.deepEqual(parseDice(' 1D20 '), { count: 1, sides: 20 });
	assert.deepEqual(parseDice('100d1000'), { count: 100, sides: 1000 });
});

test('parseDice rejects malformed input', () => {
	assert.deepEqual(parseDice('2d'), { error: 'format' });
	assert.deepEqual(parseDice('d6'), { error: 'format' });
	assert.deepEqual(parseDice('2d6+1'), { error: 'format' });
	assert.deepEqual(parseDice('hello'), { error: 'format' });
	assert.deepEqual(parseDice(null), { error: 'format' });
	assert.deepEqual(parseDice(6), { error: 'format' });
});

test('parseDice rejects out-of-range values', () => {
	assert.deepEqual(parseDice('0d6'), { error: 'range' });
	assert.deepEqual(parseDice('101d6'), { error: 'range' });
	assert.deepEqual(parseDice('2d1'), { error: 'range' });
	assert.deepEqual(parseDice('2d1001'), { error: 'range' });
});

test('rollDice stays within bounds', () => {
	const rolls = rollDice(100, 6);
	assert.equal(rolls.length, 100);
	for (const roll of rolls) {
		assert.ok(roll >= 1 && roll <= 6);
	}
});

test('rollDice is deterministic with an injected random source', () => {
	assert.deepEqual(rollDice(3, 10, () => 0), [1, 1, 1]);
	assert.deepEqual(rollDice(2, 10, () => 0.999), [10, 10]);
});
