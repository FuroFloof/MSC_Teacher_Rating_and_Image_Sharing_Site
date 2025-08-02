// index.js ─ Express 4 + SQLite + simple header‑auth admin API
// (with explicit routes that serve your HTML front‑end pages)

import path              from 'path';
import express           from 'express';
import sqlite3           from 'sqlite3';
import cookieParser      from 'cookie-parser';
import multer            from 'multer';
import dotenv            from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DB_PATH  = path.join(__dirname, 'public', 'db', 'fes-db.db');
const PORT     = 62010;
const ADMIN_PW = '';

const db  = new sqlite3.Database(DB_PATH);
const app = express();

/* ───────────── middleware ───────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* serve all static assets (css, js, images, etc.) */
app.use(express.static(path.join(__dirname, 'public')));

/* ───────────── Frontend page endpoints ───────────── */
/* every endpoint below just returns the matching HTML so
   you can visit /, /comment, /review, /board, /admin, etc. */

const page = p => path.join(__dirname, 'public', 'server', p);

app.get('/',           (_req, res) => res.sendFile(page('home.html')));
app.get('/comment',    (_req, res) => res.sendFile(page('comment.html')));
app.get('/review',     (_req, res) => res.sendFile(page('review.html')));
app.get('/board',      (_req, res) => res.sendFile(page('board.html')));
app.get('/admin',      (_req, res) => res.sendFile(page('admin.html')));
app.get('/impressum',  (_req, res) => res.sendFile(page('impressum.html')));
app.get('/faq',        (_req, res) => res.sendFile(page('faq.html')));

/* ───────────── uploads ───────────── */
const upload = multer({ dest: path.join(__dirname, 'public', 'cdn', 'a') });

/* small helpers */
const run = (q, p = []) => new Promise((res, rej) =>
  db.run(q, p, function (e) { e ? rej(e) : res(this); })
);
const all = (q, p = []) => new Promise((res, rej) =>
  db.all(q, p, (e, r) => e ? rej(e) : res(r))
);

const meta = req => JSON.stringify({
  ip   : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0],
  ua   : req.headers['user-agent']      || '',
  lang : req.headers['accept-language'] || '',
  tz   : req.headers['x-timezone']      || '',
  ts   : Date.now()
});

/* ───────────── VISITOR COUNTER ───────────── */
app.get('/visitor_count', async (_req, res) => {
  const row   = (await all('SELECT count FROM VISITOR_COUNT LIMIT 1'))[0] || { count: 0 };
  const newCt = row.count + 1;
  await run('UPDATE VISITOR_COUNT SET count=?', [newCt]);
  res.json({ count: newCt });
});

/* ───────────── IMAGES ───────────── */
app.post('/upload_image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file');
  await run(
    `INSERT INTO CDN_IMG_SRC_A (img_path,img_name,date,meta)
     VALUES (?,?,?,?)`,
    [
      path.relative(path.join(__dirname, 'public'), req.file.path),
      req.body.img_name.trim(),
      Date.now(),
      meta(req)
    ]
  );
  res.sendStatus(201);
});

app.get('/images/search', async (req, res) => {
  const q = (req.query.query || '').toLowerCase();
  const rows = await all(
    `SELECT img_id,img_name FROM CDN_IMG_SRC_A
     WHERE LOWER(img_name) LIKE ? ORDER BY date DESC`, [`%${q}%`]
  );
  res.json({ images: rows });
});

app.get('/images/random', async (_req, res) => {
  const rows = await all('SELECT img_id FROM CDN_IMG_SRC_A ORDER BY RANDOM() LIMIT 30');
  res.json({ img_ids: rows.map(r => r.img_id) });
});

app.get('/image/:id', async (req, res) => {
  const row = (await all('SELECT img_path FROM CDN_IMG_SRC_A WHERE img_id=?', [req.params.id]))[0];
  if (!row) return res.sendStatus(404);
  res.sendFile(path.join(__dirname, 'public', row.img_path));
});

/* ───────────── COMMENTS ───────────── */
app.post('/comments', async (req, res) => {
  const { comment_content, comment_author = 'anon' } = req.body;
  if (!comment_content) return res.status(400).json({ error: 'empty' });
  const r = await run(
    `INSERT INTO COMMENTS_GENERAL (comment_content,comment_author,date,meta)
     VALUES (?,?,?,?)`,
    [comment_content, comment_author, Date.now(), meta(req)]
  );
  res.json({ comment_id: r.lastID });
});

app.get('/comments/search', async (req, res) => {
  const q = (req.query.query || '').toLowerCase();
  const order = req.query.sort === 'date_asc' ? 'date ASC' : 'date DESC';
  const rows = await all(
    `SELECT * FROM COMMENTS_GENERAL
     WHERE LOWER(comment_author) LIKE ? ORDER BY ${order}`, [`%${q}%`]
  );
  res.json({ comments: rows });
});

app.get('/comments/random', async (_req, res) => {
  res.json({ comments: await all('SELECT * FROM COMMENTS_GENERAL ORDER BY RANDOM() LIMIT 15') });
});

/* ───────────── TEACHERS + REVIEWS ───────────── */
app.get('/teachers/search', async (req, res) => {
  const q = (req.query.query || '').toLowerCase();
  const rows = await all(
    `SELECT teacher_id,teacher_name FROM TEACHER
     WHERE LOWER(teacher_name) LIKE ? ORDER BY teacher_name`, [`%${q}%`]
  );
  res.json({ teachers: rows });
});

