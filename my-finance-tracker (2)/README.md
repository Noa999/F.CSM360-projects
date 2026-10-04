# my-finance-tracker — Хувийн санхүү бүртгэл

Орлого, зарлагаа бүртгэж, ангилал бүрт сар бүрийн төсөв тогтоодог вэб систем.

Ашигласан технологи: HTML, CSS, JavaScript (фронт), Supabase (PostgreSQL + Supabase Auth), Bootstrap 5

## Бүтэц

```
index.html        нэвтрэх, бүртгүүлэх хуудас
dashboard.html    үндсэн самбар
css/style.css
js/supabase.js    Supabase холболт
js/auth.js        нэвтрэх, бүртгүүлэх
js/dashboard.js   гүйлгээ, төсвийн логик
database.sql      хүснэгтүүд (transactions, budgets, badges)
build.js          Vercel build (public/ хавтас үүсгэнэ)
vercel.json       Vercel тохиргоо
```

## Ажиллуулах

1. supabase.com дээр шинэ project үүсгэнэ.
2. SQL Editor дотор `database.sql` файлын кодыг ажиллуулна.
3. Project Settings > API хэсгээс URL болон anon key-г аваад `js/supabase.js` дотор тавина.
4. Туршиж үзэхдээ Authentication > Providers > Email хэсэгт "Confirm email"-ийг унтраавал имэйл баталгаажуулалгүйгээр нэвтэрч болно.
5. VS Code-ийн Live Server-ээр `index.html`-ийг нээнэ. Module ашигладаг тул файлыг шууд давхар дарж нээж болохгүй.

## Боломжууд

- Бүртгүүлэх, нэвтрэх, гарах
- Орлого, зарлага нэмэх, устгах
- Үлдэгдэл, нийт орлого, нийт зарлагын карт
- Сар бүрийн ангилал тус бүрийн төсөв тогтоох, устгах
- Төсөв хэтрэх үед анхааруулга харуулах (гүйлгээ нэмэхэд болон самбар дээр), ахицын зураас
- Тогтмол хэмнэлт хийсэн хэрэглэгчид урамшууллын тэмдэг (badges) олгох

## Урамшууллын тэмдэг

| Тэмдэг | Нөхцөл |
|---|---|
| Анхны хэмнэлт | Аль нэг сард орлого нь зарлагаасаа давсан |
| Төсвөө сахигч | Төсөв тогтоосон өнгөрсөн сард ямар ч ангилал хязгаараас хэтрээгүй |
| Тогтмол хэмнэгч | 3 сар дараалан хэмнэсэн |
| Хэмнэлтийн мастер | 6 сар дараалан хэмнэсэн |

## Vercel дээр байршуулах

1. Төслөө GitHub руу push хийнэ.
2. vercel.com → Add New → Project → тухайн repo-г сонгоно (Framework Preset: Other, бусад тохиргоог хөндөхгүй).
3. Environment Variables хэсэгт нэмнэ:
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_ANON_KEY` = anon public key
4. Deploy дарна.
5. Supabase → Authentication → URL Configuration хэсэгт Vercel-ийн домэйныг (жишээ: `https://my-finance-tracker.vercel.app`) Site URL болон Redirect URLs-д нэмнэ.

Орчны хувьсагч тохируулахгүй бол `js/supabase.js` доторх утгыг шууд ашиглана.
