let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
    const isEnable = /^(true|enable|(turn)?on|1)$/i.test(command);
    const chat = global.db.data.chats[m.chat];
    const user = global.db.data.users[m.sender];
    const settings = global.db.data.settings[conn.user.jid];
    let type = (args[0] || '').toLowerCase();
    let isAll = false;
    let isUser = false;

    switch (type) {
        case 'welcome':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            chat.welcome = isEnable;
            break;

        case 'detect':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            chat.detect = isEnable;
            break;

        case 'delete':
        case 'antidelete':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            chat.delete = isEnable;
            break;

        case 'viewonce':
        case 'antiviewonce':
            if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
            // This enables the silent .rvo trigger in your handler
            chat.viewonce = isEnable;
            break;

        case 'autolevelup':
            isUser = true;
            user.autolevelup = isEnable;
            break;

        // --- LADY-TRISH OWNER SETTINGS ---
        case 'autobio':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            settings.autobio = isEnable;
            break;

        case 'antideleteowner':
        case 'deleteowner':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            settings.antideleteowner = isEnable;
            break;

        case 'self':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            settings.self = isEnable;
            break;

        case 'public':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            settings.self = !isEnable; 
            break;

        case 'autoread':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            settings.autoread = isEnable;
            break;

        case 'gconly':
            isAll = true;
            if (!isOwner) return global.dfail('owner', m, conn);
            settings.gconly = isEnable;
            break;

        default:
            if (!/[01]/.test(command))
                return m.reply(`
📌 *LADY-TRISH CONFIGURATION*

*User Settings:*
- autolevelup

*Group Settings (Admins):*
- welcome
- detect
- delete (Anti-Delete)
- viewonce (Auto .rvo Trigger)

*Owner Only:*
- autobio (Dynamic Bio)
- deleteowner (Send all deletes to your DM)
- self / public
- autoread
- gconly

*Example:* ${usedPrefix}on viewonce`.trim());
            throw false;
    }

    m.reply(`
✅ *Feature:* ${type.toUpperCase()}
✅ *Status:* ${isEnable ? 'ENABLED' : 'DISABLED'}
📌 *Scope:* ${isAll ? 'Global Bot' : isUser ? 'User Data' : 'This Chat'}
`.trim());
};

handler.help = ['enable', 'disable'];
handler.tags = ['main'];
handler.command = /^((en|dis)able|(true|false)|(turn)?(on|off)|[01])$/i;

export default handler;