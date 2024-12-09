const axios = require('axios');
const { sendMessage, getMessageHistoryFormatted } = require('./messageUtils');
const { PermissionsBitField } = require('discord.js');

async function generateResponse(userPrompt, conversationId, message, args=null, client) {
    try {
        // Verificar se o canal "cache" existe
        const cacheChannel = message.guild.channels.cache.find(
            (channel) => channel.name === 'cache' && channel.isTextBased()
        );

        let cacheContent = '';
        let prompt = ''; // Inicializar o prompt
        const history = await getMessageHistoryFormatted(message.channel, 10); // Padrão para o histórico
        if(args){
            if (args.includes('with-cache') && cacheChannel) {
                // Verificar permissões no canal "cache"
                if (!cacheChannel.permissionsFor(client.user).has(PermissionsBitField.Flags.ViewChannel)) {
                    await message.reply('Não tenho permissão para acessar o canal "cache".');
                    return;
                }
            }
                
                if (args.includes('with-cache')) {
                    // Lógica de cache
                    const cacheChannel = message.guild.channels.cache.find(
                        (channel) => channel.name === 'cache' && channel.isTextBased()
                    );
                
                    if (cacheChannel) {
                        const fetchedMessages = await cacheChannel.messages.fetch({ limit: 10 });
                        const cacheContent = fetchedMessages.map((msg) => msg.content).join('\n');
                
                        prompt = `\n${cacheContent}\n\n${message.content.replace('!gera', '').trim()}`;
                    } else {
                        prompt = `${history}\n{{[USER1:INPUT]}} ${userPrompt}\n{{[OUTPUT]}}`;
                    }
                } else {
                    // Histórico padrão sem cache
                    prompt = `${history}\n{{[USER1:INPUT]}} ${userPrompt}\n{{[OUTPUT]}}`;
                }
                
        }else{
            prompt = `${history}\n{{[USER1:INPUT]}} ${userPrompt}\n{{[OUTPUT]}}`;
        }
            

        // Enviar mensagem temporária
        const responseMessage = await message.channel.send('Gerando resposta... aguarde um momento.');

        // Fazer requisição para a AI Horde
        const response = await axios.post(
            'https://aihorde.net/api/v2/generate/text/async',
            {
                prompt: `${prompt}`,
                params: { temperature: 0.7, max_length: 100, n: 1, conversation_id: conversationId },
            },
            { headers: { 'Content-Type': 'application/json', apikey: process.env.AI_HORDE_API_KEY } }
        );

        const result = response.data;

        // Função para verificar o status da geração
        const checkStatus = async (id) => {
            const statusUrl = `https://aihorde.net/api/v2/generate/text/status/${id}`;
            try {
                const statusResponse = await axios.get(statusUrl);
                if (statusResponse.data.done) {
                    const botResponse = statusResponse.data.generations[0].text;
                    await sendMessage(message.channel, botResponse);

                    // Retornar a resposta gerada
                    return botResponse;
                } else {
                    setTimeout(() => checkStatus(id), (statusResponse.data.wait_time || 1) * 1000);
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        };

        // Iniciar a verificação do status
        checkStatus(result.id);
    } catch (error) {
        console.error('Erro na integração com a API:', error);
        if (message?.reply) {
            await message.reply('Ocorreu um erro ao gerar o conteúdo.');
        }
    }
}

module.exports = { generateResponse };
