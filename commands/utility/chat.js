const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { deepseekApiKey } = require('../../config.js');
const { ChatApiError, buildMessages, requestChat, splitMessage } = require('../../utils/deepseek.js');
const { ChatHistory } = require('../../utils/chat-history.js');

const history = new ChatHistory();
const inFlight = new Set();
const MAX_CHUNKS = 3;

function errorMessage(error) {
	if (!(error instanceof ChatApiError)) {
		return 'Something went wrong while talking to the model. Try again later.';
	}

	if (error.status === 401) {
		return 'The model rejected the API key. Check DEEPSEEK_API_KEY.';
	}

	if (error.status === 402) {
		return 'The DeepSeek account has run out of credit.';
	}

	if (error.status === 429) {
		return 'The model is rate limited right now. Try again in a moment.';
	}

	return 'The model is unavailable right now. Try again later.';
}

async function ask(interaction) {
	const prompt = interaction.options.getString('prompt', true).trim();
	const isPrivate = interaction.options.getBoolean('private') ?? false;
	const channelId = interaction.channelId ?? 'unknown';

	if (prompt.length === 0) {
		return interaction.reply({ content: 'Please send a non-empty prompt.', flags: MessageFlags.Ephemeral });
	}

	if (!deepseekApiKey) {
		return interaction.reply({ content: 'Chat is not configured: DEEPSEEK_API_KEY is missing.', flags: MessageFlags.Ephemeral });
	}

	if (inFlight.has(interaction.user.id)) {
		return interaction.reply({ content: 'Still thinking about your last message. Give me a moment.', flags: MessageFlags.Ephemeral });
	}

	inFlight.add(interaction.user.id);

	try {
		await interaction.deferReply(isPrivate ? { flags: MessageFlags.Ephemeral } : {});

		const messages = buildMessages(history.get(channelId, interaction.user.id), prompt);
		const answer = await requestChat(messages, { apiKey: deepseekApiKey });
		const chunks = splitMessage(answer).slice(0, MAX_CHUNKS);

		history.append(channelId, interaction.user.id, 'user', prompt);
		history.append(channelId, interaction.user.id, 'assistant', answer);

		await interaction.editReply(chunks[0]);
		for (const chunk of chunks.slice(1)) {
			await interaction.followUp(isPrivate ? { content: chunk, flags: MessageFlags.Ephemeral } : { content: chunk });
		}
	}
	catch (error) {
		console.error('Chat command failed:', error);

		const content = errorMessage(error);
		if (interaction.deferred || interaction.replied) {
			await interaction.editReply(content);
		}
		else {
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}
	}
	finally {
		inFlight.delete(interaction.user.id);
	}
}

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Talk to the bot using the DeepSeek model.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('ask')
				.setDescription('Send a message to the model.')
				.addStringOption((option) =>
					option.setName('prompt').setDescription('What you want to say.').setRequired(true).setMaxLength(2000),
				)
				.addBooleanOption((option) =>
					option.setName('private').setDescription('Only you can see the reply.'),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('reset').setDescription('Forget this conversation.'),
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'reset') {
			history.clear(interaction.channelId ?? 'unknown', interaction.user.id);
			return interaction.reply({ content: 'Conversation cleared.', flags: MessageFlags.Ephemeral });
		}

		return ask(interaction);
	},
};
