function splitMessage(content, maxLength = 2000) {
    const messages = [];
    while (content.length > 0) {
        let part = content.slice(0, maxLength);
        const lastNewline = part.lastIndexOf("\n");
        if (lastNewline > 0 && content.length > maxLength) {
            part = content.slice(0, lastNewline);
        }
        messages.push(part);
        content = content.slice(part.length);
    }
    return messages;
}

async function sendMessage(channel, content) {
    if (content.length <= 2000) {
        await channel.send(content);
    } else {
        const parts = splitMessage(content);
        for (const part of parts) {
            await channel.send(part);
        }
    }
}

async function getMessageHistoryFormatted(channel, limit = 10) {

    if (!channel || !channel.isTextBased || !channel.messages) {
        throw new Error('O canal fornecido não é válido ou não suporta mensagens.');
    }
      // Certifique-se de que o `limit` seja um número válido
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        limit = 10; // Valor padrão
        }
    const messages = await channel.messages.fetch({ limit }); // Busca as últimas mensagens
    const history = [];

    messages
        .filter((msg) => !msg.content.startsWith('!')) // Exclui mensagens que começam com '!'
        .reverse() // Reverte para manter a ordem cronológica
        .forEach((msg) => {
            const isBot = msg.author.bot;
            const formattedMessage = isBot
                ? `{{[OUTPUT]]}} ${msg.content}`
                : `{{[USER1:INPUT]}} ${msg.content}`;
            history.push(formattedMessage);
        });
    return history.join('\n');
}

module.exports = { splitMessage, sendMessage, getMessageHistoryFormatted };
