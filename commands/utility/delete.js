const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes a registered application (/) command.')
		.addStringOption((option) =>
			option.setName('command').setDescription('The command to delete.').setRequired(true),
		),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();

		const rest = new REST().setToken(token);

		const commands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
		const command = commands.find((cmd) => cmd.name === commandName);

		if (!command) {
			return interaction.reply(`There is no registered command with name \`${commandName}\`!`);
		}

		await rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));

		await interaction.reply(`Command \`${commandName}\` was successfully deleted!`);
	},
};
