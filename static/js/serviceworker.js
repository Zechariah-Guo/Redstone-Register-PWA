const OFFLINE_URL = "/offline";

const CORE_ASSETS = [
    "/",
    "/catalogue",
    "/about",
    OFFLINE_URL,
    "/offline.html",
    "/static/css/style.css",
    "/static/css/theme-variables.css",
    "/static/js/app.js",
    "/static/js/theme.js",
    "/static/fonts/XRXV3I6Li01BKofINeaB.woff2",
    "/static/fonts/Minecrafter.Reg.woff",
    "/static/fonts/Minecrafter.Alt.woff",
    "/static/fonts/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2",
    "/static/images/logo.webp",
    "/static/images/favicon.webp",
    "/static/images/logo-footer.webp",
    "/static/icons/icon-128x128.png",
    "/static/icons/icon-192x192.png",
    "/static/icons/icon-384x384.png",
    "/static/icons/icon-512x512.png",
];

const OPTIONAL_ASSETS = [
    "/static/images/Burger-icon.webp",
    "/static/images/Basic%20Redstone.webp",
    "/static/images/Simple-Redstone.avif",
    "/static/images/Logical-Redstone.webp",
    "/static/images/Wiki.webp",
    "/static/images/Falling_Lucky_Blocks_Thumbnail_0.webp",
    "/static/icons/desktop_screenshot.png",
    "/static/icons/mobile_screenshot.png",
];

const CATALOGUE_ASSETS = "catalogue-assets-v12";

self.addEventListener("install", (installEvt) => {
    installEvt.waitUntil(
        caches
            .open(CATALOGUE_ASSETS)
            .then((cache) => {
                return cache.addAll(CORE_ASSETS).then(() => {
                    const optionalRequests = OPTIONAL_ASSETS.map((asset) => {
                        return cache.add(asset);
                    });
                    return Promise.allSettled(optionalRequests);
                });
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.log(error);
            })
    );
});

self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches
            .keys()
            .then((keyList) => {
                return Promise.all(
                    keyList.map((key) => {
                        if (key !== CATALOGUE_ASSETS) {
                            return caches.delete(key);
                        }
                        return undefined;
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", function (evt) {
    if (evt.request.method !== "GET") {
        return;
    }

    const acceptsHeader = evt.request.headers.get("accept") || "";
    const isHtmlRequest =
        evt.request.mode === "navigate" ||
        evt.request.destination === "document" ||
        acceptsHeader.includes("text/html");

    if (isHtmlRequest) {
        evt.respondWith(
            fetch(evt.request)
                .then((response) => {
                    if (!response || !response.ok) {
                        throw new Error("Network response not ok");
                    }
                    const responseCopy = response.clone();
                    caches.open(CATALOGUE_ASSETS).then((cache) => {
                        cache.put(evt.request, responseCopy);
                    });
                    return response;
                })
                .catch(() => {
                    return caches
                        .match(evt.request, { ignoreSearch: true })
                        .then((cachedResponse) => {
                            return cachedResponse || caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }

    evt.respondWith(
        caches.match(evt.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(evt.request).then((response) => {
                if (!response || !response.ok || response.type === "opaque") {
                    return response;
                }

                const responseCopy = response.clone();
                caches.open(CATALOGUE_ASSETS).then((cache) => {
                    cache.put(evt.request, responseCopy);
                });
                return response;
            });
        })
    );
});