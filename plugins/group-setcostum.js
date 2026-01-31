let handler = async (m, { usedPrefix, command, text }) => {
	if (!text)
		throw `Where is the text?\n\nExample:\n${usedPrefix + command} Hi @user\n\n@user = User Tag\n@subject = Group Name\n@desc = Group Description`;

	let chat = global.db.data.chats[m.chat];

	switch (command) {
		case 'setwelcome':
			chat.sWelcome = text;
			m.reply('✅ Welcome message successfully set:\n' + text);
			break;
		case 'setbye':
			chat.sBye = text;
			m.reply('✅ Bye message successfully set:\n' + text);
			break;
		case 'setpromote':
			chat.sPromote = text;
			m.reply('✅ Promote message successfully set:\n' + text);
			break;
		case 'setdemote':
			chat.sDemote = text;
			m.reply('✅ Demote message successfully set:\n' + text);
			break;
	}
};

handler.help = ['welcome', 'bye', 'promote', 'demote'].map(
	(v) => 'set' + v + ' <text>'
);
handler.tags = ['group'];
handler.command = /^(setwelcome|setbye|setpromote|setdemote)$/i;
handler.group = true;
handler.admin = true;

export default handler;