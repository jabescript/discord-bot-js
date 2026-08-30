const { PermissionsBitField } = require('discord.js');

/**
 * Returns true if the user invoking the interaction is the bot owner
 * or has the Manage Guild permission in the current guild.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function isPrivileged(interaction) {
	try {
		const application = await interaction.client.application.fetch();
		const owner = application.owner;
		const ownerId = owner?.ownerId ?? owner?.id;
		if (ownerId != null && ownerId === interaction.user.id) {
			return true;
		}
	}
	catch {
		// If the owner can't be determined, fall through to the permission check.
	}

	return Boolean(interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild));
}

module.exports = { isPrivileged };
