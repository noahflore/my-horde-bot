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

// Responde a mensagens
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!gerar')) {
    const prompt = message.content.replace('!gerar', '').trim();

    if (!prompt) {
      return message.reply('Por favor, forneça um prompt para gerar conteúdo!');
    }

    message.reply('Gerando, por favor aguarde...');

    try {
      const response = await axios.post(
        'https://aihorde.net/api/v2/generate/text/async', 
        { prompt }, 
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.AI_HORDE_API_KEY, // Substitua se necessário
          },
        }
      );
      

      const result = response.data;
      message.reply(`Aqui está o resultado:\n${JSON.stringify(result, null, 2)}`);      
    } catch (error) {
      console.error('Erro na integração com a API:', error.response ? error.response.data : error.message);
      message.reply('Ocorreu um erro ao gerar o conteúdo.');
    }
  }
});




// Logar o bot
client.login(DISCORD_TOKEN);
