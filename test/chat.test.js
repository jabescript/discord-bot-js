const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DISCORD_TOKEN = 'test-token';
delete process.env.DEEPSEEK_API_KEY;

const { MessageFlags } = require('discord.js');
const chat = require('../commands/utility/chat.js');

function fakeInteraction(subcommand, options = {}) {
	const replies = [];
	return {
		replies,
		channelId: 'channel-1',
		user: { id: 'user-1' },
		options: {
			getSubcommand: () => subcommand,
			getString: (name) => options[name] ?? null,
			getBoolean: (name) => options[name] ?? null,
		},
		async reply(payload) {
			replies.push(payload);
			return payload;
		},
	};
}

test('/chat reset clears history ephemerally', async () => {
	const interaction = fakeInteraction('reset');

	await chat.execute(interaction);

	assert.equal(interaction.replies.length, 1);
	assert.equal(interaction.replies[0].flags, MessageFlags.Ephemeral);
	assert.match(interaction.replies[0].content, /cleared/);
});

test('/chat ask reports a missing key ephemerally', async () => {
	const interaction = fakeInteraction('ask', { prompt: 'hello' });

	await chat.execute(interaction);

	assert.equal(interaction.replies.length, 1);
	assert.equal(interaction.replies[0].flags, MessageFlags.Ephemeral);
	assert.match(interaction.replies[0].content, /not configured/);
});

test('/chat ask rejects a blank prompt before calling the API', async () => {
	const interaction = fakeInteraction('ask', { prompt: '   ' });

	await chat.execute(interaction);

	assert.equal(interaction.replies[0].flags, MessageFlags.Ephemeral);
	assert.match(interaction.replies[0].content, /non-empty/);
});
