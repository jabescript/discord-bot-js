const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_REMINDERS_PER_USER = 5;
const MAX_TIMEOUT_MS = 2_147_483_647;
const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'reminders.json');

function isValidReminder(value) {
	return Boolean(value)
		&& typeof value.id === 'string'
		&& typeof value.userId === 'string'
		&& typeof value.message === 'string'
		&& Number.isFinite(value.fireAt);
}

/**
 * Reminders persisted as a JSON array so pending timers survive a restart.
 */
class ReminderStore {
	constructor(filePath = DEFAULT_FILE) {
		this.filePath = filePath;
		this.reminders = [];
		this.load();
	}

	load() {
		try {
			const raw = fs.readFileSync(this.filePath, 'utf8');
			const parsed = JSON.parse(raw);
			this.reminders = Array.isArray(parsed) ? parsed.filter(isValidReminder) : [];
		}
		catch {
			// A missing or corrupt file simply means there is nothing to restore.
			this.reminders = [];
		}
	}

	all() {
		return [...this.reminders];
	}

	countFor(userId) {
		return this.reminders.filter((reminder) => reminder.userId === userId).length;
	}

	add({ userId, channelId = null, message, fireAt }) {
		const reminder = {
			id: crypto.randomUUID(),
			userId,
			channelId,
			message,
			fireAt,
		};
		this.reminders.push(reminder);
		this.persist();
		return reminder;
	}

	remove(id) {
		const remaining = this.reminders.filter((reminder) => reminder.id !== id);
		if (remaining.length === this.reminders.length) {
			return;
		}
		this.reminders = remaining;
		this.persist();
	}

	persist() {
		fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
		const tempPath = `${this.filePath}.tmp`;
		fs.writeFileSync(tempPath, JSON.stringify(this.reminders, null, 2));
		fs.renameSync(tempPath, this.filePath);
	}
}

/**
 * Sends the reminder by DM, falling back to the channel it was created in.
 * @param {import('discord.js').Client} client
 * @param {{ userId: string, channelId: string | null, message: string }} reminder
 * @returns {Promise<boolean>}
 */
async function deliver(client, reminder) {
	const user = await client.users.fetch(reminder.userId).catch(() => null);
	if (user) {
		try {
			await user.send(`⏰ Reminder: **${reminder.message}**`);
			return true;
		}
		catch {
			// DMs are closed; fall back to the original channel below.
		}
	}

	if (!reminder.channelId) {
		return false;
	}

	const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
	if (!channel || !channel.isTextBased()) {
		return false;
	}

	try {
		await channel.send(`⏰ <@${reminder.userId}> Reminder: **${reminder.message}**`);
		return true;
	}
	catch {
		// The channel is gone or the bot cannot post there; nothing left to try.
		return false;
	}
}

/**
 * Arms a timer for a single reminder and forgets it once delivered.
 * @param {import('discord.js').Client} client
 * @param {ReminderStore} store
 * @param {{ id: string, fireAt: number }} reminder
 */
function scheduleReminder(client, store, reminder) {
	const remaining = reminder.fireAt - Date.now();
	const delay = Math.max(0, Math.min(remaining, MAX_TIMEOUT_MS));

	setTimeout(async () => {
		store.remove(reminder.id);
		await deliver(client, reminder);
	}, delay);
}

/**
 * Re-arms every persisted reminder; overdue ones fire immediately.
 * @param {import('discord.js').Client} client
 * @param {ReminderStore} [store]
 * @returns {number} how many reminders were scheduled
 */
function scheduleAllReminders(client, store = reminders) {
	let scheduled = 0;
	for (const reminder of store.all()) {
		scheduleReminder(client, store, reminder);
		scheduled += 1;
	}
	return scheduled;
}

const reminders = new ReminderStore();

module.exports = {
	MAX_REMINDERS_PER_USER,
	ReminderStore,
	deliver,
	reminders,
	scheduleAllReminders,
	scheduleReminder,
};
