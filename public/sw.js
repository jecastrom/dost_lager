/**
 * ProcureFlow Service Worker (Step 5c)
 *
 * Strategies:
 * - App shell (index.html): Stale-while-revalidate (show cached, update in background)
 * - Static assets (JS, CSS, fonts, images): Cache-first (fast loads, update on new SW version)
 * - API calls (/api/*): Network-first (live data preferred, cache fallback)
 * - External CDN (esm.sh, fonts.googleapis): Cache-first (immutable content-hashed URLs)
 *
 * Cache versioning: Bump CACHE_VERSION on deploy to bust stale assets.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `procureflow-static-${CACHE_VERSION}`;
const API_CACHE = `procureflow-api-${CACHE_VERSION}`;
const CDN_CACHE = `procureflow-cdn-${CACHE_VERSION}`;

// App shell — the minimum needed to render the app offline
const APP_SHELL = [
    '/',
    '/index.html',
    '/index.css',
    '/manifest.json',
];

// ============================================================================
// INSTALL: Pre-cache app shell
// ============================================================================

self.addEventListener('install', (event) => {
    console.info('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => {
                console.info('[SW] App shell cached');
                return self.skipWaiting(); // Activate immediately
            })
    );
});

// ============================================================================
// ACTIVATE: Clean up old caches
// ============================================================================

self.addEventListener('activate', (event) => {
    console.info('[SW] Activating...');
    const currentCaches = [STATIC_CACHE, API_CACHE, CDN_CACHE];

    event.waitUntil(
        caches.keys()
            .then(cacheNames =>
                Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('procureflow-') && !currentCaches.includes(name))
                        .map(name => {
                            console.info(`[SW] Deleting old cache: ${name}`);
                            return caches.delete(name);
                        })
                )
            )
            .then(() => self.clients.claim()) // Take control of all tabs
    );
});

// ============================================================================
// FETCH: Route requests to appropriate strategy
// ============================================================================

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests (writes handled by offlineQueue.ts)
    if (event.request.method !== 'GET') return;

    // Strategy 1: API calls → Network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(event.request, API_CACHE));
        return;
    }

    // Strategy 2: CDN resources (esm.sh, Google Fonts) → Cache-first
    if (url.hostname === 'esm.sh' ||
        url.hostname === 'fonts.googleapis.com' ||
        url.hostname === 'fonts.gstatic.com' ||
        url.hostname === 'cdn.tailwindcss.com') {
        event.respondWith(cacheFirst(event.request, CDN_CACHE));
        return;
    }

    // Strategy 3: Same-origin requests → Stale-while-revalidate for HTML, cache-first for assets
    if (url.origin === self.location.origin) {
        // HTML navigation requests → stale-while-revalidate
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
            event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
            return;
        }

        // Static assets (JS, CSS, images, SVG, JSON) → cache-first
        event.respondWith(cacheFirst(event.request, STATIC_CACHE));
        return;
    }
});

// ============================================================================
// STRATEGY: Network-first (API calls)
// Try network, fall back to cache, update cache on success
// ============================================================================

async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        // Only cache successful GET responses
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            console.info(`[SW] Serving from cache (offline): ${request.url}`);
            return cached;
        }
        // No cache available — return offline error
        return new Response(JSON.stringify({ error: 'Offline — keine Daten im Cache' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// ============================================================================
// STRATEGY: Cache-first (static assets, CDN)
// Serve from cache if available, otherwise fetch and cache
// ============================================================================

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // For navigation-like requests, return the cached app shell
        if (request.headers.get('accept')?.includes('text/html')) {
            const shell = await caches.match('/index.html');
            if (shell) return shell;
        }
        return new Response('Offline', { status: 503 });
    }
}

// ============================================================================
// STRATEGY: Stale-while-revalidate (app shell HTML)
// Return cached version immediately, update cache in background
// ============================================================================

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fetch in background regardless
    const fetchPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // Return cached immediately if available, otherwise wait for network
    if (cached) {
        // Fire-and-forget the background update
        fetchPromise;
        return cached;
    }

    // No cache — must wait for network
    const networkResponse = await fetchPromise;
    if (networkResponse) return networkResponse;

    // Last resort: try index.html from cache (SPA fallback)
    const shell = await cache.match('/index.html');
    if (shell) return shell;

    return new Response('Offline', { status: 503 });
}

// ============================================================================
// MESSAGE: Handle messages from the app (e.g., skip waiting, cache clear)
// ============================================================================

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data === 'clearCaches') {
        caches.keys().then(names =>
            Promise.all(names.filter(n => n.startsWith('procureflow-')).map(n => caches.delete(n)))
        ).then(() => {
            console.info('[SW] All caches cleared');
            event.ports?.[0]?.postMessage({ cleared: true });
        });
    }
});