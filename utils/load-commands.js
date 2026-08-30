const fs = require('node:fs');
const path = require('node:path');

/**
 * Recursively loads every command module under the commands directory.
 * A valid command module must export a `data` (SlashCommandBuilder) and an `execute` function.
 * @param {string} [commandsDir] Absolute path to the commands directory.
 * @returns {Array<{ data: object, execute: Function }>}
 */
function loadCommands(commandsDir = path.join(__dirname, '..', 'commands')) {
	const commands = [];
	const commandFolders = fs.readdirSync(commandsDir);

	for (const folder of commandFolders) {
		const folderPath = path.join(commandsDir, folder);
		if (!fs.statSync(folderPath).isDirectory()) {
			continue;
		}

		const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(folderPath, file);
			const command = require(filePath);

			if ('data' in command && 'execute' in command) {
				commands.push(command);
			}
			else {
				console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	return commands;
}

module.exports = { loadCommands };
