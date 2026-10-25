const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../server/serve.js');

test('published root serves the browser app while preserving Expo Go routes', async (t) => {
  const staticRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'momentum-web-server-'));
  t.after(() => fs.rm(staticRoot, { recursive: true, force: true }));

  const put = async (relativePath, content) => {
    const filePath = path.join(staticRoot, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  };

  const webHtml = '<!doctype html><title>Momentum 我的商場</title><main>WEB_APP_ROOT</main>';
  await put('web/index.html', webHtml);
  await put('web/_expo/static/js/web/entry.js', 'window.momentumWebReady = true;');
  await put('web/assets/sample.webp', Buffer.from('web-image'));
  await put('ios/manifest.json', JSON.stringify({ platform: 'ios-manifest' }));
  await put('android/manifest.json', JSON.stringify({ platform: 'android-manifest' }));
  await put(
    '1700000000000-123/_expo/static/js/ios/bundle.js',
    'window.nativeBundleReady = true;',
  );

  const server = createServer({ staticRoot, serverBasePath: '' });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const { port } = server.address();
  const request = (pathname, headers) =>
    fetch(`http://127.0.0.1:${port}${pathname}`, { headers });

  const root = await request('/');
  assert.equal(root.status, 200);
  assert.match(root.headers.get('content-type'), /text\/html/);
  assert.equal(await root.text(), webHtml);

  const deepLink = await request('/mall/today');
  assert.equal(deepLink.status, 200);
  assert.equal(await deepLink.text(), webHtml);

  const webBundle = await request('/_expo/static/js/web/entry.js');
  assert.equal(webBundle.status, 200);
  assert.match(webBundle.headers.get('content-type'), /javascript/);
  assert.match(await webBundle.text(), /momentumWebReady/);

  const webImage = await request('/assets/sample.webp');
  assert.equal(webImage.status, 200);
  assert.match(webImage.headers.get('content-type'), /image\/webp/);

  const landingPage = await request('/install');
  assert.equal(landingPage.status, 200);
  const landingHtml = await landingPage.text();
  assert.match(landingHtml, /Momentum 我的商場/);
  assert.match(landingHtml, /Scan QR Code/);

  const iosManifest = await request('/', { 'expo-platform': 'ios' });
  assert.equal(iosManifest.status, 200);
  assert.match(iosManifest.headers.get('expo-protocol-version'), /1/);
  assert.deepEqual(await iosManifest.json(), { platform: 'ios-manifest' });

  const androidManifest = await request('/manifest', { 'expo-platform': 'android' });
  assert.equal(androidManifest.status, 200);
  assert.deepEqual(await androidManifest.json(), { platform: 'android-manifest' });

  const nativeBundle = await request('/1700000000000-123/_expo/static/js/ios/bundle.js');
  assert.equal(nativeBundle.status, 200);
  assert.match(await nativeBundle.text(), /nativeBundleReady/);

  const missingAsset = await request('/missing.js');
  assert.equal(missingAsset.status, 404);
});
