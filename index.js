const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

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

const port = process.env.PORT || 3000;
const server = http.createServer((_, res) => {
	const ready = client.isReady();
	res.writeHead(ready ? 200 : 503, { 'Content-Type': 'text/plain' });
	res.end(ready ? 'OK' : 'Starting');
});

server.on('error', (error) => {
	console.error('Health check server error:', error);
});

server.listen(port, () => {
	console.log(`Health check listening on port ${port}.`);
});

client.on(Events.Error, (error) => {
	console.error('Discord client error:', error);
});

process.on('unhandledRejection', (reason) => {
	console.error('Unhandled promise rejection:', reason);
});

let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`${signal} received, shutting down.`);

	server.close();
	await client.destroy();
	process.exit(exitCode);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
	console.error('Uncaught exception:', error);
	shutdown('uncaughtException', 1);
});

client.login(token).catch((error) => {
	console.error('Failed to log in:', error);
	shutdown('login failure', 1);
});
