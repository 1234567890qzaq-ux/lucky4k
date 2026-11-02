require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const TOKEN = process.env.REPLICATE_API_TOKEN;
const VERSION = process.env.REPLICATE_MODEL_VERSION;
const PORT = Number(process.env.PORT || 8787);
const MAX_IN_EDGE = Number(process.env.MAX_INPUT_EDGE || 1280);
const MAX_UPLOAD = 25 * 1024 * 1024;

if (!TOKEN || !VERSION) {
  console.error('Missing REPLICATE_API_TOKEN or REPLICATE_MODEL_VERSION. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

async function replicate(path, opts = {}) {
  const r = await fetch('https://api.replicate.com/v1' + path, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  if (!r.ok) {
    console.error('Replicate error', r.status, text.slice(0, 300));
    if (r.status === 401) throw new ApiError(502, 'SERVER_CONFIG', 'AI service credentials are invalid.');
    if (r.status === 402) throw new ApiError(502, 'BILLING', 'AI service billing is not active.');
    if (r.status === 429) throw new ApiError(429, 'RATE_LIMIT', 'AI service is busy. Please retry shortly.');
    throw new ApiError(502, 'UPSTREAM', 'AI service returned an error.');
  }
  return data;
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use('/api/', rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_PER_MIN || 120) }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD, files: 1 } });
const validId = (id) => /^[a-z0-9]{8,64}$/i.test(id);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/enhance', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'NO_FILE', 'No image received.');
    const targetEdge = Math.min(3840, Math.max(1280, parseInt(req.body.targetLongEdge, 10) || 3840));
    const faceEnhance = req.body.faceEnhance === 'true';

    let meta;
    try { meta = await sharp(req.file.buffer).metadata(); }
    catch { throw new ApiError(415, 'UNSUPPORTED', 'This file is not a readable image.'); }
    if (!['jpeg', 'png', 'webp'].includes(meta.format)) {
      throw new ApiError(415, 'UNSUPPORTED', 'Only JPG, PNG and WEBP images are supported.');
    }

    // Apply EXIF rotation, cap input size, keep lossless PNG for the model.
    const { data, info } = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: MAX_IN_EDGE, height: MAX_IN_EDGE, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });

    const inLong = Math.max(info.width, info.height);
    const scale = Math.min(10, Math.max(1, Math.round((targetEdge / inLong) * 100) / 100));

    const form = new FormData();
    form.append('content', new Blob([data], { type: 'image/png' }), 'input.png');
    const file = await replicate('/files', { method: 'POST', body: form });

    const pred = await replicate('/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: VERSION,
        input: { image: file.urls.get, scale, face_enhance: faceEnhance },
      }),
    });

    res.json({
      id: pred.id,
      expectedWidth: Math.round(info.width * scale),
      expectedHeight: Math.round(info.height * scale),
    });
  } catch (e) { next(e); }
});

app.get('/api/enhance/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) throw new ApiError(400, 'BAD_ID', 'Invalid job id.');
    const p = await replicate('/predictions/' + req.params.id);
    if (p.status === 'succeeded') {
      const out = Array.isArray(p.output) ? p.output[0] : p.output;
      if (!out) throw new ApiError(502, 'UPSTREAM', 'AI service returned no image.');
      return res.json({ status: 'succeeded', outputUrl: out });
    }
    if (p.status === 'failed') return res.json({ status: 'failed', error: 'The AI could not process this image.' });
    if (p.status === 'canceled') return res.json({ status: 'canceled' });
    res.json({ status: 'processing' });
  } catch (e) { next(e); }
});

app.post('/api/enhance/:id/cancel', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) throw new ApiError(400, 'BAD_ID', 'Invalid job id.');
    await replicate(`/predictions/${req.params.id}/cancel`, { method: 'POST' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') err = new ApiError(413, 'TOO_LARGE', 'Image is larger than 25 MB.');
  const status = err.status || 500;
  if (!err.status) console.error(err);
  res.status(status).json({ error: { code: err.code || 'SERVER', message: err.status ? err.message : 'Unexpected server error.' } });
});

app.listen(PORT, '0.0.0.0', () => console.log(`LUCKY 4K AI backend on :${PORT}`));
