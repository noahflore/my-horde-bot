const { generateResponse } = require('../utils/apiUtils');
const { getMessageHistoryFormatted } = require('../utils/messageUtils')
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'cache',
    description: 'Cria um resumo da conversa e envia para o canal "cache".',
    async execute(message, args, client, botUsername) {
        try {
            // Verificar se a mensagem pode ser deletada
            if (!message.deletable) {
                await message.reply('Não tenho permissão para apagar esta mensagem.');
                return;
            }

            // Apagar a mensagem do usuário
            await message.delete();

            // Formatar o comando para o prompt
            const summaryPrompt = '{{[USER1:INPUT]}} faz um resumo disso';

            // Obter o histórico formatado
            const conversationHistory = await getMessageHistoryFormatted(message.channel, 100);
            const fullPrompt = `${conversationHistory}\n${summaryPrompt}\n{{[OUTPUT]}}`;

             // Enviar o prompt para gerar resposta
             const responseMessage = await message.channel.send('Gerando resumo... aguarde um momento.');

             // Gerar resposta usando a API
             await generateResponse(fullPrompt, message.channel.id, responseMessage);

             // Monitorar o canal para a resposta
             const filter = (msg) => msg.author.username === botUsername && msg.channel.id === message.channel.id;
            const collected = await message.channel.awaitMessages({
                filter,
                max: 1,
                time: 60000, // Tempo máximo de espera (60 segundos)
                errors: ['time'],
            });

 
             // Capturar e formatar o resumo
             const botReply = collected.first();
             const summary = botReply?.content || 'Erro ao capturar resposta do bot.';
 
            // Determinar o formato da resposta
            const isContinue = args.includes('continue');
            const formattedSummary = isContinue
                  ? `[Summary continue: ${summary}]`
                  : `[Summary: ${summary}]`;
                        
            // Determinar o canal de destino
            const cacheChannel = message.guild.channels.cache.find(
                (channel) => channel.name === 'cache' && channel.isTextBased()
            );

            if (!cacheChannel) {
                await message.channel.send('O canal "cache" não foi encontrado. Configure um canal com esse nome.');
                return;
            }

           // Verificar permissões no canal de destino
           if (!cacheChannel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) {
            await message.channel.send('Não tenho permissão para enviar mensagens no canal "cache".');
            return;
              }

           // Enviar o resumo formatado no canal "cache"
           await cacheChannel.send(formattedSummary);
        } catch (error) {
            console.error('Erro ao processar o comando !cache:', error.message);
            await message.channel.send('Houve um erro ao processar sua solicitação.');
        }
    },
};
