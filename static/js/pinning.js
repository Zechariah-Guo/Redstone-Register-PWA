window.cataloguePinning = (() => {
    const STORAGE_KEY = "pinned-cards";
    const pinnedIds = new Set();
    const clonesById = new Map();
    let cardById = new Map();
    let pinnedContainer = null;
    let pinnedSection = null;
    let onCardReady = null;

    const loadPinnedIds = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            if (Array.isArray(stored)) {
                stored.forEach((id) => pinnedIds.add(String(id)));
            }
        } catch (error) {
            // Ignore storage errors.
        }
    };

    const persistPinnedIds = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(pinnedIds)));
        } catch (error) {
            // Ignore storage errors.
        }
    };

    const updatePinnedSectionVisibility = () => {
        if (!pinnedSection) {
            return;
        }

        const hasVisibleCard = Array.from(clonesById.values()).some((card) => !card.classList.contains("is-filtered-out"));
        pinnedSection.classList.toggle("hidden", pinnedIds.size === 0 || !hasVisibleCard);
    };

    const setPinButtonState = (card, isPinned) => {
        if (!card) {
            return;
        }

        const pinButton = card.querySelector(".pin-button");
        if (pinButton) {
            pinButton.classList.toggle("is-pinned", isPinned);
            pinButton.setAttribute("aria-pressed", isPinned ? "true" : "false");
        }
    };

    const attachPinHandler = (button, cardId) => {
        if (!button) {
            return;
        }

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            togglePin(cardId);
        });

        button.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                togglePin(cardId);
            }
        });
    };

    const buildClone = (card, cardId) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("id", `pinned-card-${cardId}`);
        clone.classList.add("pinned-card");

        const pinButton = clone.querySelector(".pin-button");
        if (pinButton) {
            pinButton.classList.add("is-pinned");
            pinButton.setAttribute("aria-pressed", "true");
            attachPinHandler(pinButton, cardId);
        }

        if (typeof onCardReady === "function") {
            onCardReady(clone);
        }

        return clone;
    };

    const rebuildPinnedCards = () => {
        if (!pinnedContainer) {
            return;
        }

        pinnedContainer.innerHTML = "";
        clonesById.clear();

        pinnedIds.forEach((cardId) => {
            const card = cardById.get(cardId);
            if (!card) {
                return;
            }

            const clone = buildClone(card, cardId);
            clonesById.set(cardId, clone);
            pinnedContainer.appendChild(clone);
            syncPinnedFilter(cardId);
        });

        updatePinnedSectionVisibility();
    };

    const syncPinnedFilter = (cardId) => {
        const card = cardById.get(cardId);
        const clone = clonesById.get(cardId);
        if (!card || !clone) {
            return;
        }

        clone.classList.toggle("is-filtered-out", card.classList.contains("is-filtered-out"));
    };

    const syncPinnedFilters = () => {
        pinnedIds.forEach((cardId) => syncPinnedFilter(cardId));
        updatePinnedSectionVisibility();
    };

    const togglePin = (cardId) => {
        if (pinnedIds.has(cardId)) {
            pinnedIds.delete(cardId);
        } else {
            pinnedIds.add(cardId);
        }

        persistPinnedIds();
        setPinButtonState(cardById.get(cardId), pinnedIds.has(cardId));
        rebuildPinnedCards();
    };

    const init = ({ cards, section, container, handleCardActivation }) => {
        if (!section || !container || !cards || cards.length === 0) {
            return;
        }

        pinnedSection = section;
        pinnedContainer = container;
        onCardReady = handleCardActivation;

        cardById = new Map(
            cards
                .map((card) => [String(card.dataset.id || ""), card])
                .filter(([cardId]) => cardId.length > 0)
        );

        loadPinnedIds();

        cards.forEach((card) => {
            const cardId = String(card.dataset.id || "");
            if (!cardId) {
                return;
            }
            setPinButtonState(card, pinnedIds.has(cardId));

            const pinButton = card.querySelector(".pin-button");
            attachPinHandler(pinButton, cardId);
        });

        rebuildPinnedCards();
    };

    return {
        init,
        syncPinnedFilters
    };
})();
