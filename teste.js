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

// Verificação e envio da mensagem
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

async function generateResponse(prompt, conversationId, message) {
  try {
    const response = await axios.post(
      'https://aihorde.net/api/v2/generate/text/async', // URL da API do AI Horde
      {
        prompt:`${message+prompt}`,

        params:{

          temperature:0.7,
          max_length:512,
          n:1,
          conversation_id:conversationId, // Adicione o ID de conversa à solicitação

        // Adicione outros parâmetros conforme necessário
        },
      },
      {

        headers:{

          'Content-Type':'application/json',
          apikey:process.env.AI_HORDE_API_KEY,
        },
      }
    );

    const result = response.data;

    // Verifique o status da geração periodicamente até que ela esteja concluída
    const checkStatus = async (id) => {
      const statusUrl = `https://aihorde.net/api/v2/generate/text/status/${id}`;
      try {
        const statusResponse = await axios.get(statusUrl);
        if (statusResponse.data.done) {
          console.log("Texto gerado:", statusResponse.data.generations[0].text);
          await sendMessage(message.channel, statusResponse.data.generations[0].text);
        } else {
          console.log("Ainda processando... tentando novamente em alguns segundos.");
          setTimeout(() => checkStatus(id), statusResponse.data.wait_time * 1000);
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      }
    };

    checkStatus(result.id);

  } catch (error) {

    console.error('Erro na integração com a API:', error.response ? error.response.data : error.message);
    message.reply('Ocorreu um erro ao gerar o conteúdo.');
  }
}

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Inicializar cliente do Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Token do Discord
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// URL da API do AI Horde
const AI_HORDE_URL = 'https://aihorde.net/api/v2/generate/text/async'; // Atualize para a URL correta

client.once('ready', () => {
  console.log(`Bot logado como ${client.user.tag}`);
});


client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignorar mensagens de bots

  const prefix = '!'; // Defina seu prefixo de comando aqui
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).split(/ +/);

  const command = args.shift().toLowerCase();
  const conversationId = message.channel.id; // Use o ID do canal como ID da conversa

  switch (command) {
    case 'gera':
      if (args.length === 0) {
        message.reply('Por favor, forneça uma solicitação para geração.');
      } else {
        const prompt = args.join(' ');
        generateResponse(prompt, conversationId, message);
      }
      break;
    default:
      break;
  }
});

client.login(DISCORD_TOKEN)