import { createCanvas, loadImage } from 'canvas';

// --- GAME STATE ---
if (!global.squid) global.squid = {};

// --- RELIABLE ASSETS (IMGUR) ---
const assets = {
    lobby: 'https://i.imgur.com/8N6y86I.jpeg',
    greenLight: 'https://i.imgur.com/7YjM3Lh.jpeg',
    redLight: 'https://i.imgur.com/8X1F8x6.jpeg',
    terminated: 'https://i.imgur.com/97yX9lF.jpeg'
};

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isOwner }) => {
    let id = m.chat;
    conn.squid = conn.squid ? conn.squid : {};

    // 1. STOP GAME
    if (text === 'stop' || text === 'end') {
        if (!conn.squid[id]) return m.reply('❌ No active game session found.');
        if (!isAdmin && !isOwner) return m.reply('❌ Only an Admin can terminate the game.');

        delete conn.squid[id];
        return await sendImage(conn, m.chat, assets.terminated, `*⏹️ SESSION TERMINATED*\n\nThe game has been ended. You are safe... for now.`);
    }

    // 2. START LOBBY
    if (text === 'start') {
        if (conn.squid[id]) return m.reply('🔴 A game is already in progress!');
        conn.squid[id] = {
            status: 'lobby',
            players: [], 
            light: 'none'
        };
        
        let cap = `*⚪️ SQUID GAME: REGISTRATION ⚪️*\n\n` +
                  `Attention players, you are invited to play *Red Light, Green Light*.\n\n` +
                  `📌 *To Join:* Type \`${usedPrefix + command} join\`\n` +
                  `📌 *To Start:* Type \`${usedPrefix + command} play\`\n` +
                  `📌 *To Stop:* Type \`${usedPrefix + command} stop\``;
        
        return await sendImage(conn, m.chat, assets.lobby, cap);
    }

    // 3. JOIN GAME
    if (text === 'join') {
        if (!conn.squid[id]) return m.reply(`❌ No game lobby. Type \`${usedPrefix + command} start\`.`);
        if (conn.squid[id].status !== 'lobby') return m.reply('❌ Registration closed.');
        if (conn.squid[id].players.find(p => p.jid === m.sender)) return m.reply('✅ You are already registered.');

        conn.squid[id].players.push({ jid: m.sender, name: m.pushName, moved: false });
        return m.reply(`✅ *Player Joined:* @${m.sender.split('@')[0]} (Total: ${conn.squid[id].players.length})`, null, { mentions: [m.sender] });
    }

    // 4. BEGIN PLAY
    if (text === 'play') {
        if (!conn.squid[id]) return;
        if (conn.squid[id].players.length < 2) return m.reply('❌ Need at least 2 players.');
        if (conn.squid[id].status === 'playing') return m.reply('🔴 Game already running.');

        conn.squid[id].status = 'playing';
        await m.reply('⚪️ *The Doll is positioning... Game starts in 5s!*');
        
        setTimeout(() => {
            if (conn.squid[id]) startRound(conn, id);
        }, 5000);
        return;
    }

    m.reply(`*🕹️ SQUID GAME COMMANDS*\n\n• ${usedPrefix + command} start\n• ${usedPrefix + command} join\n• ${usedPrefix + command} play\n• ${usedPrefix + command} stop`);
};

// --- CORE ENGINE ---
async function startRound(conn, id) {
    let game = conn.squid[id];
    if (!game || game.players.length <= 1) return endGame(conn, id);

    // --- PHASE: GREEN LIGHT ---
    game.light = 'green';
    game.players.forEach(p => p.moved = false);
    
    await sendImage(conn, id, assets.greenLight, `*🟢 GREEN LIGHT! 🟢*\n\n*MOVE NOW!* Send any message to move forward.\n⏱️ 7 Seconds Remaining!`);

    await new Promise(r => setTimeout(r, 7000));
    if (!conn.squid[id]) return;

    // ELIMINATE LAZY PLAYERS
    let lazyOnes = game.players.filter(p => !p.moved);
    for (let p of lazyOnes) {
        await eliminate(conn, id, p, "Failed to move during Green Light.");
        game.players = game.players.filter(pl => pl.jid !== p.jid);
    }

    if (game.players.length <= 1) return endGame(conn, id);

    // --- PHASE: RED LIGHT ---
    game.light = 'red';
    await sendImage(conn, id, assets.redLight, `*🔴 RED LIGHT! 🔴*\n\n*STOP MOVING!* Anyone who types a message will be SHOT.`);

    await new Promise(r => setTimeout(r, 5000));
    if (!conn.squid[id]) return;

    if (game.players.length <= 1) return endGame(conn, id);

    await showSurvivors(conn, id, game.players);

    setTimeout(() => {
        if (conn.squid[id]) startRound(conn, id);
    }, 3000);
}

