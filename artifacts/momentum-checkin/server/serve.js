/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const STATIC_ROOT = path.resolve(
  process.env.STATIC_BUILD_DIR || path.resolve(__dirname, '..', 'static-build'),
);
const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'landing-page.html');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    return typeof appJson.expo?.name === 'string'
      ? appJson.expo.name
      : 'App Landing Page';
  } catch {
    return 'App Landing Page';
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toScriptString(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function serveManifest(platform, res, staticRoot) {
  const manifestPath = path.join(staticRoot, platform, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, 'utf-8');
  res.writeHead(200, {
    'content-type': 'application/json',
    'expo-protocol-version': '1',
    'expo-sfv-version': '0',
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName, basePath) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `exps://${host}${basePath}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_ATTRIBUTE_PLACEHOLDER/g, escapeHtml(expsUrl))
    .replace(/EXPS_URL_JSON_PLACEHOLDER/g, toScriptString(expsUrl))
    .replace(/APP_NAME_PLACEHOLDER/g, escapeHtml(appName));

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function serveFileFromRoot(root, urlPath, res) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }

  const relativePath = path.posix.normalize(`/${decodedPath}`).replace(/^\/+/, '');
  const resolvedRoot = path.resolve(root);
  let filePath = path.resolve(resolvedRoot, relativePath || 'index.html');
  if (
    filePath !== resolvedRoot &&
    !filePath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'content-type': contentType });
  res.end(content);
  return true;
}

function serveStaticFile(urlPath, res, staticRoot) {
  if (!serveFileFromRoot(staticRoot, urlPath, res)) {
    res.writeHead(404);
    res.end('Not Found');
  }
}

function serveWebFile(urlPath, res, webRoot, staticRoot) {
  if (serveFileFromRoot(webRoot, urlPath, res)) return;

  if (!path.extname(urlPath)) {
    const routePath = urlPath.replace(/\/+$/, '');
    if (serveFileFromRoot(webRoot, `${routePath}.html`, res)) return;
    if (serveFileFromRoot(webRoot, `${routePath}/index.html`, res)) return;
    if (serveFileFromRoot(webRoot, '/index.html', res)) return;
  }

  serveStaticFile(urlPath, res, staticRoot);
}

function createServer({
  staticRoot = STATIC_ROOT,
  serverBasePath = basePath,
} = {}) {
  const webRoot = path.join(staticRoot, 'web');
  const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const appName = getAppName();

  return http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    let pathname = url.pathname;

    if (serverBasePath && pathname.startsWith(serverBasePath)) {
      pathname = pathname.slice(serverBasePath.length) || '/';
    }

    const platform = req.headers['expo-platform'];
    if (pathname === '/' && (platform === 'ios' || platform === 'android')) {
      return serveManifest(platform, res, staticRoot);
    }
    if (pathname === '/manifest') {
      if (platform === 'ios' || platform === 'android') {
        return serveManifest(platform, res, staticRoot);
      }
      return serveStaticFile(pathname, res, staticRoot);
    }
    if (pathname === '/install') {
      return serveLandingPage(
        req,
        res,
        landingPageTemplate,
        appName,
        serverBasePath,
      );
    }

    serveWebFile(pathname, res, webRoot, staticRoot);
  });
}

if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = createServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`Serving web and static Expo builds on port ${port}`);
  });
}

module.exports = { createServer };
