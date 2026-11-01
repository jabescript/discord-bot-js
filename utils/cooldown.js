const { Collection } = require('discord.js');

const DEFAULT_COOLDOWN_SECONDS = 3;

/**
 * Returns the per-user timestamp collection for a command, creating it on first use.
 * @param {Collection<string, Collection<string, number>>} cooldowns
 * @param {string} commandName
 * @returns {Collection<string, number>}
 */
function ensureTimestamps(cooldowns, commandName) {
	if (!cooldowns.has(commandName)) {
		cooldowns.set(commandName, new Collection());
	}
	return cooldowns.get(commandName);
}

/**
 * Milliseconds until the user may run the command again; 0 when they are free to use it.
 * @param {Collection<string, number>} timestamps
 * @param {string} userId
 * @param {number} cooldownAmount
 * @param {number} [now]
 * @returns {number}
 */
function cooldownRemainingMs(timestamps, userId, cooldownAmount, now = Date.now()) {
	const lastUsed = timestamps.get(userId);
	if (typeof lastUsed !== 'number') {
		return 0;
	}
	return Math.max(0, lastUsed + cooldownAmount - now);
}

module.exports = {
	DEFAULT_COOLDOWN_SECONDS,
	cooldownRemainingMs,
	ensureTimestamps,
};
