import { createCanvas } from 'canvas';
import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
    conn.movieDB = conn.movieDB ? conn.movieDB : {};

    // --- 1. SEARCH STAGE: .movie <title> [--more] ---
    if (command === 'movie' || command === 'moviebox') {
        if (!text) {
            const width = 800, height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#020205'; ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#00d2ff'; ctx.lineWidth = 5; ctx.strokeRect(20, 20, 760, 360);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('MOVIE ENGINE v4', 400, 180);
            ctx.font = '20px monospace'; ctx.fillStyle = '#00d2ff';
            ctx.fillText(`Usage: ${usedPrefix}movie <title>`, 400, 240);
            return await conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*🎬 OmegaTech Movie Search*\n\n*Commands:*\n• ${usedPrefix}movie <title> (Search)\n• ${usedPrefix}movie <title> --more (Next Page)` }, { quoted: m });
        }

        let isMore = text.includes('--more');
        let query = text.replace('--more', '').trim();
        let page = isMore ? 2 : 1; 

        await m.react('🔍');
        try {
            let res = await axios.get(`https://omegatech-api.dixonomega.tech/api/movie/moviebox-search?q=${encodeURIComponent(query)}&page=${page}`);
            let results = res.data.results;
            if (!results || results.length === 0) throw 'No results found.';

            let list = `*📂 MOVIE SEARCH RESULTS (Page ${page})*\n\n`;
            results.slice(0, 15).forEach((v, i) => {
                let type = v.type === 'Movie' ? '🎬' : '📺';
                list += `*${i + 1}.* ${type} ${v.title} (${v.releaseDate.split('-')[0]})\n`;
            });
            list += `\n*To see details:* \`${usedPrefix}moviedl <number>\``;
            if (res.data.hasMore) list += `\n*Next Page:* \`${usedPrefix}movie ${query} --more\``;

            conn.movieDB[m.sender] = { search: results.slice(0, 15), query: query };
            return await conn.sendMessage(m.chat, { image: { url: results[0].cover }, caption: list }, { quoted: m });
        } catch (e) { return m.reply(`❌ Error: ${e.message || e}`); }
    }

    // --- 2. SELECTION STAGE: .moviedl <number> ---
    if (command === 'moviedl' || command === 'moviedls') {
        let index = parseInt(args[0]) - 1;
        if (!conn.movieDB[m.sender] || !conn.movieDB[m.sender].search) return m.reply(`❌ Search first using *${usedPrefix}movie*`);
        let selected = conn.movieDB[m.sender].search[index];
        if (!selected) return m.reply('❌ Selection not found.');

        await m.react('⏳');
        try {
            // For Series, this API usually provides a different response structure or requires specific handling
            let res = await axios.get(`https://omegatech-api.dixonomega.tech/api/movie/moviebox-sources?info=${selected.subjectId}`);
            let data = res.data.result;

            if (!data.hasResource) throw `Resources for this ${selected.type} are currently locked or unavailable.`;

            let cap = `*🎬 MEDIA INFO: ${selected.title.toUpperCase()}*\n\n`;
            cap += `🏷️ *Type:* ${selected.type}\n📅 *Year:* ${selected.releaseDate}\n🎭 *Genre:* ${selected.genre}\n\n`;
            cap += `*CHOOSE QUALITY TO DOWNLOAD:*\n`;

            data.downloads.forEach((dl, i) => {
                cap += `*${i + 1}.* Quality: ${dl.quality}p (${formatBytes(dl.size)})\n`;
            });

            cap += `\n*To Download:* Type \`${usedPrefix}movieq<number>\` (e.g. .movieq1)`;

            conn.movieDB[m.sender].downloads = data.downloads;
            conn.movieDB[m.sender].title = selected.title;

            return await conn.sendMessage(m.chat, { image: { url: selected.cover }, caption: cap }, { quoted: m });
        } catch (e) { return m.reply(`❌ *Sources Error:* ${e.message || e}\n_Try another result from the list._`); }
    }

    // --- 3. DOWNLOAD STAGE: .movieq<number> ---
    if (command.startsWith('movieq')) {
        let qIndex = parseInt(command.replace('movieq', '')) - 1;
        if (!conn.movieDB[m.sender] || !conn.movieDB[m.sender].downloads) return m.reply('❌ Please select a movie first.');
        
        let dl = conn.movieDB[m.sender].downloads[qIndex];
        if (!dl) return m.reply('❌ Invalid selection.');

        await m.react('📥');
        const isLarge = dl.size > 50000000; // 50MB
        await m.reply(`🚀 *OmegaTech Engine:* Preparing file...\n📦 Size: ${formatBytes(dl.size)}\n⚡ Mode: ${isLarge ? 'High-Speed Document' : 'Video'}\n\n_Downloading buffer, please wait..._`);

        const links = [dl.direct, dl.download, dl.stream];
        let success = false;

        for (let link of links) {
            if (success) break;
            try {
                const response = await axios({
                    method: 'get',
                    url: link,
                    responseType: 'arraybuffer',
                    timeout: 300000 
                });
                const buffer = Buffer.from(response.data);

                if (isLarge) {
                    await conn.sendMessage(m.chat, { 
                        document: buffer, mimetype: 'video/mp4', 
                        fileName: `${conn.movieDB[m.sender].title}.mp4`,
                        caption: `🎬 *${conn.movieDB[m.sender].title}* (${dl.quality}p)`
                    }, { quoted: m });
                } else {
                    await conn.sendMessage(m.chat, { 
                        video: buffer, mimetype: 'video/mp4',
                        caption: `🎬 *${conn.movieDB[m.sender].title}*`
                    }, { quoted: m });
                }
                success = true;
                await m.react('✅');
            } catch (err) { continue; }
        }

        if (!success) m.reply(`❌ *Download Failed:* All server mirrors are unresponsive.\n🔗 *Manual Link:* ${dl.direct}`);
    }
};

handler.help = ['movie', 'moviedl', 'movieq'];
handler.tags = ['tools'];
handler.command = /^(movie|moviebox|moviedl|moviedls|movieq\d+)$/i;

export default handler;

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}