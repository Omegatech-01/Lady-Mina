const handler = async (m, { text, participants, groupMetadata, command }) => {
	const target = m.quoted
		? m.quoted.sender
		: m.mentionedJid && m.mentionedJid[0]
		? m.mentionedJid[0]
		: text
		? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
		: null;

	const cmd = ['add', 'kick', 'promote', 'demote'];

	if (cmd.includes(command) && !target)
		return m.reply('Reply or tag the user you want to process.');

	const inGc = participants.some(
		(v) => v.jid == target || v.id === target || v.phoneNumber === target
	);

	switch (command) {
		case 'add': {
			if (inGc) return m.reply('User is already in the group!');
			const response = await conn.groupParticipantsUpdate(m.chat, [target], 'add');
			const jpegThumbnail = await conn.profilePictureUrl(m.chat, 'image', 'buffer');

			for (const participant of response) {
				const jid =
					participant.content.attrs.phone_number ||
					participant.content.attrs.jid;
				const status = participant.status;

				if (status === '408') {
					m.reply(
						`Unable to add @${jid.split('@')[0]}!\nMaybe @${jid.split('@')[0]} just left this group or was kicked`
					);
				} else if (status === '403') {
					const inviteCode = participant.content.content[0].attrs.code;
					const inviteExp =
						participant.content.content[0].attrs.expiration;
					await m.reply(
						`Inviting @${jid.split('@')[0]} using invite link...`
					);

					await conn.sendGroupV4Invite(
						m.chat,
						jid,
						inviteCode,
						inviteExp,
						groupMetadata.subject,
						'Invitation to join my WhatsApp group',
						jpegThumbnail
					);
				}
			}
			break;
		}

		case 'kick':
			if (!inGc) return m.reply('User is not in the group.');
			conn.groupParticipantsUpdate(m.chat, [target], 'remove');
			m.reply(`Successfully kicked: @${target.split('@')[0]}`);
			break;

		case 'promote':
			if (!inGc) return m.reply('User is not in the group!');
			conn.groupParticipantsUpdate(m.chat, [target], 'promote');
			m.reply(`Promoted: @${target.split('@')[0]}`);
			break;

		case 'demote':
			if (!inGc) return m.reply('User is not in the group!');
			conn.groupParticipantsUpdate(m.chat, [target], 'demote');
			m.reply(`Demoted: @${target.split('@')[0]}`);
			break;

		case 'closegc':
		case 'mute':
			conn.groupSettingUpdate(m.chat, 'announcement');
			m.reply('Group successfully closed (only admins can chat).');
			break;

		case 'opengc':
		case 'unmute':
			conn.groupSettingUpdate(m.chat, 'not_announcement');
			m.reply('Group successfully opened (all members can chat).');
			break;

		default:
			return m.reply('Unknown command.');
	}
};

handler.help = ['add', 'kick', 'promote', 'demote', 'opengc', 'closegc'];
handler.tags = ['group'];
handler.command = /^(add|kick|promote|demote|mute|unmute|opengc|closegc)$/i;
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;