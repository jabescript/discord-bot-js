const { SlashCommandBuilder, REST, Routes, MessageFlags } = require('discord.js');
const { clientId, guildId, token } = require('../../config.js');
const { isPrivileged } = require('../../utils/is-privileged.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes a registered application (/) command.')
		.addStringOption((option) =>
			option.setName('command').setDescription('The command to delete.').setRequired(true),
		),
	async execute(interaction) {
		if (!await isPrivileged(interaction)) {
			return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
		}

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
