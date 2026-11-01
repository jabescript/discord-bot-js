const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const roll = require('../commands/utility/roll.js');

function fakeInteraction(dice) {
	const payloads = [];
	return {
		payloads,
		options: {
			getString: () => dice,
		},
		async reply(payload) {
			payloads.push(payload);
			return payload;
		},
	};
}

test('/roll rejects bad notation ephemerally', async () => {
	const interaction = fakeInteraction('banana');
	await roll.execute(interaction);

	assert.equal(interaction.payloads.length, 1);
	assert.equal(interaction.payloads[0].flags, MessageFlags.Ephemeral);
	assert.match(interaction.payloads[0].content, /Invalid format/);
});

test('/roll rejects out-of-range dice', async () => {
	const interaction = fakeInteraction('500d6');
	await roll.execute(interaction);

	assert.equal(interaction.payloads[0].flags, MessageFlags.Ephemeral);
	assert.match(interaction.payloads[0].content, /between 1-100 dice/);
});

test('/roll reports a total for valid dice', async () => {
	const interaction = fakeInteraction('2d6');
	await roll.execute(interaction);

	assert.match(interaction.payloads[0], /Rolled \*\*2d6\*\*: \*\*\d+\*\*/);
});
