document.addEventListener('DOMContentLoaded', () => {
    if (window.__catalogueUiInitialised) {
        return;
    }
    window.__catalogueUiInitialised = true;

    const searchinput = document.getElementById("searchbar"); 
    const navbarSearchInput = document.getElementById("navbarsearch");
    const navsearchClearButton = document.getElementById("nav-search-clear");
    const jumpTopButton = document.getElementById("jump-top");

    let showFloatingSearchFromScroll = false;

    function syncNavSearchClearVisibility() {
        if (!navsearchClearButton || !navbarSearchInput) {
            return;
        }

        const hasText = navbarSearchInput.value.trim().length > 0;
        const inputHidden = navbarSearchInput.classList.contains("hidden");
        navsearchClearButton.classList.toggle("hidden", inputHidden || !hasText);
    }

    const refreshFloatingControls = () => {
        if (!navbarSearchInput) {
            return;
        }

        const navbar = document.getElementById("navbar");
        const isCompactNav = navbar ? navbar.classList.contains("is-compact") : false;
        if (isCompactNav) {
            navbarSearchInput.classList.add("hidden");
            if (jumpTopButton) {
                jumpTopButton.classList.add("hidden");
            }
            syncNavSearchClearVisibility();
            return;
        }

        const keepVisibleForFocus = document.activeElement === navbarSearchInput;
        const showNavbarSearch = showFloatingSearchFromScroll || keepVisibleForFocus;
        navbarSearchInput.classList.toggle("hidden", !showNavbarSearch);
        syncNavSearchClearVisibility();

        if (jumpTopButton) {
            jumpTopButton.classList.toggle("hidden", !showFloatingSearchFromScroll);
        }
    };

    // Safety check: Only run if BOTH elements exist on this specific page
    if (searchinput && navbarSearchInput) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If searchbar is scrolled past the top
                if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                    showFloatingSearchFromScroll = true;
                } else {
                    showFloatingSearchFromScroll = false;
                }

                refreshFloatingControls();
            });
        }, { threshold: 0 }); 

        observer.observe(searchinput);

        navbarSearchInput.addEventListener("focus", refreshFloatingControls);
        navbarSearchInput.addEventListener("blur", refreshFloatingControls);
        refreshFloatingControls();
    } else {
        console.warn("Scroll observer skipped: Searchbar or Navbar missing from this page.");
    }

    const modal = document.getElementById("component-modal");
    const cards = document.querySelectorAll(".card-expand-trigger");

    if (!modal || cards.length === 0) {
        return;
    }

    const closeButton = document.getElementById("modal-close");
    const modalImage = document.getElementById("modal-image");
    const modalName = document.getElementById("modal-component-name");
    const modalCategory = document.getElementById("modal-category");
    const modalDescription = document.getElementById("modal-description");
    const modalUsage = document.getElementById("modal-usage");
    const modalRecipe = document.getElementById("modal-recipe");
    const modalWiki = document.getElementById("modal-wiki");
    const modalComplexity = document.getElementById("modal-complexity");
    const modalObtainability = document.getElementById("modal-obtainability");

    const container = document.querySelector(".container");
    const noResults = document.getElementById("no-results");
    const filterToggle = document.getElementById("filter-toggle");
    const clearFiltersButton = document.getElementById("clear-filters");
    const filtersPanel = document.getElementById("filters-panel");
    const categoryInputs = document.querySelectorAll('input[name="category-filter"]');
    const levelChips = document.querySelectorAll(".level-chip");
    const sortToggle = document.getElementById("sort-toggle");
    const sortMenu = document.getElementById("sort-menu");
    const sortOptions = document.querySelectorAll(".sort-option");
    const sortDirectionButton = document.getElementById("sort-direction");
    const searchClearButton = document.getElementById("search-clear");

    const allCards = Array.from(cards);
    const originalOrder = new Map();

    allCards.forEach((card, index) => {
        originalOrder.set(card, index);
    });

    const state = {
        searchText: "",
        category: "",
        complexity: null,
        obtainability: null,
        sortBy: "none",
        sortDirection: "asc"
    };

    const hasActiveFilters = () => (
        state.category !== "" ||
        state.complexity !== null ||
        state.obtainability !== null
    );

    const updateClearFiltersVisibility = () => {
        if (!clearFiltersButton) {
            return;
        }

        clearFiltersButton.classList.toggle("hidden", !hasActiveFilters());
    };

    const updateSearchClearVisibility = () => {
        if (!searchClearButton) {
            return;
        }

        searchClearButton.classList.toggle("hidden", state.searchText.length === 0);
    };

    const updateNavSearchClearVisibility = () => {
        syncNavSearchClearVisibility();
    };

    // Keep track of which card opened the modal so focus can be restored on close.
    let lastFocusedCard = null;

    // Ratings should always stay in the 0..4 range, even if DB data is invalid.
    const clampLevel = (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return 0;
        }
        return Math.max(0, Math.min(4, parsed));
    };

    const normaliseText = (value) => (value || "").toLowerCase();

    const updateSortOptionUI = () => {
        sortOptions.forEach((option) => {
            const isSelected = option.dataset.sort === state.sortBy;
            option.classList.toggle("is-selected", isSelected);
            option.setAttribute("aria-selected", isSelected ? "true" : "false");
        });
    };

    const compareCards = (leftCard, rightCard) => {
        if (state.sortBy === "alphabetical") {
            return normaliseText(leftCard.dataset.name).localeCompare(normaliseText(rightCard.dataset.name));
        }

        if (state.sortBy === "complexity") {
            return clampLevel(leftCard.dataset.complexity) - clampLevel(rightCard.dataset.complexity);
        }

        if (state.sortBy === "obtainability") {
            return clampLevel(leftCard.dataset.obtainability) - clampLevel(rightCard.dataset.obtainability);
        }

        return originalOrder.get(leftCard) - originalOrder.get(rightCard);
    };

    const updateVisibleCards = () => {
        const matchingCards = allCards.filter((card) => {
            const matchesSearch = normaliseText(card.dataset.name).includes(state.searchText);
            const matchesCategory = !state.category || card.dataset.category === state.category;
            const matchesComplexity = state.complexity === null || clampLevel(card.dataset.complexity) === state.complexity;
            const matchesObtainability = state.obtainability === null || clampLevel(card.dataset.obtainability) === state.obtainability;

            return matchesSearch && matchesCategory && matchesComplexity && matchesObtainability;
        });

        const matchingSet = new Set(matchingCards);
        const sortedMatches = [...matchingCards].sort(compareCards);

        if (state.sortDirection === "desc") {
            sortedMatches.reverse();
        }

        const nonMatchingCards = allCards.filter((card) => !matchingSet.has(card));

        [...sortedMatches, ...nonMatchingCards].forEach((card) => {
            container.appendChild(card);
        });

        allCards.forEach((card) => {
            card.classList.toggle("is-filtered-out", !matchingSet.has(card));
        });

        if (noResults) {
            noResults.classList.toggle("hidden", matchingCards.length > 0);
        }

        updateClearFiltersVisibility();
        updateSearchClearVisibility();
        updateNavSearchClearVisibility();
    };

    const applySearchText = (rawValue) => {
        const safeValue = rawValue || "";
        state.searchText = normaliseText(safeValue.trim());

        if (searchinput && searchinput.value !== safeValue) {
            searchinput.value = safeValue;
        }

        if (navbarSearchInput && navbarSearchInput.value !== safeValue) {
            navbarSearchInput.value = safeValue;
        }

        updateVisibleCards();
    };

    // Build 4 segments dynamically and fill the first N based on the level.
    const renderSegments = (targetElement, level) => {
        targetElement.innerHTML = "";
        targetElement.className = `rating-bar level-${level}`;

        for (let segment = 1; segment <= 4; segment += 1) {
            const piece = document.createElement("span");
            piece.className = "rating-segment";
            if (segment <= level) {
                piece.classList.add("is-filled");
            }
            targetElement.appendChild(piece);
        }
    };

    // Disable the wiki button when no valid link is present.
    const updateWikiLink = (url) => {
        const safeUrl = (url || "").trim();
        if (!safeUrl || safeUrl === "#") {
            modalWiki.setAttribute("href", "#");
            modalWiki.setAttribute("aria-disabled", "true");
            return;
        }

        modalWiki.setAttribute("href", safeUrl);
        modalWiki.removeAttribute("aria-disabled");
    };

    // Read all data-* attributes from the clicked card and push into modal fields.
    const openModalForCard = (card) => {
        const complexityLevel = clampLevel(card.dataset.complexity);
        const obtainabilityLevel = clampLevel(card.dataset.obtainability);

        modalImage.src = card.dataset.image || "";
        modalImage.alt = `Image for ${card.dataset.name || "selected component"}`;
        modalName.textContent = card.dataset.name || "Unknown component";
        modalCategory.textContent = card.dataset.category || "Unknown category";
        modalDescription.textContent = card.dataset.description || "No description available yet.";
        modalUsage.textContent = card.dataset.usage || "No usage information available yet.";

        modalRecipe.src = card.dataset.recipe || "";
        modalRecipe.alt = `Crafting recipe for ${card.dataset.name || "selected component"}`;

        // Re-render bars for the selected component.
        renderSegments(modalComplexity, complexityLevel);
        renderSegments(modalObtainability, obtainabilityLevel);
        updateWikiLink(card.dataset.wiki);

        lastFocusedCard = card;
        // CSS class controls visibility; aria/body class support accessibility and scroll lock.
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("body-modal-open");
        closeButton.focus();
    };

    const closeModal = () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("body-modal-open");

        // Return keyboard users to the card that launched the modal.
        if (lastFocusedCard) {
            lastFocusedCard.focus();
        }
    };

    const setLevelFilter = (filterType, selectedValue) => {
        if (filterType === "complexity") {
            state.complexity = selectedValue === "any" ? null : clampLevel(selectedValue);
        }

        if (filterType === "obtainability") {
            state.obtainability = selectedValue === "any" ? null : clampLevel(selectedValue);
        }

        levelChips.forEach((chip) => {
            if (chip.dataset.filterType === filterType) {
                chip.classList.toggle("is-active", chip.dataset.level === selectedValue);
            }
        });

        updateVisibleCards();
    };

    // Mouse and keyboard can both open a card (Enter/Space for accessibility).
    cards.forEach((card) => {
        card.addEventListener("click", () => openModalForCard(card));
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openModalForCard(card);
            }
        });
    });

    closeButton.addEventListener("click", closeModal);

    if (searchinput) {
        searchinput.addEventListener("input", (event) => {
            applySearchText(event.target.value);
        });
    }

    if (navbarSearchInput) {
        navbarSearchInput.addEventListener("input", (event) => {
            applySearchText(event.target.value);
        });
    }

    if (searchClearButton && searchinput) {
        searchClearButton.addEventListener("click", () => {
            applySearchText("");
            searchinput.focus();
        });
    }

    if (navsearchClearButton && navbarSearchInput) {
        navsearchClearButton.addEventListener("click", () => {
            applySearchText("");
            navbarSearchInput.focus();
        });
    }

    if (jumpTopButton) {
        jumpTopButton.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    window.addEventListener("resize", refreshFloatingControls);

    categoryInputs.forEach((input) => {
        input.addEventListener("change", () => {
            state.category = input.value;
            updateVisibleCards();
        });
    });

    levelChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            setLevelFilter(chip.dataset.filterType, chip.dataset.level);
        });
    });

    if (filterToggle && filtersPanel) {
        filterToggle.addEventListener("click", () => {
            const isOpen = !filtersPanel.classList.contains("hidden");
            filtersPanel.classList.toggle("hidden", isOpen);
            filterToggle.classList.toggle("is-active", !isOpen);
            filterToggle.setAttribute("aria-expanded", String(!isOpen));
            filtersPanel.setAttribute("aria-hidden", String(isOpen));
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            state.category = "";
            state.complexity = null;
            state.obtainability = null;

            const defaultCategory = document.querySelector('input[name="category-filter"][value=""]');
            if (defaultCategory) {
                defaultCategory.checked = true;
            }

            ["complexity", "obtainability"].forEach((type) => {
                levelChips.forEach((chip) => {
                    if (chip.dataset.filterType === type) {
                        chip.classList.toggle("is-active", chip.dataset.level === "any");
                    }
                });
            });

            updateVisibleCards();
        });
    }

    if (sortToggle && sortMenu) {
        sortToggle.addEventListener("click", () => {
            const isOpen = !sortMenu.classList.contains("hidden");
            sortMenu.classList.toggle("hidden", isOpen);
            sortToggle.setAttribute("aria-expanded", String(!isOpen));
        });
    }

    sortOptions.forEach((option) => {
        option.addEventListener("click", () => {
            state.sortBy = option.dataset.sort;
            updateSortOptionUI();
            updateVisibleCards();

            if (sortMenu && sortToggle) {
                sortMenu.classList.add("hidden");
                sortToggle.setAttribute("aria-expanded", "false");
            }
        });
    });

    if (sortDirectionButton) {
        sortDirectionButton.addEventListener("click", () => {
            state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
            sortDirectionButton.textContent = state.sortDirection === "asc" ? "Asc" : "Desc";
            sortDirectionButton.setAttribute("aria-pressed", String(state.sortDirection === "desc"));
            updateVisibleCards();
        });
    }

    // Close when clicking on the dark backdrop, but not when clicking inside the dialog.
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Global Escape handler for quick close from keyboard.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) {
            closeModal();
        }
    });

    document.addEventListener("click", (event) => {
        if (!sortMenu || !sortToggle) {
            return;
        }

        if (!sortMenu.classList.contains("hidden") && !sortMenu.contains(event.target) && !sortToggle.contains(event.target)) {
            sortMenu.classList.add("hidden");
            sortToggle.setAttribute("aria-expanded", "false");
        }
    });

    updateSortOptionUI();
    updateVisibleCards();
});