// Vercel build: static файлуудыг public/ руу хуулж, Supabase түлхүүрийг
// орчны хувьсагчаас (SUPABASE_URL, SUPABASE_ANON_KEY) js/supabase.js дотор бичнэ.
const fs = require('fs')
const path = require('path')

const OUT = 'public'
const COPY = ['index.html', 'dashboard.html', 'css', 'js']

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
COPY.forEach(item => fs.cpSync(item, path.join(OUT, item), { recursive: true }))

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

if (url && key) {
    const file = path.join(OUT, 'js', 'supabase.js')
    let src = fs.readFileSync(file, 'utf8')
    src = src
        .replace(/const SUPABASE_URL = '.*'/, `const SUPABASE_URL = ${JSON.stringify(url)}`)
        .replace(/const SUPABASE_KEY = '.*'/, `const SUPABASE_KEY = ${JSON.stringify(key)}`)
    fs.writeFileSync(file, src)
    console.log('Supabase түлхүүрийг орчны хувьсагчаас тавилаа.')
} else {
    console.warn('АНХААРУУЛГА: SUPABASE_URL / SUPABASE_ANON_KEY тохируулаагүй. js/supabase.js доторх утгыг ашиглана.')
}