app.get('/teachers/top_bottom', async (_req, res) => {
  const rows = await all(
    `SELECT t.teacher_name,
            AVG(r.review_score) AS average_score,
            COUNT(r.review_id)  AS total_reviews
     FROM TEACHER t
     JOIN TEACHER_REVIEW r ON r.teacher=t.teacher_name
     GROUP BY t.teacher_name
     HAVING total_reviews>0
     ORDER BY average_score DESC`
  );
  res.json({ top: rows.slice(0, 3), bottom: rows.slice(-3) });
});

app.post('/teacher_review', async (req, res) => {
  const { teacher_id, review_content = '', review_author = 'anon', review_score = 0 } = req.body;
  const teacher = (await all('SELECT teacher_name FROM TEACHER WHERE teacher_id=?', [teacher_id]))[0];
  if (!teacher) return res.status(400).json({ error: 'teacher' });
  await run(
    `INSERT INTO TEACHER_REVIEW (review_content,review_author,review_score,teacher,date,meta)
     VALUES (?,?,?,?,?,?)`,
    [review_content, review_author, review_score, teacher.teacher_name, Date.now(), meta(req)]
  );
  res.sendStatus(201);
});

app.get('/teacher_reviews', async (req, res) => {
  const q = (req.query.query || '').toLowerCase();
  const sort = {
    date_desc: 'date DESC',
    date_asc: 'date ASC',
    score_desc: 'review_score DESC',
    score_asc: 'review_score ASC'
  }[req.query.sort] || 'date DESC';
  const rows = await all(
    `SELECT review_id,review_content,review_author,review_score,teacher,date
     FROM TEACHER_REVIEW
     WHERE LOWER(teacher) LIKE ?
     ORDER BY ${sort}`, [`%${q}%`]
  );
  res.json({ reviews: rows });
});

app.get('/teacher_reviews/random', async (_req, res) => {
  const rows = await all(
    `SELECT review_content,review_author,review_score,teacher,date
     FROM TEACHER_REVIEW ORDER BY RANDOM() LIMIT 15`
  );
  res.json({ reviews: rows });
});

/* ───────────── ADMIN API ───────────── */
const auth = (req, res, next) => {
  const pw = req.headers.authentication || req.cookies.auth;
  if (pw !== ADMIN_PW) return res.sendStatus(401);
  next();
};

app.get('/admin/comments/data', auth, async (_req, res) => {
  res.json(await all('SELECT * FROM COMMENTS_GENERAL ORDER BY date DESC'));
});
app.put('/admin/comments/:id', auth, async (req, res) => {
  await run(
    `UPDATE COMMENTS_GENERAL
     SET comment_content=?,comment_author=?,meta=?
     WHERE comment_id=?`,
    [req.body.comment_content, req.body.comment_author, req.body.meta, req.params.id]
  );
  res.sendStatus(204);
});
app.delete('/admin/comments/:id', auth, async (req, res) => {
  await run('DELETE FROM COMMENTS_GENERAL WHERE comment_id=?', [req.params.id]);
  res.sendStatus(204);
});

/* images */
app.get('/admin/images/data', auth, async (_req, res) => {
  res.json(await all('SELECT * FROM CDN_IMG_SRC_A ORDER BY date DESC'));
});
app.put('/admin/images/:id', auth, async (req, res) => {
  await run(
    `UPDATE CDN_IMG_SRC_A SET img_name=?,meta=? WHERE img_id=?`,
    [req.body.img_name, req.body.meta, req.params.id]
  );
  res.sendStatus(204);
});
app.delete('/admin/images/:id', auth, async (req, res) => {
  await run('DELETE FROM CDN_IMG_SRC_A WHERE img_id=?', [req.params.id]);
  res.sendStatus(204);
});

/* teacher reviews */
app.get('/admin/teacher_reviews/data', auth, async (_req, res) => {
  res.json(await all('SELECT * FROM TEACHER_REVIEW ORDER BY date DESC'));
});
app.put('/admin/teacher_reviews/:id', auth, async (req, res) => {
  await run(
    `UPDATE TEACHER_REVIEW
     SET review_content=?,review_author=?,review_score=?,teacher=?,meta=?
     WHERE review_id=?`,
    [
      req.body.review_content,
      req.body.review_author,
      req.body.review_score,
      req.body.teacher,
      req.body.meta,
      req.params.id
    ]
  );
  res.sendStatus(204);
});
app.delete('/admin/teacher_reviews/:id', auth, async (req, res) => {
  await run('DELETE FROM TEACHER_REVIEW WHERE review_id=?', [req.params.id]);
  res.sendStatus(204);
});

/* ───────────── ADMIN API  (aliases for GET) ───────────── */
app.get('/admin/comments',          auth, async (_req, res) =>
  res.json(await all('SELECT * FROM COMMENTS_GENERAL ORDER BY date DESC'))
);

app.get('/admin/images',            auth, async (_req, res) =>
  res.json(await all('SELECT * FROM CDN_IMG_SRC_A ORDER BY date DESC'))
);

app.get('/admin/teacher_reviews',   auth, async (_req, res) =>
  res.json(await all('SELECT * FROM TEACHER_REVIEW ORDER BY date DESC'))
);


/* ───────────── misc ───────────── */
app.get('/healthz', (_req, res) => res.send('ok'));

/* ───────────── go ───────────── */
app.listen(PORT, () => console.log(`✅  Front‑end pages: http://localhost:${PORT}  (home, /comment, /review, /board, /admin)`));
