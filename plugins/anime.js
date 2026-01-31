import fetch from 'node-fetch';
import { createCanvas } from 'canvas';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.animeFlow = conn.animeFlow ? conn.animeFlow : {};

    // --- CASE 1: NO TEXT (Show UI Guide) ---
    if (!text && !m.quoted) {
        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, 800, 400);
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 5;
        ctx.strokeRect(20, 20, 760, 360);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ANIME ENGINE', 400, 180);
        ctx.font = '20px monospace';
        ctx.fillStyle = '#00d2ff';
        ctx.fillText(`Usage: ${usedPrefix + command} <name>`, 400, 240);
        
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*✨ Lady-Trish Anime Search*\nExample: ${usedPrefix + command} One Piece` }, { quoted: m });
    }

    // --- CASE 2: HANDLE REPLIES (Flow Logic) ---
    if (m.quoted && conn.animeFlow[m.sender]) {
        let session = conn.animeFlow[m.sender];
        let choice = parseInt(text);
        if (isNaN(choice)) return; // Ignore if not a number

        // Step 2: Getting Details
        if (session.step === 'list') {
            let item = session.data[choice - 1];
            if (!item) return m.reply('❌ Invalid choice. Pick a number from the list.');
            
            await m.react('⏳');
            let res = await (await fetch(`https://omegatech-api.dixonomega.tech/api/Anime/anime-details?slug=${item.url}`)).json();
            if (!res.status) return m.reply('❌ Details not found.');

            let cap = `*🎬 ${res.info.title}*\n\n` +
                      `⭐ Rating: ${res.info.rating}\n` +
                      `📅 Date: ${res.info.date_published}\n` +
                      `🎭 Genres: ${res.genres.join(', ')}\n\n` +
                      `📖 *Synopsis:* ${res.synopsis.slice(0, 250)}...\n\n` +
                      `*EPISODES LIST:*\n`;
            
            res.episodes.slice(0, 15).forEach((ep, i) => {
                cap += `${i + 1}. Episode ${ep.title}\n`;
            });
            cap += `\n_Reply with episode number to get download links._`;

            session.step = 'details';
            session.episodes = res.episodes;
            return conn.sendMessage(m.chat, { image: { url: res.info.cover }, caption: cap }, { quoted: m });
        }

        // Step 3: Getting Download Links
        if (session.step === 'details') {
            let ep = session.episodes[choice - 1];
            if (!ep) return m.reply('❌ Invalid episode number.');
            
            await m.react('📥');
            let res = await (await fetch(`https://omegatech-api.dixonomega.tech/api/Anime/anime-download?slug=${ep.url}&quality=720p`)).json();
            
            let cap = `*🚀 DOWNLOAD READY*\n\n`;
            res.streams.forEach((s, i) => cap += `🔗 *Mirror ${i+1}:* ${s.link}\n\n`);
            
            delete conn.animeFlow[m.sender]; // End Session
            return m.reply(cap);
        }
    }

    // --- CASE 3: NEW SEARCH ---
    await m.react('🔍');
    let res = await (await fetch(`https://omegatech-api.dixonomega.tech/api/Anime/anime-search?query=${encodeURIComponent(text)}`)).json();
    if (!res.success || res.results.result.length === 0) return m.reply('❌ Anime not found.');

    let results = res.results.result.slice(0, 10);
    let list = `*🔍 SEARCH RESULTS:* "${text}"\n\n`;
    results.forEach((v, i) => list += `*${i + 1}.* ${v.judul}\n`);
    list += `\n_Reply with a number to see details._`;

    conn.animeFlow[m.sender] = { step: 'list', data: results };
    return m.reply(list);
};

handler.help = ['anime'];
handler.tags = ['anime'];
handler.command = /^(anime)$/i;
export default handler;