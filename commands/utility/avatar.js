const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription("Displays a user's avatar at full size.")
		.addUserOption((option) =>
			option.setName('user').setDescription('The user to fetch the avatar for (defaults to yourself).'),
		),
	async execute(interaction) {
		const target = interaction.options.getUser('user') ?? interaction.user;
		const avatarUrl = target.displayAvatarURL({ size: 1024 });

		const embed = new EmbedBuilder()
			.setTitle(`${target.username}'s avatar`)
			.setImage(avatarUrl)
			.setColor(0x5865f2)
			.setURL(avatarUrl);

		await interaction.reply({ embeds: [embed] });
	},
};
