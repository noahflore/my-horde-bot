const { getMessageHistoryFormatted } = require('../utils/messageUtils');
const { generateResponse } = require('../utils/apiUtils');

module.exports = {
    name: 'continua',
    description: 'Faz o bot continuar o texto com base no histórico.',
    async execute(message) {
        try {

            if (!message.deletable) {
                await message.reply('Não tenho permissões para apagar esta mensagem.');
                return;
            }
            // Verifica se o bot está em um servidor e obtém o membro do bot
            const botMember = message.guild?.members.me;
            if (!botMember) {
                return message.channel.send('Não consegui acessar as permissões do bot neste servidor.');
            }

            // Verifica se o bot tem permissão para apagar mensagens
            if (!botMember.permissionsIn(message.channel).has('ManageMessages')) {
                return message.channel.send('Não tenho permissão para apagar mensagens neste canal.');
            }
            // Apaga a mensagem original do usuário
            await message.delete();

            // Obtém o histórico formatado
            const history = await getMessageHistoryFormatted(message.channel, 100);

            // Cria o prompt com base no histórico
            const prompt = `${history}\n{{[USER1:INPUT]}}\n{{[OUTPUT]}}`;

            // Gera a resposta e envia no canal
            await generateResponse(prompt, message.channel.id, message);
        } catch (error) {
            console.error('Erro ao processar o comando !continua:', error);
            message.channel.send('Ocorreu um erro ao tentar continuar o texto.');
        }
    },
};
