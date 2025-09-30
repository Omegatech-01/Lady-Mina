import fs from "fs";
import { execSync } from "child_process";

let handler = async (m, { conn }) => {
  await global.loading(m, conn);
  try {
    const tempDir = "./tmp";
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    let files = fs.readdirSync(tempDir);
    if (files.length > 0) {
      for (let file of files) {
        fs.unlinkSync(`${tempDir}/${file}`);
      }
    }
    await m.reply("*📦 Processing bot script backup, sweetie...*");
    const backupName = "Lady-Mina-Bot";
    const backupPath = `${tempDir}/${backupName}.zip`;
    const ls = (await execSync("ls"))
      .toString()
      .split("\n")
      .filter(
        (pe) =>
          pe !== "node_modules" &&
          pe !== "auth" &&
          pe !== "package-lock.json" &&
          pe !== "yarn.lock" &&
          pe !== "pnpm-lock.yaml" &&
          pe !== ""
      );
    await execSync(`zip -r ${backupPath} ${ls.join(" ")}`);
    await conn.sendMessage(m.sender, {
      document: await fs.readFileSync(backupPath),
      fileName: `${backupName}.zip`,
      mimetype: "application/zip",
    }, { quoted: m });
    fs.unlinkSync(backupPath);
    if (m.chat !== m.sender) {
      m.reply("*Script backup successfully sent to your private chat, sweetie!*\n🌟 *Powered by Lady-Mina | Owner: Omegatech-01 | Support: https://github.com/Omegatech-01*");
    }
  } catch (e) {
    console.error('Error:', e);
    m.reply(`
❌ *Failed to create backup script, sweetie!*
────────────────────
📌 *Error:* ${e.message}
🌟 *Powered by Lady-Mina | Owner: Omegatech-01 | Support: https://github.com/Omegatech-01*
`.trim());
  } finally {
    await global.loading(m, conn, true);
  }
};

handler.help = ["backup"]
handler.tags = ["owner"]
handler.command = /^(backup|bk)$/i
handler.mods = true

export default handler;