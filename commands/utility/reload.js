const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isPrivileged } = require('../../utils/is-privileged.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption((option) => option.setName('command').setDescription('The command to reload.').setRequired(true)),
	async execute(interaction) {
		if (!await isPrivileged(interaction)) {
			return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
		}

		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);
		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}

		const commandFolders = fs.readdirSync(path.join(__dirname, '..'));
		let commandFilePath = null;
		for (const folder of commandFolders) {
			const filePath = path.join(__dirname, '..', folder, `${command.data.name}.js`);
			if (fs.existsSync(filePath)) {
				commandFilePath = filePath;
				break;
			}
		}

		if (!commandFilePath) {
			return interaction.reply(`Could not find the file for \`${commandName}\`!`);
		}

		delete require.cache[require.resolve(commandFilePath)];
		const newCommand = require(commandFilePath);
		interaction.client.commands.set(newCommand.data.name, newCommand);
		interaction.client.cooldowns.delete(newCommand.data.name);

		await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
	},
};