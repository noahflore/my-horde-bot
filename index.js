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
        {
          prompt: `${prompt}`,
          params: {
            temperature: 0.7,
            max_length: 512,
            n: 1,
            // Adicione outros parâmetros conforme necessário
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.AI_HORDE_API_KEY,
          },
        }
      );
      
      const result = response.data;
       
      const statusResponse = await axios.get(`https://aihorde.net/api/v2/generate/text/status/${result.id}`, {});
      
      const checkStatus = async (id) => {
        const statusUrl = `https://aihorde.net/api/v2/generate/text/status/${id}`;
        try {
          const statusResponse = await axios.get(statusUrl);
      
          if (statusResponse.data.done) {
            console.log("Texto gerado:", statusResponse.data.generations);
            message.reply(statusResponse.data.generations[0].text)
          } else {
            console.log("Ainda processando... tentando novamente em alguns segundos.");
            setTimeout(() => checkStatus(id), statusResponse.data.wait_time * 1000);
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      };
      
      // Inicie a verificação
      checkStatus(result.id);
      

    } catch (error) {
      console.error('Erro na integração com a API:', error.response ? error.response.data : error.message);
      message.reply('Ocorreu um erro ao gerar o conteúdo.');
    }
  }
});




// Logar o bot
client.login(DISCORD_TOKEN);
