const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll dice using standard dice notation (e.g. 2d6).')
		.addStringOption((option) =>
			option.setName('dice').setDescription('Dice to roll in NdN format (e.g. 2d6, 1d20).').setRequired(true),
		),
	async execute(interaction) {
		const input = interaction.options.getString('dice').toLowerCase();
		const match = input.match(/^(\d+)d(\d+)$/);

		if (!match) {
			return interaction.reply({ content: 'Invalid format. Use dice notation like `2d6` or `1d20`.', ephemeral: true });
		}

		const count = parseInt(match[1]);
		const sides = parseInt(match[2]);

		if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
			return interaction.reply({ content: 'Use between 1–100 dice with 2–1000 sides.', ephemeral: true });
		}

		const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
		const total = rolls.reduce((a, b) => a + b, 0);

		const rollsDisplay = count > 1 ? ` (${rolls.join(', ')})` : '';
		await interaction.reply(`🎲 Rolled **${input}**: **${total}**${rollsDisplay}`);
	},
};
