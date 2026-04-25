const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whois')
		.setDescription('Shows account info for a user.')
		.addUserOption((option) =>
			option.setName('user').setDescription('The user to look up (defaults to yourself).'),
		),
	async execute(interaction) {
		if (!interaction.guild) {
			return interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
		}

		const target = interaction.options.getUser('user') ?? interaction.user;
		const member = await interaction.guild.members.fetch(target.id).catch(() => null);

		const embed = new EmbedBuilder()
			.setTitle(target.username)
			.setThumbnail(target.displayAvatarURL({ size: 256 }))
			.setColor(member?.displayColor || 0x5865f2)
			.addFields(
				{ name: 'Account created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
				{ name: 'Joined server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
				{ name: 'Roles', value: member ? member.roles.cache.filter((r) => r.id !== interaction.guild.id).map((r) => r.toString()).join(', ') || 'None' : 'N/A' },
			)
			.setFooter({ text: `ID: ${target.id}` });

		await interaction.reply({ embeds: [embed] });
	},
};
