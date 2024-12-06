const { generateResponse } = require('../utils/apiUtils');

module.exports = {
    name: 'gera',
    description: 'Gera texto usando a API AI Horde.',
    async execute(message, args) {
        if (args.length === 0) {
            return message.reply('Por favor, forneça uma solicitação para geração.');
        }

        const prompt = args.join(' ');
        const conversationId = message.channel.id; // Usar ID do canal como contexto
        await generateResponse(prompt, conversationId, message);
    },
};
