import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import * as cheerio from "cheerio";
import { fileTypeFromBuffer } from "file-type";

const TMP_DIR = "./tmp";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

class XMinusVocalCut {
    constructor() {
        this.baseUrl = "https://x-minus.pro";
        this.uploadUrl = "https://mmd.uvronline.app/upload/vocalCutAi?catch-file";
        this.checkUrl = "https://mmd.uvronline.app/upload/vocalCutAi?check-job-status";
        this.downloadBase = "https://mmd.uvronline.app/dl/vocalCutAi";

        this.http = axios.create({
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
            withCredentials: true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        this.authKey = null;
    }

    async getAuthKey() {
        if (this.authKey) return this.authKey;
        const res = await this.http.get(`${this.baseUrl}/ai`);
        const $ = cheerio.load(res.data);
        const key = $("#vocal-cut-auth-key").val();
        if (!key) throw new Error("Auth key not found");
        this.authKey = key;
        return key;
    }

    async uploadAudio(filePath) {
        const authKey = await this.getAuthKey();
        const form = new FormData();

        form.append("auth_key", authKey);
        form.append("locale", "en_US");
        form.append("separation", "inst_vocal");
        form.append("separation_type", "vocals_music");
        form.append("format", "mp3");
        form.append("version", "3-4-0");
        form.append("model", "mdx_v2_vocft");
        form.append("aggressiveness", "2");
        form.append("hostname", "x-minus.pro");

        form.append("myfile", fs.createReadStream(filePath), {
            filename: "audio.mp3",
            contentType: "audio/mpeg",
        });

        const res = await this.http.post(this.uploadUrl, form, {
            headers: {
                ...form.getHeaders(),
                origin: "https://x-minus.pro",
                referer: "https://x-minus.pro/",
            },
        });

        return res.data;
    }

    async checkJob(jobId) {
        const form = new FormData();
        form.append("job_id", jobId);
        form.append("auth_key", this.authKey);
        form.append("locale", "en_US");

        const res = await this.http.post(this.checkUrl, form, {
            headers: {
                ...form.getHeaders(),
                origin: "https://x-minus.pro",
                referer: "https://x-minus.pro/",
            },
        });

        return res.data;
    }

    buildUrls(jobId) {
        return {
            instrumental: `${this.downloadBase}?job-id=${jobId}&stem=inst&fmt=mp3&cdn=0`,
            vocal: `${this.downloadBase}?job-id=${jobId}&stem=vocal&fmt=mp3&cdn=0`,
        };
    }

    async process(filePath) {
        const up = await this.uploadAudio(filePath);
        const jobId = up.job_id;

        let status;
        do {
            await new Promise(r => setTimeout(r, 3000));
            status = await this.checkJob(jobId);
        } while (status.status === "processing");

        if (status.status !== "done") {
            throw new Error("Processing failed");
        }

        return this.buildUrls(jobId);
    }
}

const handler = async (m, { conn }) => {
    const q = m.quoted?.message;
    if (!q?.audioMessage && !q?.documentMessage)
        return m.reply("❌ Reply to an audio file (mp3/m4a/ogg)");

    await m.react("🎧");

    const buffer = await conn.downloadMedia(q);
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !type.mime.startsWith("audio"))
        return m.reply("❌ Invalid audio format");

    const filePath = path.join(TMP_DIR, `xminus_${Date.now()}.${type.ext}`);
    fs.writeFileSync(filePath, buffer);

    const cutter = new XMinusVocalCut();
    let result;

    try {
        result = await cutter.process(filePath);
    } catch (e) {
        fs.unlinkSync(filePath);
        return m.reply("💥 Vocal separation failed");
    }

    fs.unlinkSync(filePath);

    return conn.sendMessage(
        m.chat,
        {
            text:
`🎼 *X-MINUS VOCAL CUT COMPLETE*

🎤 Vocal:
${result.vocal}

🎹 Instrumental:
${result.instrumental}`,
        },
        { quoted: m }
    );
};

handler.help = ["xminus", "vocalcut"];
handler.command = /^(xminus|vocalcut|separate)$/i;
export default handler;