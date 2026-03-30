document.addEventListener("DOMContentLoaded", () => {
    const faqSearchInput = document.getElementById("faq-search");
    const faqSearchClearButton = document.getElementById("faq-search-clear");
    const faqItems = Array.from(document.querySelectorAll(".faq-item"));
    const faqNoResults = document.getElementById("faq-no-results");

    if (!faqSearchInput || faqItems.length === 0) {
        return;
    }

    const sanitiseQuery = (rawValue) => {
        const safeValue = String(rawValue || "").slice(0, 80);
        return safeValue.replace(/[^a-zA-Z0-9\s'?!.,:-]/g, "").toLowerCase().trim();
    };

    const applyFaqFilter = (rawValue) => {
        const query = sanitiseQuery(rawValue);
        let matchCount = 0;

        faqItems.forEach((item) => {
            const questionElement = item.querySelector(".faq-question");
            const questionText = questionElement ? questionElement.textContent.toLowerCase() : "";
            const isMatch = query.length === 0 || questionText.includes(query);

            item.classList.toggle("hidden", !isMatch);
            if (isMatch) {
                matchCount += 1;
            } else {
                item.removeAttribute("open");
            }
        });

        if (faqNoResults) {
            faqNoResults.classList.toggle("hidden", matchCount > 0);
        }

        if (faqSearchClearButton) {
            faqSearchClearButton.classList.toggle("hidden", query.length === 0);
        }
    };

    faqSearchInput.addEventListener("input", (event) => {
        applyFaqFilter(event.target.value);
    });

    if (faqSearchClearButton) {
        faqSearchClearButton.addEventListener("click", () => {
            faqSearchInput.value = "";
            applyFaqFilter("");
            faqSearchInput.focus();
        });
    }

    applyFaqFilter("");
});
