import { deepinfra } from './ai-deepseek.js';

let handler = async (m, { text, usedPrefix, command }) => {
	const input = m.quoted ? m.quoted.text : text;
	if (!input)
		return m.reply(
			`Enter a question or command!\n\nExample:\n${usedPrefix + command} what is AI`
		);

	if (!conn.chatgpt) conn.chatgpt = {};
	if (!conn.chatgpt[m.sender]) conn.chatgpt[m.sender] = [];
	conn.chatgpt[m.sender].push({ role: 'user', content: input });

	try {
		const res = await deepinfra('openai/gpt-oss-120b', conn.chatgpt[m.sender]);
		conn.chatgpt[m.sender].push({ role: 'assistant', content: res });
		m.reply(res);
	} catch (err) {
		m.reply('An error occurred');
		console.error(err);
	}
};

handler.help = ['chatgpt'];
handler.tags = ['ai'];
handler.command = /^gpt|chatgpt$/i;
handler.register = true;
handler.limit = true;

export default handler;