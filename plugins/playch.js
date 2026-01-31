const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

global.idchannel = '120363371230937489@newsletter';
global.botname = 'Yaemiko Bot - Whatsapp';
global.ownername = 'Rizki Engine';

let handler = async (m, { conn, text, args, command, usedPrefix, isOwner }) => {
    try {
        if (!isOwner) return m.reply('Fitur ini hanya untuk owner bot!');
        if (!text) return m.reply(`Contoh : ${usedPrefix}${command} judul lagu`);

        if (!global.idchannel) {
            return m.reply('ID channel belum diatur!');
        }

        const newsletterInfo = {
            newsletterJid: global.idchannel,
            serverMessageId: 100,
            newsletterName: global.botname
        };

        const api = `https://api.elrayyxml.web.id/api/downloader/ytplay?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(api);
        
        if (!data || !data.result) return m.reply("Lagu tidak ditemukan.");
        
        const info = data.result;
        const title = info.title;
        const thumbnail = info.thumbnail;
        const downloadUrl = info.download_url;
        const youtubeUrl = info.url;

        const audioReq = await axios.get(downloadUrl, {
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const tempInput = path.join(os.tmpdir(), `${Date.now()}_input.mp3`);
        const tempOutput = path.join(os.tmpdir(), `${Date.now()}_output.opus`);

        fs.writeFileSync(tempInput, Buffer.from(audioReq.data));

        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${tempInput}" -c:a libopus -b:a 128k -vbr on -compression_level 10 "${tempOutput}"`, (error) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        let thumbnailBuffer = null;
        try {
            if (thumbnail) {
                const thumbReq = await axios.get(thumbnail, { 
                    responseType: "arraybuffer",
                    timeout: 10000
                });
                thumbnailBuffer = Buffer.from(thumbReq.data);
            }
        } catch (thumbError) {
            console.error('Error loading thumbnail:', thumbError);
        }

        const audioData = fs.readFileSync(tempOutput);

        const messageData = {
            audio: audioData,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
        };

        if (thumbnailBuffer) {
            messageData.contextInfo = {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: newsletterInfo,
                externalAdReply: {
                    title: title.substring(0, 60),
                    body: global.botname.substring(0, 40),
                    thumbnail: thumbnailBuffer,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: youtubeUrl,
                    showAdAttribution: false,
                    mediaUrl: youtubeUrl
                }
            };
        }

        await conn.sendMessage(global.idchannel, messageData);
        
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        
        await m.reply(`Berhasil mengirim lagu ${title} ke channel.`);

    } catch (error) {
        console.error('Main error:', error);
        m.reply("Terjadi kesalahan saat memproses permintaan: " + error.message);
    }
};

handler.command = ['playch', 'playchannel'];
handler.tags = ['info'];
handler.owner = true;
module.exports = handler;