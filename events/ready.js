const { Events } = require('discord.js');
const { scheduleAllReminders } = require('../utils/reminders.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const scheduled = scheduleAllReminders(client);
		if (scheduled > 0) {
			console.log(`Restored ${scheduled} pending reminder(s).`);
		}
	},
};
