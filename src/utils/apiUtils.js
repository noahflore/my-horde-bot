const axios = require('axios');
const { sendMessage, getMessageHistoryFormatted } = require('./messageUtils');

async function generateResponse(userPrompt, conversationId, message) {
    try {

        if (!message || typeof message.reply !== 'function') {
            throw new Error('Objeto message inválido.');
        }
         const history = await getMessageHistoryFormatted(message.channel, 10); // Últimas 10 mensagens
          // Criar o prompt com o histórico formatado
         const prompt = `${history}\n{{[USER1:INPUT]}} ${userPrompt}\n{{[OUTPUT]}}`;


        const response = await axios.post(
            'https://aihorde.net/api/v2/generate/text/async',
            { prompt:`${prompt}`, params: { temperature: 0.7, max_length: 100, n: 1, conversation_id: conversationId } },
            { headers: { 'Content-Type': 'application/json', apikey: process.env.AI_HORDE_API_KEY } }
        );

        const result = response.data;

        const checkStatus = async (id) => {
            const statusUrl = `https://aihorde.net/api/v2/generate/text/status/${id}`;
            try {
                const statusResponse = await axios.get(statusUrl);
                if (statusResponse.data.done) {
                    await sendMessage(message.channel, statusResponse.data.generations[0].text);
                } else {
                    setTimeout(() => checkStatus(id), statusResponse.data.wait_time * 1000);
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        };

        checkStatus(result.id);
    } catch (error) {
        console.error('Erro na integração com a API:', error);
        message.reply('Ocorreu um erro ao gerar o conteúdo.');
    }
}

module.exports = { generateResponse };
