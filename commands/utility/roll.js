const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { parseDice, rollDice } = require('../../utils/dice.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll dice using standard dice notation (e.g. 2d6).')
		.addStringOption((option) =>
			option.setName('dice').setDescription('Dice to roll in NdN format (e.g. 2d6, 1d20).').setRequired(true),
		),
	async execute(interaction) {
		const input = interaction.options.getString('dice');
		const dice = parseDice(input);

		if (dice.error === 'format') {
			return interaction.reply({ content: 'Invalid format. Use dice notation like `2d6` or `1d20`.', flags: MessageFlags.Ephemeral });
		}

		if (dice.error === 'range') {
			return interaction.reply({ content: 'Use between 1-100 dice with 2-1000 sides.', flags: MessageFlags.Ephemeral });
		}

		const rolls = rollDice(dice.count, dice.sides);
		const total = rolls.reduce((sum, roll) => sum + roll, 0);
		const rollsDisplay = dice.count > 1 ? ` (${rolls.join(', ')})` : '';

		await interaction.reply(`🎲 Rolled **${input.trim().toLowerCase()}**: **${total}**${rollsDisplay}`);
	},
};
