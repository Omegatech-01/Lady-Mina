import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';

if (!global.spin) global.spin = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let id = m.chat;
    conn.spin = conn.spin ? conn.spin : {};

    if (text === 'start') {
        if (conn.spin[id]) return m.reply('⚠️ Lobby already open!');
        conn.spin[id] = { status: 'lobby', players: [] };
        return m.reply(`✨ *LADY-TRISH: PRO SPIN*\n\nType \`${usedPrefix + command} join\` to enter.\nType \`${usedPrefix + command} play\` to spin the vector bottle!`);
    }

    if (text === 'join') {
        if (!conn.spin[id]) return m.reply(`❌ Start with \`${usedPrefix + command} start\``);
        if (conn.spin[id].players.includes(m.sender)) return m.reply('✅ In the circle.');
        conn.spin[id].players.push(m.sender);
        return m.reply(`🌸 @${m.sender.split('@')[0]} joined!`, null, { mentions: [m.sender] });
    }

    if (text === 'play') {
        let game = conn.spin[id];
        if (!game || game.players.length < 2) return m.reply('❌ Need 2+ players!');

        let head = game.players[Math.floor(Math.random() * game.players.length)];
        let tail = game.players.filter(p => p !== head)[Math.floor(Math.random() * (game.players.length - 1))];

        // Fetch Aesthetic BG from Omegatech API
        const themes = ['Anime+Sky+Aesthetic', 'Pink+Cyberpunk+City', 'Studio+Ghibli+Landscape'];
        let bgUrl = 'https://i.imgur.com/39k7Mv6.jpeg'; 
        try {
            let { data } = await axios.get(`https://omegatech-api.dixonomega.tech/api/tools/wallpaper?name=${themes[Math.floor(Math.random()*themes.length)]}`);
            bgUrl = data.results[Math.floor(Math.random() * data.results.length)].image;
        } catch (e) {}

        const canvas = createCanvas(800, 800);
        const ctx = canvas.getContext('2d');

        // 1. Background Render
        const bgImg = await loadImage(bgUrl);
        ctx.drawImage(bgImg, 0, 0, 800, 800);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Darken for contrast
        ctx.fillRect(0, 0, 800, 800);

        // 2. DRAW VECTOR BOTTLE (Procedural Canvas Paths)
        let tailIndex = game.players.indexOf(tail);
        let angleToTail = (tailIndex / game.players.length) * Math.PI * 2;

        ctx.save();
        ctx.translate(400, 400);
        ctx.rotate(angleToTail + Math.PI / 2);

        // Bottle Glow Effect
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f2ff';

        // Bottle Body Path
        ctx.beginPath();
        ctx.moveTo(-30, 80); // Bottom left
        ctx.lineTo(30, 80);  // Bottom right
        ctx.quadraticCurveTo(45, 80, 45, 60); // Round bottom
        ctx.lineTo(40, -20); // Shoulder
        ctx.quadraticCurveTo(35, -50, 15, -60); // Neck curve
        ctx.lineTo(15, -110); // Neck top
        ctx.lineTo(-15, -110);
        ctx.lineTo(-15, -60);
        ctx.quadraticCurveTo(-35, -50, -40, -20);
        ctx.lineTo(-45, 60);
        ctx.quadraticCurveTo(-45, 80, -30, 80);
        
        // Fill and Stroke Bottle
        let bottleGrad = ctx.createLinearGradient(-40, 0, 40, 0);
        bottleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        bottleGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        bottleGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        ctx.fillStyle = bottleGrad;
        ctx.fill();
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Bottle Shine (Highlights)
        ctx.beginPath();
        ctx.moveTo(-20, 40);
        ctx.lineTo(-20, -10);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();

        // 3. DRAW PLAYERS
        for (let i = 0; i < game.players.length; i++) {
            let angle = (i / game.players.length) * Math.PI * 2;
            let x = 400 + Math.cos(angle) * 310;
            let y = 400 + Math.sin(angle) * 310;

            let pfp;
            try { pfp = await loadImage(await conn.profilePictureUrl(game.players[i], 'image')); }
            catch { pfp = await loadImage('https://i.imgur.com/vHqB5eX.jpeg'); }

            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = (game.players[i] === head) ? '#00f2ff' : (game.players[i] === tail) ? '#ff0055' : 'white';
            ctx.strokeStyle = ctx.shadowColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(x, y, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.clip();
            ctx.drawImage(pfp, x - 50, y - 50, 100, 100);
            ctx.restore();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            if (game.players[i] === head) ctx.fillText('HEAD', x, y + 80);
            if (game.players[i] === tail) ctx.fillText('TAIL', x, y + 80);
        }

        // 4. WATERMARK
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LADY-TRISH BY OMEGATECH', 400, 775);

        const buffer = canvas.toBuffer();
        let cap = `🍾 *BOTTLE SPUN!* 🍾\n\n` +
                  `🗣️ *Asker:* @${head.split('@')[0]}\n` +
                  `🎯 *Victim:* @${tail.split('@')[0]}\n\n` +
                  `*@${head.split('@')[0]}*, Truth or Dare?`;

        await conn.sendMessage(id, { image: buffer, caption: cap, mentions: [head, tail] });
        delete conn.spin[id]; 
    }
};

handler.help = ['spin'];
handler.tags = ['game'];
handler.command = /^(spin|spinthebottle)$/i;
handler.group = true;

export default handler;