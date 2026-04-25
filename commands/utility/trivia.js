const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trivia')
		.setDescription('Get a random trivia question.'),
	async execute(interaction) {
		await interaction.deferReply();

		const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple').catch(() => null);

		if (!res || !res.ok) {
			return interaction.editReply('Failed to fetch a trivia question. Try again later.');
		}

		const { results } = await res.json();
		const q = results[0];

		const decode = (str) => str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

		const allAnswers = [...q.incorrect_answers, q.correct_answer]
			.map(decode)
			.sort(() => Math.random() - 0.5);

		const embed = new EmbedBuilder()
			.setTitle('🧠 Trivia')
			.setDescription(decode(q.question))
			.addFields(
				{ name: 'Category', value: q.category, inline: true },
				{ name: 'Difficulty', value: q.difficulty, inline: true },
				{ name: 'Answers', value: allAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n') },
				{ name: 'Answer', value: `||${decode(q.correct_answer)}||` },
			)
			.setColor(0x5865f2);

		await interaction.editReply({ embeds: [embed] });
	},
};
