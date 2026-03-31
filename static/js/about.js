document.addEventListener("DOMContentLoaded", () => {
    const questionButtons = Array.from(document.querySelectorAll(".faq-question-button"));
    const answerPanel = document.getElementById("faq-answer-panel");
    const answerBank = document.querySelector(".faq-answer-bank");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileFaqQuery = window.matchMedia("(max-width: 450px)");

    if (!answerPanel || !answerBank || questionButtons.length === 0) {
        return;
    }

    const setActiveButton = (activeButton) => {
        questionButtons.forEach((button) => {
            const isActive = button === activeButton;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    };

    const updateAnswerPanel = (answerId) => {
        const answer = answerBank.querySelector(`#${answerId}`);
        if (!answer) {
            return;
        }

        answerPanel.classList.remove("is-visible");
        answerPanel.innerHTML = answer.innerHTML;

        if (prefersReducedMotion.matches) {
            answerPanel.classList.add("is-visible");
            return;
        }

        window.setTimeout(() => {
            answerPanel.classList.add("is-visible");
        }, 10);
    };

    const getAnswerMarkup = (answerId, stripHeading = false) => {
        const answer = answerBank.querySelector(`#${answerId}`);
        if (!answer) {
            return "";
        }

        if (!stripHeading) {
            return answer.innerHTML;
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = answer.innerHTML;
        const heading = wrapper.querySelector("h3");
        if (heading) {
            heading.remove();
        }
        return wrapper.innerHTML;
    };

    const clearInlineAnswers = () => {
        questionButtons.forEach((button) => {
            const nextPanel = button.nextElementSibling;
            if (nextPanel && nextPanel.classList.contains("faq-answer-inline")) {
                nextPanel.remove();
            }
        });
    };

    const showInlineAnswer = (button) => {
        const answerId = button.getAttribute("data-answer-id");
        if (!answerId) {
            return;
        }

        const nextPanel = button.nextElementSibling;
        const isOpen = nextPanel && nextPanel.classList.contains("faq-answer-inline");

        questionButtons.forEach((other) => {
            if (other === button) {
                return;
            }
            other.classList.remove("is-active");
            other.setAttribute("aria-pressed", "false");
            const otherPanel = other.nextElementSibling;
            if (otherPanel && otherPanel.classList.contains("faq-answer-inline")) {
                otherPanel.remove();
            }
        });

        if (isOpen) {
            nextPanel.remove();
            button.classList.remove("is-active");
            button.setAttribute("aria-pressed", "false");
            return;
        }

        const markup = getAnswerMarkup(answerId, true);
        if (!markup) {
            return;
        }

        const inlinePanel = document.createElement("div");
        inlinePanel.className = "faq-answer-inline";
        inlinePanel.innerHTML = markup;
        button.insertAdjacentElement("afterend", inlinePanel);

        window.requestAnimationFrame(() => {
            inlinePanel.classList.add("is-open");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
    };

    const syncFaqMode = () => {
        if (mobileFaqQuery.matches) {
            if (answerPanel) {
                answerPanel.classList.remove("is-visible");
                answerPanel.innerHTML = "<p>Select a question to view the answer.</p>";
            }
            return;
        }

        clearInlineAnswers();

        const activeButton = questionButtons.find((button) => button.classList.contains("is-active"));
        if (activeButton) {
            const answerId = activeButton.getAttribute("data-answer-id");
            if (answerId) {
                updateAnswerPanel(answerId);
            }
        }
    };

    questionButtons.forEach((button) => {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
            const answerId = button.getAttribute("data-answer-id");
            if (!answerId) {
                return;
            }

            if (mobileFaqQuery.matches) {
                showInlineAnswer(button);
                return;
            }

            setActiveButton(button);
            updateAnswerPanel(answerId);
        });
    });

    if (mobileFaqQuery.addEventListener) {
        mobileFaqQuery.addEventListener("change", syncFaqMode);
    } else if (mobileFaqQuery.addListener) {
        mobileFaqQuery.addListener(syncFaqMode);
    }

    syncFaqMode();
});