// --- HELPERS & CANVAS ---
async function sendImage(conn, jid, url, caption) {
    try {
        await conn.sendMessage(jid, { image: { url }, caption });
    } catch {
        await conn.sendMessage(jid, { text: caption }); // Fallback to text if link dies
    }
}

async function eliminate(conn, id, player, reason) {
    try {
        const canvas = createCanvas(600, 400);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 600, 400);

        let pfp;
        try { pfp = await loadImage(await conn.profilePictureUrl(player.jid, 'image')); }
        catch { pfp = await loadImage('https://i.imgur.com/vHqB5eX.jpeg'); }

        ctx.save();
        ctx.beginPath(); ctx.arc(300, 150, 80, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(pfp, 220, 70, 160, 160);
        ctx.restore();

        ctx.fillStyle = 'rgba(255, 0, 85, 0.4)'; ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ELIMINATED', 300, 310);

        await conn.sendMessage(id, { image: canvas.toBuffer(), caption: `💀 *PLAYER ELIMINATED:* @${player.jid.split('@')[0]}\n*Reason:* ${reason}`, mentions: [player.jid] });
    } catch (e) {
        await conn.sendMessage(id, { text: `💀 *PLAYER ELIMINATED:* @${player.jid.split('@')[0]}\n*Reason:* ${reason}`, mentions: [player.jid] });
    }
}

async function showSurvivors(conn, id, players) {
    try {
        const canvas = createCanvas(800, 300);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 800, 300);
        ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 10; ctx.strokeRect(0,0,800,300);
        ctx.fillStyle = '#ff0055'; ctx.font = 'bold 35px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('SURVIVING PLAYERS', 400, 60);

        let x = 50;
        for (let p of players.slice(0, 7)) {
            let pfp;
            try { pfp = await loadImage(await conn.profilePictureUrl(p.jid, 'image')); }
            catch { pfp = await loadImage('https://i.imgur.com/vHqB5eX.jpeg'); }
            ctx.save();
            ctx.beginPath(); ctx.arc(x + 50, 160, 45, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(pfp, x, 110, 100, 100);
            ctx.restore();
            x += 110;
        }
        await conn.sendMessage(id, { image: canvas.toBuffer(), caption: `*🔼 ${players.length} Players proceed to the next stage.*` });
    } catch {
        await conn.sendMessage(id, { text: `*🔼 ${players.length} Players proceed to the next stage.*` });
    }
}

async function endGame(conn, id) {
    let game = conn.squid[id];
    if (!game) return;
    if (game.players.length === 1) {
        let winner = game.players[0];
        global.db.data.users[winner.jid].exp += 5000000;
        await conn.sendMessage(id, { text: `*🏆 WE HAVE A SURVIVOR! 🏆*\n\nCongratulations @${winner.jid.split('@')[0]}!\nYou won *5,000,000 XP*!`, mentions: [winner.jid] });
    } else {
        await conn.sendMessage(id, { text: '🔴 *GAME OVER:* Everyone was eliminated. The Doll wins.' });
    }
    delete conn.squid[id];
}

// --- LISTENER ---
handler.before = async (m, { conn }) => {
    let id = m.chat;
    if (!conn.squid || !conn.squid[id] || conn.squid[id].status !== 'playing') return;

    let game = conn.squid[id];
    let player = game.players.find(p => p.jid === m.sender);
    if (!player) return;

    if (game.light === 'green') {
        player.moved = true; 
    }

    if (game.light === 'red') {
        await eliminate(conn, id, player, "Detected movement on Red Light.");
        game.players = game.players.filter(pl => pl.jid !== m.sender);
        if (game.players.length === 0) endGame(conn, id);
    }
};

handler.help = ['squid'];
handler.tags = ['game'];
handler.command = /^(squid|squidgame)$/i;
handler.group = true;

export default handler;