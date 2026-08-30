const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const { token } = require('./config.js');
const { loadCommands } = require('./utils/load-commands.js');

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();
client.cooldowns = new Collection();

for (const command of loadCommands()) {
	client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);

const port = process.env.PORT || 3000;
http.createServer((_, res) => res.end('OK')).listen(port);