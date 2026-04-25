const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Set a reminder that DMs you after a duration.')
		.addIntegerOption((option) =>
			option.setName('duration').setDescription('How long to wait (in minutes).').setRequired(true).setMinValue(1).setMaxValue(10080),
		)
		.addStringOption((option) =>
			option.setName('message').setDescription('What to remind you about.').setRequired(true),
		),
	async execute(interaction) {
		const duration = interaction.options.getInteger('duration');
		const message = interaction.options.getString('message');
		const ms = duration * 60 * 1000;

		await interaction.reply({
			content: `Got it! I'll remind you in **${duration} minute${duration === 1 ? '' : 's'}**.`,
			flags: MessageFlags.Ephemeral,
		});

		setTimeout(async () => {
			try {
				await interaction.user.send(`⏰ Reminder: **${message}**`);
			} catch {
				// DMs disabled — silently fail
			}
		}, ms);
	},
};
