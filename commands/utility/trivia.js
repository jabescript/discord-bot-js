const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const he = require('he');

const API_URL = 'https://opentdb.com/api.php';
const CACHE_SIZE = 5;
const REQUEST_TIMEOUT_MS = 5000;

const cache = [];

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

function isValidQuestion(question) {
	return Boolean(question)
		&& typeof question.question === 'string'
		&& typeof question.correct_answer === 'string'
		&& Array.isArray(question.incorrect_answers);
}

function normalizeQuestion(question) {
	return {
		question: he.decode(question.question),
		category: he.decode(question.category ?? 'Unknown'),
		difficulty: he.decode(question.difficulty ?? 'Unknown'),
		correct: he.decode(question.correct_answer),
		incorrect: question.incorrect_answers.map((answer) => he.decode(answer)),
	};
}

async function fetchQuestions(amount) {
	const response = await fetch(`${API_URL}?amount=${amount}&type=multiple`, {
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	}).catch(() => null);

	if (!response || !response.ok) {
		return [];
	}

	const data = await response.json().catch(() => null);
	if (!data || !Array.isArray(data.results)) {
		return [];
	}

	return data.results.filter(isValidQuestion).map(normalizeQuestion);
}

async function nextQuestion() {
	if (cache.length === 0) {
		cache.push(...await fetchQuestions(CACHE_SIZE));
	}
	return cache.pop() ?? null;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trivia')
		.setDescription('Get a random trivia question.'),
	async execute(interaction) {
		await interaction.deferReply();

		const question = await nextQuestion();
		if (!question) {
			return interaction.editReply('Failed to fetch a trivia question. Try again later.');
		}

		const allAnswers = shuffle([...question.incorrect, question.correct]);

		const embed = new EmbedBuilder()
			.setTitle('🧠 Trivia')
			.setDescription(question.question)
			.addFields(
				{ name: 'Category', value: question.category, inline: true },
				{ name: 'Difficulty', value: question.difficulty, inline: true },
				{ name: 'Answers', value: allAnswers.map((answer, index) => `${index + 1}. ${answer}`).join('\n') },
				{ name: 'Answer', value: `||${question.correct}||` },
			)
			.setColor(0x5865f2);

		await interaction.editReply({ embeds: [embed] });
	},
};
