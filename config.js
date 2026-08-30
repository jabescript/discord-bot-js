const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
	throw new Error('DISCORD_TOKEN is not set. Copy .env.example to .env and fill in your token.');
}

if (!clientId) {
	console.warn('[WARNING] CLIENT_ID is not set. Command deployment and the /delete command will not work.');
}

if (!guildId) {
	console.warn('[WARNING] GUILD_ID is not set. Command deployment will not work.');
}

module.exports = { token, clientId, guildId };
