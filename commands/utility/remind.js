const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { MAX_REMINDERS_PER_USER, reminders, scheduleReminder } = require('../../utils/reminders.js');

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

		if (reminders.countFor(interaction.user.id) >= MAX_REMINDERS_PER_USER) {
			return interaction.reply({
				content: `You already have ${MAX_REMINDERS_PER_USER} pending reminders. Wait for one to fire before adding another.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const ms = duration * 60 * 1000;
		const reminder = reminders.add({
			userId: interaction.user.id,
			channelId: interaction.channelId ?? null,
			message,
			fireAt: Date.now() + ms,
		});

		scheduleReminder(interaction.client, reminders, reminder);

		await interaction.reply({
			content: `Got it! I'll remind you in **${duration} minute${duration === 1 ? '' : 's'}**.`,
			flags: MessageFlags.Ephemeral,
		});
	},
};
