import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import FormData from 'form-data';

// --- Cloudinary config ---
cloudinary.config({
  cloud_name: 'di2a9lenz',
  api_key: '965672481878376',
  api_secret: 'mlCbR4WRWPzrj2Mg2lvHNVbtCPQ',
  secure: true
});

// --- Upload helpers ---
const uploadToCloudinary = async (buffer, mimeType) => {
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    const filename = 'upload-' + Date.now();
    const res = await cloudinary.uploader.upload(dataUri, {
        folder: 'omegatech_ai_media',
        public_id: filename,
        resource_type: 'auto'
    });
    return res.secure_url;
};

const uploadToCatbox = async (buffer, filename, mimeType) => {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', ''); // anonymous
    form.append('fileToUpload', buffer, { filename, contentType: mimeType });

    const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity
    });
    return data;
};

const uploadTo0x0 = async (buffer, ext) => {
    const form = new FormData();
    form.append('file', buffer, { filename: `upload.${ext}` });

    const { data } = await axios.post('https://0x0.st', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity
    });
    return data.trim();
};

const uploadToUguu = async (buffer, ext) => {
    const form = new FormData();
    form.append('file', buffer, { filename: `upload.${ext}` });

    const { data } = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity
    });
    return data?.files?.[0]?.url || null;
};

// --- Plugin handler ---
const handler = async (m, { conn }) => {
    const quoted = m.quoted || m;
    const mime = quoted.mimetype || '';

    if (!mime || !mime.startsWith('image/')) {
        return conn.sendMessage(m.chat, { text: '❌ Reply to an image or media to upload' }, { quoted: m });
    }

    await m.react('🔄');
    const key = await conn.sendMessage(m.chat, { text: '📤 Uploading to multiple hosts...' }, { quoted: m });

    try {
        const buffer = await quoted.download?.();
        if (!buffer) throw new Error('Failed to download media');

        const ext = mime.split('/')[1] || 'png';
        const filename = 'upload-' + Date.now();
        const urls = [];

        // Cloudinary
        try {
            const cloudUrl = await uploadToCloudinary(buffer, mime);
            urls.push(`☁️ Cloudinary: ${cloudUrl}`);
        } catch (e) { urls.push(`☁️ Cloudinary failed: ${e.message}`); }

        // Catbox
        try {
            const catboxUrl = await uploadToCatbox(buffer, `${filename}.${ext}`, mime);
            urls.push(`📦 Catbox: ${catboxUrl}`);
        } catch (e) { urls.push(`📦 Catbox failed: ${e.message}`); }

        // 0x0.st
        try {
            const zeroUrl = await uploadTo0x0(buffer, ext);
            urls.push(`🟢 0x0.st: ${zeroUrl}`);
        } catch (e) { urls.push(`🟢 0x0.st failed: ${e.message}`); }

        // Uguu
        try {
            const uguuUrl = await uploadToUguu(buffer, ext);
            urls.push(`🟣 Uguu: ${uguuUrl || 'Failed'}`);
        } catch (e) { urls.push(`🟣 Uguu failed: ${e.message}`); }

        await conn.sendMessage(
            m.chat,
            { text: `✅ Upload complete!\n\n${urls.join('\n')}` },
            { quoted: m, edit: key }
        );

    } catch (e) {
        console.error(e);
        await conn.sendMessage(
            m.chat,
            { text: `💥 Upload failed: ${e.message}` },
            { quoted: m, edit: key }
        );
    }
};

handler.help = ['tourl'];
handler.command = /^(tourl)$/i;
export default handler;