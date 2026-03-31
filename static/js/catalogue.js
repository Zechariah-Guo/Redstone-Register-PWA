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
    const wikiShell = document.getElementById("details-wiki-shell");
    const modalComplexity = document.getElementById("modal-complexity");
    const modalObtainability = document.getElementById("modal-obtainability");
    const detailsDialog = modal.querySelector(".details-dialog");

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
    const pinnedSection = document.getElementById("pinned-section");
    const pinnedContainer = document.getElementById("pinned-container");

    const allCards = Array.from(cards);
    const originalOrder = new Map();

    allCards.forEach((card, index) => {
        originalOrder.set(card, index);
    });

    const state = {
        searchText: "",
        categories: new Set(),
        complexity: null,
        obtainability: null,
        sortBy: "none",
        sortDirection: "asc"
    };

    let syncPinnedFilters = null;

    const hasActiveFilters = () => (
        state.categories.size > 0 ||
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
    let modalCloseTimer = null;

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

        const leftId = Number.parseInt(leftCard.dataset.id, 10);
        const rightId = Number.parseInt(rightCard.dataset.id, 10);

        if (!Number.isNaN(leftId) && !Number.isNaN(rightId)) {
            return leftId - rightId;
        }

        return originalOrder.get(leftCard) - originalOrder.get(rightCard);
    };

    const updateVisibleCards = () => {
        const matchingCards = allCards.filter((card) => {
            const matchesSearch = normaliseText(card.dataset.name).includes(state.searchText);
            const matchesCategory = state.categories.size === 0 || state.categories.has(card.dataset.category);
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

        if (typeof syncPinnedFilters === "function") {
            syncPinnedFilters();
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

    const isSafeExternalUrl = (value) => {
        if (!value) {
            return false;
        }

        try {
            const parsed = new URL(value);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch (error) {
            return false;
        }
    };

    // Disable the wiki button when no valid link is present.
    const updateWikiLink = (url) => {
        const safeUrl = (url || "").trim();
        if (!isSafeExternalUrl(safeUrl)) {
            modalWiki.setAttribute("href", "#");
            modalWiki.setAttribute("aria-disabled", "true");
            return;
        }

        modalWiki.setAttribute("href", safeUrl);
        modalWiki.removeAttribute("aria-disabled");
    };

    const openWikiWithDelay = (event) => {
        if (!modalWiki) {
            return;
        }

        if (modalWiki.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
            return;
        }

        const targetUrl = modalWiki.getAttribute("href");
        if (!isSafeExternalUrl(targetUrl)) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        if (wikiShell) {
            wikiShell.classList.add("is-pressing");
        }

        window.setTimeout(() => {
            const newWindow = window.open(targetUrl, "_blank", "noopener");
            if (newWindow) {
                newWindow.opener = null;
            }
            if (wikiShell) {
                wikiShell.classList.remove("is-pressing");
            }
        }, 160);
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
        if (modalCloseTimer) {
            window.clearTimeout(modalCloseTimer);
            modalCloseTimer = null;
        }

        modal.classList.remove("is-closing");
        // CSS class controls visibility; aria/body class support accessibility and scroll lock.
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("body-modal-open");
        closeButton.focus();
    };

    const closeModal = () => {
        if (!modal.classList.contains("is-open") || modal.classList.contains("is-closing")) {
            return;
        }

        const finishClose = () => {
            modal.classList.remove("is-open", "is-closing");

            if (modalCloseTimer) {
                window.clearTimeout(modalCloseTimer);
                modalCloseTimer = null;
            }

            // Return keyboard users to the card that launched the modal.
            if (lastFocusedCard) {
                lastFocusedCard.focus();
            }
        };

        modal.classList.add("is-closing");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("body-modal-open");

        if (detailsDialog) {
            const onAnimationEnd = (event) => {
                if (event.target !== detailsDialog) {
                    return;
                }
                detailsDialog.removeEventListener("animationend", onAnimationEnd);
                finishClose();
            };

            detailsDialog.addEventListener("animationend", onAnimationEnd);
        }

        modalCloseTimer = window.setTimeout(finishClose, 260);
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

        // Update the rating segment bar visual state
        const segmentBar = document.querySelector(`.level-segment-bar[data-filter-type="${filterType}"]`);
        if (segmentBar) {
            if (selectedValue === "any") {
                segmentBar.removeAttribute("data-selected-level");
            } else {
                segmentBar.setAttribute("data-selected-level", selectedValue);
            }
        }

        updateVisibleCards();
    };

    let filtersCloseTimer = null;

    const clearFiltersCloseTimer = () => {
        if (filtersCloseTimer) {
            window.clearTimeout(filtersCloseTimer);
            filtersCloseTimer = null;
        }
    };

    const setFiltersExpandedState = (isExpanded) => {
        if (!filtersPanel || !filterToggle) {
            return;
        }

        filterToggle.classList.toggle("is-active", isExpanded);
        filterToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        filtersPanel.setAttribute("aria-hidden", isExpanded ? "false" : "true");
    };

    const openFiltersPanel = () => {
        if (!filtersPanel) {
            return;
        }

        clearFiltersCloseTimer();
        filtersPanel.classList.remove("hidden");

        // Force style flush so the opening transition always runs.
        void filtersPanel.offsetHeight;

        filtersPanel.classList.add("is-open");
        setFiltersExpandedState(true);
    };

    const closeFiltersPanel = () => {
        if (!filtersPanel) {
            return;
        }

        clearFiltersCloseTimer();
        filtersPanel.classList.remove("is-open");
        setFiltersExpandedState(false);

        const hideAfterClose = () => {
            if (!filtersPanel.classList.contains("is-open")) {
                filtersPanel.classList.add("hidden");
            }
            clearFiltersCloseTimer();
        };

        const onTransitionEnd = (event) => {
            if (event.propertyName !== "max-height") {
                return;
            }

            filtersPanel.removeEventListener("transitionend", onTransitionEnd);
            hideAfterClose();
        };

        filtersPanel.addEventListener("transitionend", onTransitionEnd, { once: true });
        filtersCloseTimer = window.setTimeout(hideAfterClose, 380);
    };

    const toggleFiltersPanel = () => {
        if (!filtersPanel) {
            return;
        }

        const isPanelVisible = !filtersPanel.classList.contains("hidden");
        const isPanelOpen = filtersPanel.classList.contains("is-open");

        if (!isPanelVisible || !isPanelOpen) {
            openFiltersPanel();
            return;
        }

        closeFiltersPanel();
    };

    let sortCloseTimer = null;

    const clearSortCloseTimer = () => {
        if (sortCloseTimer) {
            window.clearTimeout(sortCloseTimer);
            sortCloseTimer = null;
        }
    };

    const setSortExpandedState = (isExpanded) => {
        if (!sortToggle || !sortMenu) {
            return;
        }

        sortToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    };

    const openSortMenu = () => {
        if (!sortMenu) {
            return;
        }

        clearSortCloseTimer();
        sortMenu.classList.remove("hidden");

        // Force style flush so opening transition is always applied.
        void sortMenu.offsetHeight;

        sortMenu.classList.add("is-open");
        setSortExpandedState(true);
    };

    const closeSortMenu = () => {
        if (!sortMenu) {
            return;
        }

        clearSortCloseTimer();
        sortMenu.classList.remove("is-open");
        setSortExpandedState(false);

        const hideAfterClose = () => {
            if (!sortMenu.classList.contains("is-open")) {
                sortMenu.classList.add("hidden");
            }
            clearSortCloseTimer();
        };

        const onTransitionEnd = (event) => {
            if (event.propertyName !== "max-height") {
                return;
            }

            sortMenu.removeEventListener("transitionend", onTransitionEnd);
            hideAfterClose();
        };

        sortMenu.addEventListener("transitionend", onTransitionEnd, { once: true });
        sortCloseTimer = window.setTimeout(hideAfterClose, 340);
    };

    const toggleSortMenu = () => {
        if (!sortMenu) {
            return;
        }

        const isMenuVisible = !sortMenu.classList.contains("hidden");
        const isMenuOpen = sortMenu.classList.contains("is-open");

        if (!isMenuVisible || !isMenuOpen) {
            openSortMenu();
            return;
        }

        closeSortMenu();
    };

    const attachCardActivation = (card) => {
        card.addEventListener("click", () => openModalForCard(card));
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openModalForCard(card);
            }
        });
    };

    // Mouse and keyboard can both open a card (Enter/Space for accessibility).
    cards.forEach((card) => {
        attachCardActivation(card);
    });

    const pinning = window.cataloguePinning;

    if (pinning && pinnedSection && pinnedContainer) {
        pinning.init({
            cards: allCards,
            section: pinnedSection,
            container: pinnedContainer,
            handleCardActivation: attachCardActivation
        });
        syncPinnedFilters = pinning.syncPinnedFilters;
    }

    closeButton.addEventListener("click", closeModal);

    if (modalWiki) {
        modalWiki.addEventListener("click", openWikiWithDelay);
        modalWiki.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                openWikiWithDelay(event);
            }
        });
    }

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
            if (input.checked) {
                state.categories.add(input.value);
            } else {
                state.categories.delete(input.value);
            }
            updateVisibleCards();
        });
    });

    levelChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            setLevelFilter(chip.dataset.filterType, chip.dataset.level);
        });
    });

    // Add event listeners for rating segment buttons in filters
    const segmentButtons = document.querySelectorAll(".rating-segment-button");
    segmentButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const bar = button.closest(".level-segment-bar");
            if (bar) {
                const filterType = bar.dataset.filterType;
                const level = button.dataset.level;
                setLevelFilter(filterType, level);
            }
        });
    });

    if (filterToggle && filtersPanel) {
        filtersPanel.classList.add("hidden");
        filtersPanel.classList.remove("is-open");
        setFiltersExpandedState(false);

        // Keep the simple named-function toggle pattern requested for this button.
        window.toggleFiltersPanel = toggleFiltersPanel;
        filterToggle.onclick = window.toggleFiltersPanel;
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            state.categories.clear();
            state.complexity = null;
            state.obtainability = null;

            categoryInputs.forEach((input) => {
                input.checked = false;
            });

            ["complexity", "obtainability"].forEach((type) => {
                levelChips.forEach((chip) => {
                    if (chip.dataset.filterType === type) {
                        chip.classList.toggle("is-active", chip.dataset.level === "any");
                    }
                });

                const segmentBar = document.querySelector(`.level-segment-bar[data-filter-type="${type}"]`);
                if (segmentBar) {
                    segmentBar.removeAttribute("data-selected-level");
                }
            });

            updateVisibleCards();
        });
    }

    if (sortToggle && sortMenu) {
        sortMenu.classList.add("hidden");
        sortMenu.classList.remove("is-open");
        setSortExpandedState(false);

        sortToggle.addEventListener("click", toggleSortMenu);
    }

    sortOptions.forEach((option) => {
        option.addEventListener("click", () => {
            state.sortBy = option.dataset.sort;
            updateSortOptionUI();
            updateVisibleCards();

            if (sortMenu && sortToggle) {
                closeSortMenu();
            }
        });
    });

    if (sortDirectionButton) {
        sortDirectionButton.addEventListener("click", () => {
            state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";

            const label = sortDirectionButton.querySelector(".label");
            if (label) {
                label.textContent = state.sortDirection === "asc" ? "Asc" : "Desc";
            }
            sortDirectionButton.setAttribute("aria-pressed", String(state.sortDirection === "desc"));
            sortDirectionButton.setAttribute("title", state.sortDirection === "asc" ? "Ascending" : "Descending");

            const icon = sortDirectionButton.querySelector(".material-symbols-outlined");
            if (icon) {
                icon.classList.toggle("icon-flipped", state.sortDirection === "asc");
            }

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
            closeSortMenu();
        }
    });

    updateSortOptionUI();
    updateVisibleCards();
});