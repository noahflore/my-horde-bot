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

async function getMessageHistory(channel, limit = 10) {
    const messages = await channel.messages.fetch({ limit });
    // Ordenar mensagens do mais antigo ao mais recente
    const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    return sortedMessages.map(msg => `${msg.author.username}: ${msg.content}`).join('\n');
}


module.exports = { splitMessage, sendMessage, getMessageHistory };
