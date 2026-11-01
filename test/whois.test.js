const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const whois = require('../commands/utility/whois.js');

test('/whois refuses to run outside a guild', async () => {
	const payloads = [];
	const interaction = {
		guild: null,
		async reply(payload) {
			payloads.push(payload);
			return payload;
		},
	};

	await whois.execute(interaction);

	assert.equal(payloads.length, 1);
	assert.equal(payloads[0].flags, MessageFlags.Ephemeral);
	assert.match(payloads[0].content, /only be used in a server/);
});
