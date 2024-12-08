const { Client, GatewayIntentBits } = require('discord.js');
const { prefix } = require('./config');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Necessário para acessar o conteúdo das mensagens
    ]
});

const commandsPath = path.resolve(__dirname, 'commands');
const commands = new Map();
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
        const command = commands.get(commandName);
        try {
            await command.execute(message, args, client, client.user.username);
        } catch (error) {
            console.error(error);
            message.reply('Houve um erro ao executar este comando.');
        }
    }
});

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
