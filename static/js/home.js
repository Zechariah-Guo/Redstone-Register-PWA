document.addEventListener("DOMContentLoaded", () => {
    const actionButtons = Array.from(document.querySelectorAll(".minecraft-button"));
    if (actionButtons.length === 0) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    actionButtons.forEach((button) => {
        if (button.tagName.toLowerCase() !== "a") {
            return;
        }

        button.addEventListener("click", (event) => {
            const href = button.getAttribute("href");
            if (!href || href.startsWith("#") || prefersReducedMotion.matches) {
                return;
            }

            event.preventDefault();
            button.classList.add("is-pressing");

            window.setTimeout(() => {
                window.location.assign(href);
            }, 140);
        });
    });
});
