import { createCanvas } from 'canvas';

// --- GAME STATE ---
if (!global.emojihunt) global.emojihunt = {};

const LEVELS = [
    { grid: 6, time: 30000, reward: 10000, label: 'NORMAL' },
    { grid: 9, time: 25000, reward: 25000, label: 'EXPERT' },
    { grid: 12, time: 20000, reward: 50000, label: 'INSANE' }
];

const EMOJI_PAIRS = [
    { target: '🇳🇴', decoy: '🇮🇸' }, { target: '🇦🇺', decoy: '🇳🇿' },
    { target: '🇷🇴', decoy: '🇹🇩' }, { target: '🇮🇩', decoy: '🇲🇨' },
    { target: '🇸🇮', decoy: '🇸🇰' }, { target: '🇻🇳', decoy: '🇸🇴' },
    { target: '🇲🇱', decoy: '🇬🇳' }, { target: '🇱🇺', decoy: '🇳🇱' },
    { target: '😥', decoy: '😰' }, { target: '😗', decoy: '😙' },
    { target: '📔', decoy: '📕' }, { target: '🔒', decoy: '🔓' },
    { target: '🔳', decoy: '🔲' }, { target: '🛠️', decoy: '⚒️' },
    { target: '🪢', decoy: '🧶' }, { target: '🛜', decoy: '📶' },
    { target: '🇯🇵', decoy: '🇰🇷' }, { target: '🦾', decoy: '🦿' },
    { target: '🍐', decoy: '🥑' }, { target: '🧌', decoy: '👹' }
    // ... add more from previous list as needed
];

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let id = m.chat;
    conn.emojihunt = conn.emojihunt ? conn.emojihunt : {};

    // 1. START LOBBY
    if (text === 'start') {
        if (conn.emojihunt[id]) return m.reply('⚠️ A game is already initialized!');
        conn.emojihunt[id] = {
            status: 'lobby',
            players: [],
            target: '',
            reward: 0
        };
        
        let cap = `🧩 *EMOJI HUNT: LOBBY*\n\n` +
                  `Who has the sharpest eyes? Join the hunt!\n\n` +
                  `📌 *To Join:* \`${usedPrefix + command} join\`\n` +
                  `📌 *To Begin:* \`${usedPrefix + command} play\` (Host only)`;
        return m.reply(cap);
    }

    // 2. JOIN GAME
    if (text === 'join') {
        if (!conn.emojihunt[id]) return m.reply(`❌ No active lobby. Type \`${usedPrefix + command} start\``);
        if (conn.emojihunt[id].status !== 'lobby') return m.reply('❌ The hunt has already started!');
        if (conn.emojihunt[id].players.includes(m.sender)) return m.reply('✅ You are already in.');

        conn.emojihunt[id].players.push(m.sender);
        return m.reply(`✅ *Joined:* @${m.sender.split('@')[0]} (Total: ${conn.emojihunt[id].players.length})`, null, { mentions: [m.sender] });
    }

    // 3. PLAY (START THE GRID)
    if (text === 'play') {
        if (!conn.emojihunt[id]) return;
        if (conn.emojihunt[id].players.length < 1) return m.reply('❌ At least 1 player is needed.');
        if (conn.emojihunt[id].status === 'playing') return m.reply('🔴 Game is already running.');

        const challenge = EMOJI_PAIRS[Math.floor(Math.random() * EMOJI_PAIRS.length)];
        const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
        const gridSize = level.grid;
        const targetIndex = Math.floor(Math.random() * (gridSize * gridSize));

        // Update State
        conn.emojihunt[id].status = 'playing';
        conn.emojihunt[id].target = challenge.target;
        conn.emojihunt[id].reward = level.reward;
        conn.emojihunt[id].startTime = Date.now();

        // Canvas Gen
        const canvas = createCanvas(700, 700);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(0, 0, 700, 700);

        const cellSize = 600 / gridSize;
        ctx.font = `${cellSize * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < gridSize * gridSize; i++) {
            const x = 50 + (i % gridSize) * cellSize + cellSize / 2;
            const y = 50 + Math.floor(i / gridSize) * cellSize + cellSize / 2;
            ctx.fillText(i === targetIndex ? challenge.target : challenge.decoy, x, y);
        }

        let cap = `🎯 *THE HUNT IS ON!*\n\n` +
                  `Find: ${challenge.target}\n` +
                  `Level: *${level.label}*\n` +
                  `Reward: *${level.reward.toLocaleString()} XP*\n\n` +
                  `*Only registered players can win!*`;

        await conn.sendMessage(id, { image: canvas.toBuffer(), caption: cap });

        // Auto-fail timeout
        conn.emojihunt[id].timeout = setTimeout(() => {
            if (conn.emojihunt[id]) {
                conn.sendMessage(id, { text: `⌛ *TIME UP!*\nThe target ${challenge.target} was not found.` });
                delete conn.emojihunt[id];
            }
        }, level.time);
        return;
    }

    m.reply(`🕹️ *EMOJI HUNT COMMANDS*\n\n• ${usedPrefix + command} start\n• ${usedPrefix + command} join\n• ${usedPrefix + command} play`);
};

// --- WINNER LISTENER ---
handler.before = async (m, { conn }) => {
    let id = m.chat;
    if (!conn.emojihunt || !conn.emojihunt[id] || conn.emojihunt[id].status !== 'playing') return;

    let game = conn.emojihunt[id];
    if (m.text.trim() === game.target) {
        if (!game.players.includes(m.sender)) return; // Only registered players can answer

        let timeTaken = ((Date.now() - game.startTime) / 1000).toFixed(2);
        clearTimeout(game.timeout);
        
        global.db.data.users[m.sender].exp += game.reward;

        await m.reply(`🏆 *WINNER!*\n\n@${m.sender.split('@')[0]} found it in *${timeTaken}s* and won *${game.reward.toLocaleString()} XP*!`, null, { mentions: [m.sender] });
        
        delete conn.emojihunt[id];
    }
};

handler.help = ['emojihunt'];
handler.tags = ['game'];
handler.command = /^(emojihunt|eh)$/i;

export default handler;