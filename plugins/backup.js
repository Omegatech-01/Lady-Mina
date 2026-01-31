import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

let handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return m.reply('❌ You? Owner? Funny joke.')

  const botDir = process.cwd() // root of your bot
  const backupName = `Lady-trish ${Date.now()}.zip`
  const backupPath = path.join(botDir, backupName)

  m.reply('📦 Creating backup… try not to breathe.')

  try {
    const output = fs.createWriteStream(backupPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.pipe(output)

    // Ignore node_modules & session junk
    archive.glob('**/*', {
      cwd: botDir,
      ignore: [
        'node_modules/**',
        'sessions/**',
        'tmp/**',
        '*.zip'
      ]
    })

    await archive.finalize()

    output.on('close', async () => {
      await conn.sendMessage(
        m.sender,
        {
          document: fs.readFileSync(backupPath),
          mimetype: 'application/zip',
          fileName: backupName,
          caption: '🗂️ Bot Backup\n👑 OMEGATECH'
        }
      )

      fs.unlinkSync(backupPath)
    })

  } catch (err) {
    console.error(err)
    m.reply('❌ Backup failed. Server probably hates you.')
  }
}

handler.command = /^backup$/i
handler.owner = true
handler.private = true
handler.tags = ['owner']
handler.help = ['backup']

export default handler