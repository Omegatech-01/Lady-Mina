let handler = async (m, { conn, isAdmin, isBotAdmin, usedPrefix, command }) => {
	if (!m.quoted)
		return m.reply(
			`Reply to the message you want to delete with the caption ${usedPrefix + command}`
		);

	if (m.quoted.fromMe) {
		await m.quoted.delete();
	} else {
		if (!isBotAdmin) return global.dfail('botAdmin', m, conn);
		if (!isAdmin) return global.dfail('admin', m, conn);

		let participant =
			m.message.extendedTextMessage.contextInfo.participant;
		let messageId =
			m.message.extendedTextMessage.contextInfo.stanzaId;

		await conn.sendMessage(m.chat, {
			delete: {
				remoteJid: m.chat,
				fromMe: false,
				id: messageId,
				participant: participant,
			},
		});
	}
};

handler.help = ['del'];
handler.tags = ['tools'];
handler.command = /^(del|delete|hapus?)$/i;
handler.limit = false;

export default handler;