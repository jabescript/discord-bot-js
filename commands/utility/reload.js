const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption((option) => option.setName('command').setDescription('The command to reload.').setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);
		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}

		const commandFolders = require('node:fs').readdirSync(require('node:path').join(__dirname, '..'));
		let commandFilePath = null;
		for (const folder of commandFolders) {
			const filePath = require('node:path').join(__dirname, '..', folder, `${command.data.name}.js`);
			if (require('node:fs').existsSync(filePath)) {
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

		await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
	},
};