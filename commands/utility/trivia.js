const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const he = require('he');

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

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

		const decode = (str) => he.decode(str);

		const allAnswers = shuffle([...q.incorrect_answers, q.correct_answer].map(decode));

		const embed = new EmbedBuilder()
			.setTitle('🧠 Trivia')
			.setDescription(decode(q.question))
			.addFields(
				{ name: 'Category', value: decode(q.category), inline: true },
				{ name: 'Difficulty', value: decode(q.difficulty), inline: true },
				{ name: 'Answers', value: allAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n') },
				{ name: 'Answer', value: `||${decode(q.correct_answer)}||` },
			)
			.setColor(0x5865f2);

		await interaction.editReply({ embeds: [embed] });
	},
};
