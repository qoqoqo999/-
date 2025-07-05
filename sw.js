const CACHE_NAME = 'snake-game-cache-v1.0'; // キャッシュのバージョン (更新時に変更)
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/icon-48x48.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-144x144.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
  // 必要に応じて他のリソース（フォント、追加の画像など）も追加
];

// --- インストールイベント ---
// サービスワーカーがインストールされたときに、アプリのシェルをキャッシュする
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 新しいSWがすぐにアクティブになるように強制
      .catch(error => console.error('[Service Worker] Cache addAll failed:', error))
  );
});

// --- アクティベートイベント ---
// 古いキャッシュを削除し、新しいサービスワーカーがページを制御できるようにする
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // すべてのクライアント（開いているページ）をすぐに制御する
  );
});

// --- フェッチイベント ---
// ブラウザからのリクエストをインターセプトし、キャッシュまたはネットワークから応答する
self.addEventListener('fetch', event => {
  // ナビゲーションリクエスト（HTMLページなど）の場合の戦略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // オフライン時にキャッシュされたindex.htmlを返す（オフラインページとして機能）
        return caches.match('/index.html');
      })
    );
    return;
  }

  // その他のリソース（CSS, JS, 画像など）の場合の戦略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにリソースがあればそれを返す
        if (response) {
          // console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // キャッシュになければネットワークから取得し、将来のためにキャッシュに追加
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(fetchResponse => {
            // レスポンスが有効な場合のみキャッシュに追加
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }
            const responseToCache = fetchResponse.clone(); // レスポンスは一度しか消費できないためクローン
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return fetchResponse;
          })
          .catch(error => {
            // ネットワークエラーが発生した場合の処理（例: オフライン時の代替）
            console.error('[Service Worker] Fetch failed:', event.request.url, error);
            // 特定のリソースタイプに応じたフォールバックを提供することも可能
            // 例: return caches.match('/images/offline-fallback.png');
            return new Response('Network error or resource not cached.', { status: 503 }); // Service Unavailable
          });
      })
  );
});
