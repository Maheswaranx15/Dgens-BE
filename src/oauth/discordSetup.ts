import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

const token = process.env.DISCORD_TOKEN;
client.on('ready', () => {
	console.log('Discord client is ready!');
});

client.login(token);

export default client