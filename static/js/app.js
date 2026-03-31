if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker
            .register("static/js/serviceworker.js")
            .then(() => console.log("service worker registered"))
            .catch((err) => console.log("service worker not registered", err));
    });
}

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    const installButton = document.getElementById("install-button");
    if (installButton) {
        installButton.classList.remove("hidden");
    }
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    const installButton = document.getElementById("install-button");
    if (installButton) {
        installButton.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const installButton = document.getElementById("install-button");
    if (installButton) {
        if (deferredInstallPrompt) {
            installButton.classList.remove("hidden");
        }

        installButton.addEventListener("click", async () => {
            if (!deferredInstallPrompt) {
                return;
            }

            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            installButton.classList.add("hidden");
        });
    }

    const navbar = document.getElementById("navbar");
    const navBurger = document.getElementById("nav-burger");
    const navLinks = document.getElementById("nav-links");
    const navLogo = document.getElementById("nav-logo-link");
    if (!navbar || !navBurger || !navLinks || !navLogo) {
        return;
    }

    let isExpanded = false;
    const COMPACT_NAV_BREAKPOINT = 780;

    const shouldUseCompactNav = () => {
        return window.innerWidth <= COMPACT_NAV_BREAKPOINT;
    };

    const applyNavLayout = () => {
        const useCompact = shouldUseCompactNav();
        navbar.classList.toggle("is-compact", useCompact);
        navBurger.classList.toggle("hidden", !useCompact);

        if (!useCompact) {
            isExpanded = false;
            navbar.classList.remove("is-expanded");
            navBurger.setAttribute("aria-expanded", "false");
            return;
        }

        navbar.classList.toggle("is-expanded", isExpanded);
        navBurger.setAttribute("aria-expanded", String(isExpanded));
    };

    navBurger.addEventListener("click", () => {
        if (!navbar.classList.contains("is-compact")) {
            return;
        }

        isExpanded = !isExpanded;
        navbar.classList.toggle("is-expanded", isExpanded);
        navBurger.setAttribute("aria-expanded", String(isExpanded));
    });

    window.addEventListener("resize", applyNavLayout);
    applyNavLayout();
});