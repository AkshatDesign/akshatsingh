import compression from 'compression';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THREE_ROOT = path.resolve(__dirname, 'node_modules/three');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const BLOCKED_PATHS = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
]);

app.disable('x-powered-by');
app.use(compression({ threshold: 1024 }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const normalized = path.posix.normalize(req.path);
  if (
    BLOCKED_PATHS.has(normalized) ||
    normalized.startsWith('/node_modules') ||
    normalized.startsWith('/.')
  ) {
    return res.status(404).end();
  }
  next();
});

// Serve Three.js ES modules from static /vendor/three first (identical to static deploys), fallback to node_modules/three
const STATIC_THREE_ROOT = path.resolve(__dirname, 'vendor/three');
app.get(/^\/vendor\/three\/(.+)$/, (req, res) => {
  const rel = req.params[0];
  if (!rel || rel.includes('..') || !rel.endsWith('.js')) {
    return res.status(404).end();
  }
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  const staticPath = path.resolve(STATIC_THREE_ROOT, rel);
  if (staticPath.startsWith(STATIC_THREE_ROOT + path.sep) && fs.existsSync(staticPath)) {
    return res.sendFile(staticPath);
  }
  const absPath = path.resolve(THREE_ROOT, rel);
  if (!absPath.startsWith(THREE_ROOT + path.sep) || !fs.existsSync(absPath)) {
    return res.status(404).end();
  }
  if (rel.startsWith('examples/jsm/')) {
    const src = fs.readFileSync(absPath, 'utf8')
      .replace(/from\s+['"]three['"]/g, "from '../../../build/three.module.js'");
    return res.send(src);
  }
  return res.sendFile(absPath);
});

const staticCacheHeaders = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache');
  } else if (
    ['.webp', '.png', '.jpg', '.jpeg', '.svg', '.mp4', '.webm', '.mp3', '.woff2'].includes(ext)
  ) {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  }
};

// Serve /public assets first (e.g. /assets/aistudio/*.mp3 radio RJ broadcasts)
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: staticCacheHeaders,
  })
);

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    index: 'index.html',
    setHeaders: staticCacheHeaders,
  })
);

if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

export default app;
