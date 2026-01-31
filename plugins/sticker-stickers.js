let handler = async (m, { text }) => {
	let q = m.quoted ? m.quoted : m;
	let mime = (q.msg || q).mimetype || '';

	if (/image|video|webp/.test(mime)) {
		if ((q.msg?.seconds || q.seconds) > 10) {
			return m.reply('The video must be under 10 seconds long.');
		}

		let media = await q.download();
		let exif;
		if (text) {
			const [packname, author] = text.split(/[,|\-+&]/);
			exif = { packName: packname || '', packPublish: author || '' };
		}
		conn.sendSticker(m.chat, media, m, exif);
	} else {
		m.reply('Send or reply to media to turn it into a sticker.');
	}
};

handler.help = ['sticker'];
handler.tags = ['sticker'];
handler.command = /^s(tic?ker)?(gif)?$/i;
handler.register = true;

export default handler;