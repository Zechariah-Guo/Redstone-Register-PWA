# Website Overhaul - DETAILED IMPLEMENTATION PLAN

## Key Decisions
- Routes: `/` = homepage, `/catalogue` = catalogue page, `/faq` = FAQ page
- **Start with**: Phase 1 (file structure & routing first)
- New homepage: 1 hero section + 3 subsections:
  - Section 1: "Browse Catalogue" → links to `/catalogue` + "Back to Top" button
  - Section 2: "Learn & Explore" → links to `/faq#faq-section` (jumps to FAQ content on same page)
  - Section 3: "About Redstone Register" → links to `/faq` (goes to top of page, About section first)
  - This creates the perception of more pages by deeplinked sections within one unified FAQ page
- Navbar logo links to `/` (homepage)
- Dark mode: localStorage persistence (`theme-preference` key), defaults to light, darker variant (grey/charcoal, not pure black)
- FAQ: Single answer visible at a time (auto-collapse when opening new Q)
- Animations: Mixed (snappy/spring for buttons with Minecraft theme, smooth for panels)
- Layout: Single flexible layout.html for all pages with `{% if page_name %}` conditionals
- Mobile: Keep current design as fallback but enlarge/refactor elements
- Pinning: localStorage key `pinned-cards` with JSON array of card IDs

---

## PHASE 1: FILE STRUCTURE & NAMING

### 1a. Rename `static/js/script.js` → `static/js/catalogue.js`
- **What**: Terminal command `mv static/js/script.js static/js/catalogue.js`
- **Why**: Clarifies this JS is specific to catalogue page; allows separation of concerns
- **Affected**: Will need to update all template script references from `script.js` to `catalogue.js`

### 1b. Create `static/js/theme.js` (Dark mode toggle logic)
- **What**: New file with:
  - `initTheme()` function that reads localStorage and applies `.dark-mode` class to `<html>` or `<body>`
  - `toggleTheme()` function that switches class, saves preference to localStorage
  - Auto-detects system preference if no localStorage value exists (optional enhancement)
- **Function outline**:
  ```javascript
  function initTheme() {
    const saved = localStorage.getItem('theme-preference') || 'light';
    applyTheme(saved);
  }
  
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  }
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  ```
- **Where called**: In base `layout.html` at top of `<head>` (runs before CSS applied)

### 1c. Create `static/js/pinning.js` (Card pinning system)
- **What**: New file with:
  - `initPinning()` function that loads pinned cards from localStorage on page load
  - `togglePin(cardId)` function that adds/removes from pinned set, saves to localStorage
  - `getPinnedCards()` helper that retrieves the JSON array
  - Event listeners for pin buttons
- **Data structure**: localStorage key `pinned-cards` stores JSON array: `["card-1", "card-5", "card-12"]`
- **Function outline**:
  ```javascript
  function initPinning() {
    const pinned = getPinnedCards();
    pinned.forEach(id => {
      document.getElementById(`card-${id}`).classList.add('is-pinned');
      // Update pin button state
    });
  }
  
  function togglePin(cardId) {
    let pinned = getPinnedCards();
    if (pinned.includes(cardId)) {
      pinned = pinned.filter(id => id !== cardId);
    } else {
      pinned.push(cardId);
    }
    localStorage.setItem('pinned-cards', JSON.stringify(pinned));
    // Update UI
  }
  
  function getPinnedCards() {
    return JSON.parse(localStorage.getItem('pinned-cards') || '[]');
  }
  ```
- **Where called**: In `catalogue.html` template (now ex-index.html)

### 1d. Create `static/js/faq.js` (FAQ page logic)
- **What**: New file with:
  - `initFAQ()` function that sets up event listeners on FAQ question buttons
  - `openAnswer(questionId)` function that:
    - Closes any currently open answer (slides out)
    - Opens the new answer in middle panel (slides in)
    - Updates active question styling
  - Single-open enforcement (only one answer visible at time)
- **Structure**: Questions are buttons with `data-answer-id="answer-1"`, middle panel is a div that gets populated with answer content

### 1e. Create `static/js/home.js` (Homepage interactions)
- **What**: New file with:
  - `initHomeButtons()` function for Minecraft button press effects
  - Handles the spring/squash animation on button click (press-down effect, then navigate)
  - Smooth scroll setup for content sections
- **Animation idea**: On click, apply `active` class that squashes button briefly, then navigates

---

## PHASE 2: FLASK ROUTING & TEMPLATES

### 2a. Modify `main.py` - Update route structure
- **Current routes** (assumed):
  - `@app.route('/')` serves index.html with catalogue content
  - Possibly `/about` and `/faq` as separate routes
  
- **New routes**:
  ```python
  @app.route('/')
  def home():
      return render_template('home.html', page_name='home')
  
  @app.route('/catalogue')
  def catalogue():
      # Current logic from existing '/' route
      content = database_manager.get_catalogue_data()
      search_query = request.args.get('search', '')
      return render_template('catalogue.html', content=content, search_query=search_query, page_name='catalogue')
  
  @app.route('/faq')
  def faq():
      faq_data = database_manager.get_faq_data()  # Assuming you fetch this from DB
      return render_template('faq.html', faqs=faq_data, page_name='faq')
  ```
- **Removed routes**:
  - Remove `/about` route (if exists)
  - Remove `/faq` route (if separate)
  - Move `/` to serve homepage instead

### 2b. Create `templates/home.html`
- **Structure**:
  ```html
  {% extends 'layout.html' %}
  {% block content %}
  <section class="home-hero">
    <img src="path/to/hero-image.png" alt="Hero" class="hero-image">
    <div class="hero-content">
      <h1 class="hero-title">Redstone Register</h1>
    </div>
  </section>
  
  <section class="home-section">
    <img src="path/to/section1-image.png" alt="" class="section-image">
    <div class="section-content">
      <h2>Section 1 Title</h2>
      <p>PLACEHOLDER: Section 1 description</p>
      <a href="/catalogue" class="minecraft-button">Visit Catalogue</a>
    </div>
  </section>
  
  <section class="home-section">
    <img src="path/to/section2-image.png" alt="" class="section-image">
    <div class="section-content">
      <h2>Section 2 Title (Earlier About Content)</h2>
      <p>PLACEHOLDER: About section content</p>
      <a href="/faq" class="minecraft-button">Learn More</a>
    </div>
  </section>
  
  <script src="static/js/home.js"></script>
  {% endblock %}
  ```

### 2c. Rename `templates/index.html` → `templates/catalogue.html`
- **Changes**:
  - Update script reference: `<script src="static/js/script.js"></script>` → `<script src="static/js/catalogue.js"></script>`
  - Add new script references: `<script src="static/js/theme.js"></script>`, `<script src="static/js/pinning.js"></script>`
  - Add pinned cards section before regular `.container`:
    ```html
    <div class="pinned-cards-section hidden" id="pinned-section">
      <h2 class="pinned-section-title">Pinned Components</h2>
      <div class="pinned-container" id="pinned-container">
        <!-- Dynamically populated by pinning.js -->
      </div>
    </div>
    ```
  - Keep all existing catalogue content

### 2d. Merge `templates/about.html` + `templates/faq.html` → new `templates/faq.html`
- **Structure**:
  ```html
  {% extends 'layout.html' %}
  {% block content %}
  
  <!-- About placeholder section at top -->
  <section class="about-section">
    <h1>About Redstone Register</h1>
    <p>PLACEHOLDER: About section content (previously from about.html)</p>
  </section>
  
  <!-- 3-column FAQ layout -->
  <div class="faq-container">
    <!-- Left column: Questions -->
    <div class="faq-questions-column">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-questions-list">
        {% for faq in faqs %}
          <button class="faq-question" data-answer-id="{{ faq.id }}">
            {{ faq.question }}
          </button>
        {% endfor %}
      </div>
    </div>
    
    <!-- Middle column: Answer panel (slides in) -->
    <div class="faq-answer-panel">
      <div class="faq-answer-content" id="answer-panel">
        <p class="faq-placeholder">Select a question to see the answer</p>
      </div>
    </div>
    
    <!-- Right column: Wiki links (sticky) -->
    <div class="faq-wiki-column">
      <h3>Learning Resources</h3>
      <div class="faq-wiki-links">
        {% for faq in faqs %}
          <a href="{{ faq.wiki_url }}" target="_blank" rel="noopener" class="wiki-link" data-question-id="{{ faq.id }}">
            {{ faq.wiki_title }}
          </a>
        {% endfor %}
      </div>
    </div>
  </div>
  
  <script src="static/js/faq.js"></script>
  {% endblock %}
  ```
- **Delete**: Remove `templates/about.html` completely
- **Update nav**: Remove "About" link, keep only "Home", "Catalogue", "FAQ"

### 2e. Update `templates/layout.html`
- **Changes**:
  - Add `page_name` variable handling for conditional content
  - Update nav links to new routes:
    ```html
    <a href="/" class="nav-link">Home</a>
    <a href="/catalogue" class="nav-link">Catalogue</a>
    <a href="/faq" class="nav-link">FAQ</a>
    ```
  - Add settings/cog button before closing nav (details in Phase 4)
  - Add theme.js script at very top of page
  - Add conditional loading of page-specific JS
  - Logo should link to `/` (homepage)

---

## PHASE 3: CSS REFACTORING (THEMING)

### 3a. Create `static/css/theme-variables.css`
- **What**: New file defining CSS custom properties for light/dark modes
- **Light mode defaults** (applied to `[data-theme="light"]`):
  ```css
  :root[data-theme="light"],
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-tertiary: #ececec;
    --text-primary: #1a1a1a;
    --text-secondary: #555555;
    --border-color: #ddd;
    --navbar-bg: rgba(255, 255, 255, 0.8);
    --card-bg: #ffffff;
    --card-shadow: rgba(0, 0, 0, 0.1);
    --modal-overlay: rgba(0, 0, 0, 0.5);
    --accent-color: #dc011d; /* Red from existing design */
  }
  ```
- **Dark mode** (applied to `[data-theme="dark"]`):
  ```css
  :root[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #3a3a3a;
    --text-primary: #f0f0f0;
    --text-secondary: #b0b0b0;
    --border-color: #444;
    --navbar-bg: rgba(32, 32, 32, 0.9);
    --card-bg: #2a2a2a;
    --card-shadow: rgba(0, 0, 0, 0.4);
    --modal-overlay: rgba(0, 0, 0, 0.8);
    --accent-color: #ff4444; /* Lighter red for dark mode */
  }
  ```
- **Linked in layout.html** before main style.css

### 3b. Refactor `static/css/style.css` - Replace hard-coded greys with variables
- **Changes**:
  - Replace all `background: #[grey values]` with `background: var(--bg-primary)` or appropriate var
  - Replace all `color: #[grey values]` with `color: var(--text-primary)` etc
  - Replace all `box-shadow` colours with `var(--card-shadow)`
  - Replace `border` colours with `var(--border-color)`
  - Keep non-colour properties (padding, font-size, etc) unchanged
  - Specific replacements:
    - `background: grey;` → `background: var(--bg-primary);`
    - `background: rgba(128, 128, 128, 0.5);` → `background: var(--navbar-bg);`
    - All card backgrounds → `background: var(--card-bg);`
    - All text colours → appropriate text variable
    
### 3c. Create `static/css/dark-mode.css` (optional overrides)
- **What**: Additional dark-mode-specific rules if needed
- **Examples**:
  - Image brightness adjustment for dark mode: `filter: brightness(0.9);`
  - Special hover states that differ from light mode
  - Font-weight adjustments for readability in dark mode

### 3d. Dark mode class application
- **Option**: Use `[data-theme="dark"]` attribute on root element (already in theme.js)
- **Or**: Apply `.dark-mode` class to `<html>` element and use `.dark-mode` selectors
- **Implementation**: Use attribute selector `[data-theme="dark"]` for cleaner CSS

### 3e. Settings cog button styling
- **HTML**: Added in Phase 4
- **CSS** (to add to style.css):
  ```css
  .theme-toggle-button {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: background-color 0.2s ease;
    margin-left: auto;
  }
  
  .theme-toggle-button:hover {
    background-color: var(--bg-secondary);
  }
  
  .theme-toggle-button .material-symbols-outlined {
    color: var(--text-primary);
  }
  ```

---

## PHASE 4: NAVBAR UPDATES

### 4a. Add settings/cog icon button to navbar in `templates/layout.html`
- **HTML**:
  ```html
  <nav>
    <!-- Existing nav content -->
    
    <button id="theme-toggle" class="theme-toggle-button" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">
      <span class="material-symbols-outlined">settings</span>
    </button>
  </nav>
  ```
- **Position**: Right side of navbar, after all other content (before closing `</nav>`)
- **Icon**: Uses `settings` from Material Symbols (add to font link if not present)

### 4b. Wire up dark mode toggle in JavaScript
- **New code in theme.js**:
  ```javascript
  document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
    }
  });
  ```
- **Called from**: layout.html inline script or as part of theme.js

### 4c. Update nav links in `templates/layout.html`
- **Current links** (if they exist): Update to new routes
- **Links to add**:
  ```html
  <a href="/" class="topnav-link nav-link">Home</a>
  <a href="/catalogue" class="topnav-link nav-link">Catalogue</a>
  <a href="/faq" class="topnav-link nav-link">FAQ</a>
  ```
- **Remove**: Any "About" link if present

---

## PHASE 5: CATALOGUE PAGE REDESIGN

### 5a. Enlarge cards in catalogue.html and style.css - Adjust grid to 3 per column
- **CSS changes**:
  - Current grid (assumed): Change from `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` to `repeat(3, 1fr)` or similar
  - Width adjustment: Cards should be larger: ~350px+ width per column area
  - Remove auto-fit, use fixed 3-column grid on desktop
  - Mobile breakpoint: Switch to 1-2 columns on smaller screens
  ```css
  .container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem; /* Increase from likely 1rem */
  }
  
  @media (max-width: 1200px) {
    .container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    .container {
      grid-template-columns: 1fr;
    }
  }
  ```

### 5b. Increase padding, gaps, text sizes in cards
- **Card (.card) changes**:
  - `padding`: Increase from ~15px to ~25-30px
  - `gap`: Between icon/title increase to 1rem
  - `border-radius`: Keep or increase slightly (~12px)
  - `box-shadow`: Make slightly more prominent
  
- **Text sizing**:
  - `.card-name` (h1): Increase font-size from ~1.2rem to ~1.5rem
  - `.rating-label`: Increase from ~0.9rem to ~1rem
  - `.rating-segment`: Make slightly larger to match
  
- **Image sizing**:
  - `.card-image`: Increase height (currently assumed ~150px → ~200-220px)

### 5c. Redesign modal - 90% screen space, horizontal layout
- **CSS (.details-modal, .details-dialog)**:
  - `.details-dialog`: 
    - Width: 90vw (90% viewport width) instead of smaller value
    - Height: 90vh (90% viewport height)
    - Max-width: 1400px (to prevent too-wide on ultrawide monitors)
    - Display: Change from vertical flex to horizontal: `flex-direction: row;` with equal columns
  - Remove old bottom-positioned styling
  - Center on screen: `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);`

### 5d. Spread component info horizontally in modal
- **Details columns layout** (in catalogue.html):
  ```html
  <section class="details-column details-column-left">
    <!-- Image on left, larger -->
  </section>
  
  <section class="details-column details-column-right">
    <!-- All info stacked on right: name, category, descriptions, recipe -->
  </section>
  ```
- **CSS for new layout**:
  ```css
  .details-column-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .details-main-image {
    width: 100%;
    height: auto;
    max-width: 400px;
  }
  
  .details-rating-block {
    margin-top: 1.5rem;
  }
  
  .details-column-right {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .details-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  ```

### 5e. Add pin button to cards (on hover)
- **HTML in catalogue.html** (add to each `.card`):
  ```html
  <button class="pin-button" data-card-id="{{ row[0] }}" aria-label="Pin this component" type="button">
    <span class="material-symbols-outlined">push_pin</span>
  </button>
  ```
  - Position: Absolute, top-right of card
  - Visibility: Hidden by default, shown on card hover

- **CSS**:
  ```css
  .card {
    position: relative;
  }
  
  .pin-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border: none;
    background: var(--accent-color);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 10;
  }
  
  .card:hover .pin-button {
    opacity: 1;
  }
  
  .pin-button:hover {
    transform: scale(1.1);
  }
  
  .pin-button.is-pinned {
    background: #FFD700; /* Gold for pinned state */
    opacity: 1;
  }
  ```

### 5f. Create pinned cards section above regular cards
- **HTML in catalogue.html** (before `.container`):
  ```html
  <div class="pinned-cards-section hidden" id="pinned-section">
    <h2 class="pinned-section-title">Pinned Components</h2>
    <div class="pinned-container" id="pinned-container">
      <!-- Dynamically populated by pinning.js -->
    </div>
  </div>
  ```
- **CSS**:
  ```css
  .pinned-cards-section {
    margin: 2rem 0;
    padding: 2rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    border-left: 4px solid var(--accent-color);
  }
  
  .pinned-cards-section.hidden {
    display: none;
  }
  
  .pinned-section-title {
    margin-bottom: 1.5rem;
    color: var(--text-primary);
  }
  
  .pinned-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  ```
- Style pinned cards similarly to regular cards but with gold accent

### 5g. Implement pinning logic in pinning.js
- **Already outlined in Phase 1c**, needs to:
  - Listen for `.pin-button` clicks
  - Call `togglePin(cardId)` handler
  - Update UI: Add/remove `is-pinned` class, toggle button appearance
  - Move pinned cards to pinned section (clone or move DOM element)
  - Show/hide pinned section based on whether any cards are pinned

### 5h. Add pin persistence to localStorage
- **Already in Phase 1c pinning.js**
- **Refresh logic**: On page load, `initPinning()` restores pinned state from localStorage
- **No cross-filtering**: Pinned cards still respect active filters (pinned cards not shown if filters exclude them)

### 5i. Add animations: card hover, modal slide-in, pin button
- **Card hover animation**:
  ```css
  .card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px var(--card-shadow);
  }
  ```
  
- **Modal slide-in**:
  ```css
  .details-modal.is-open .details-dialog {
    animation: slideInModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes slideInModal {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  ```
  
- **Pin button animation**:
  ```css
  .pin-button.is-pinned {
    animation: pinPulse 0.4s ease;
  }
  
  @keyframes pinPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  ```

---

## PHASE 6: FAQ PAGE REDESIGN

### 6a. Create 3-column layout (questions, answers panel, wiki links)
- **Layout structure in faq.html** (already outlined in Phase 2d):
  - Left: List of question buttons (scrollable if needed)
  - Middle: Answer content panel (slides in/out)
  - Right: Wiki links (sticky positioning)
  - **Important**: Add `id="faq-section"` to the main FAQ container for anchor link `/faq#faq-section` or from homepage `#faq-section`
  
- **HTML structure**:
  ```html
  {% extends 'layout.html' %}
  {% block content %}
  
  <section class="about-section">
    <h1>About Redstone Register</h1>
    <p>PLACEHOLDER: About section content...</p>
  </section>
  
  <div class="faq-container" id="faq-section">
    <!-- 3-column layout goes here -->
  </div>
  
  <script src="static/js/faq.js"></script>
  {% endblock %}
  ```
  
- **CSS for layout**:
  ```css
  .faq-container {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 2rem;
    padding: 2rem;
    min-height: calc(100vh - 200px);
  }
  
  .faq-questions-column {
    overflow-y: auto;
    padding-right: 1rem;
  }
  
  .faq-answer-panel {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px var(--card-shadow);
  }
  
  .faq-wiki-column {
    position: sticky;
    top: 80px;
    height: fit-content;
  }
  ```

### 6b. Convert expandable answers → middle panel slides
- **Button structure in faq.html**:
  ```html
  <button class="faq-question" data-answer-id="answer-1" type="button">
    Question text here
  </button>
  ```
  
- **Answer content** (hidden initially):
  ```html
  <div class="faq-answer-content" id="answer-1" hidden>
    <h3>Question Title</h3>
    <p>Answer text here</p>
  </div>
  ```

- **JavaScript in faq.js**:
  ```javascript
  function openAnswer(answerId) {
    // Hide previous answer
    const previousAnswer = document.querySelector('.faq-answer-content:not([hidden])');
    if (previousAnswer) {
      previousAnswer.classList.remove('is-visible');
      previousAnswer.setAttribute('hidden', '');
    }
    
    // Show new answer
    const newAnswer = document.getElementById(answerId);
    if (newAnswer) {
      newAnswer.removeAttribute('hidden');
      newAnswer.classList.add('is-visible');
      updateWikiLinksForAnswer(answerId);
    }
  }
  ```

### 6c. Move wiki links to right column (sticky)
- **HTML in faq.html**:
  ```html
  <div class="faq-wiki-column">
    <h3>Related Resources</h3>
    <div class="wiki-links-container">
      {% for faq in faqs %}
        <a href="{{ faq.wiki_url }}" target="_blank" class="wiki-link" data-answer-id="{{ faq.id }}">
          {{ faq.wiki_title }}
        </a>
      {% endfor %}
    </div>
  </div>
  ```

- **CSS**:
  ```css
  .faq-wiki-column {
    position: sticky;
    top: 100px;
    max-height: calc(100vh - 150px);
    overflow-y: auto;
  }
  
  .wiki-link {
    display: block;
    padding: 0.75rem;
    margin: 0.5rem 0;
    background: var(--bg-secondary);
    border-left: 3px solid transparent;
    border-radius: 4px;
    text-decoration: none;
    color: var(--text-primary);
    transition: border-color 0.2s, background-color 0.2s;
  }
  
  .wiki-link:hover {
    background: var(--bg-tertiary);
    border-left-color: var(--accent-color);
  }
  ```

### 6d. Add placeholder text for About section content
- **HTML in faq.html** (at top, before FAQ section):
  ```html
  <section class="about-section">
    <h1>About Redstone Register</h1>
    <p>PLACEHOLDER TEXT: This section will contain information about Redstone Register's purpose, history, and mission. Detailed About content goes here.</p>
  </section>
  ```

### 6e. Implement single-answer-open logic in faq.js
- **Already outlined above in 6b**
- **Event listeners**:
  ```javascript
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const answerId = button.getAttribute('data-answer-id');
      openAnswer(answerId);
      button.classList.add('is-active');
    });
  });
  ```

### 6f. Add slide-in animation for answers
- **CSS animations**:
  ```css
  .faq-answer-content {
    min-height: 300px;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: opacity 0.3s ease, max-height 0.3s ease;
  }
  
  .faq-answer-content.is-visible {
    opacity: 1;
    max-height: 1000px;
  }
  ```

### 6g. Mobile fallback handling
- **Breakpoint (~768px)**:
  ```css
  @media (max-width: 768px) {
    .faq-container {
      grid-template-columns: 1fr;
    }
    
    .faq-wiki-column {
      position: static;
      margin-top: 2rem;
    }
    
    .faq-answer-panel {
      order: 2;
    }
  }
  ```

---

## PHASE 7: HOMEPAGE BUILD

### 7a. Create hero section (image + large title)
- **HTML in home.html**:
  ```html
  <section class="home-hero">
    <img src="static/images/hero-image.png" alt="Redstone Register Hero" class="hero-image">
    <div class="hero-overlay">
      <h1 class="hero-title">Redstone Register</h1>
      <p class="hero-subtitle">The Complete Redstone Component Catalogue</p>
    </div>
  </section>
  ```

- **CSS (.home-hero)**:
  ```css
  .home-hero {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .hero-image {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
  }
  
  .hero-overlay {
    position: absolute;
    z-index: 2;
    text-align: center;
    color: white;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
  }
  
  .hero-title {
    font-size: 4rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  
  .hero-subtitle {
    font-size: 1.5rem;
    margin: 0;
  }
  ```

## PHASE 7: HOMEPAGE BUILD

### 7a. Create hero section (image + large title)
- **HTML in home.html**:
  ```html
  <section class="home-hero" id="home">
    <img src="static/images/hero-image.png" alt="Redstone Register Hero" class="hero-image">
    <div class="hero-overlay">
      <h1 class="hero-title">Redstone Register</h1>
      <p class="hero-subtitle">The Complete Redstone Component Catalogue</p>
    </div>
  </section>
  ```
- Note: `id="home"` for anchor link to scroll back to top

### 7b. Create 3 scrollable content sections (image + text + link)
- **Section 1: Browse Catalogue**
  ```html
  <section class="home-section home-section-1">
    <img src="static/images/section1-image.png" alt="Catalogue showcase" class="section-image">
    <div class="section-content">
      <h2>Browse Our Catalogue</h2>
      <p>PLACEHOLDER: Explore our comprehensive collection of redstone components. From power sources to complex mechanisms, find everything you need with advanced filtering and search capabilities.</p>
      <a href="/catalogue" class="minecraft-button">Visit Catalogue</a>
    </div>
  </section>
  ```

- **Section 2: Learn & Explore (Links to FAQ section)**
  ```html
  <section class="home-section home-section-2">
    <div class="section-content">
      <h2>Learn & Explore</h2>
      <p>PLACEHOLDER: Discover FAQs, guides, and answers to common questions about redstone mechanics. Whether you're a beginner or advanced tinkerer, we have resources to help you succeed.</p>
      <a href="/faq#faq-section" class="minecraft-button">View FAQ</a>
    </div>
    <img src="static/images/section2-image.png" alt="Learning resources" class="section-image">
  </section>
  ```

- **Section 3: About Redstone Register (Links to top of FAQ page)**
  ```html
  <section class="home-section home-section-3">
    <img src="static/images/section3-image.png" alt="About Redstone Register" class="section-image">
    <div class="section-content">
      <h2>About Redstone Register</h2>
      <p>PLACEHOLDER: Learn about Redstone Register's mission to provide the most comprehensive, up-to-date resource for redstone enthusiasts worldwide. We're committed to clarity, accuracy, and accessibility.</p>
      <a href="/faq" class="minecraft-button">Read Our Story</a>
    </div>
  </section>
  ```

- **CSS for sections** (same as detailed plan):
  ```css
  .home-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
    padding: 4rem 2rem;
    min-height: 600px;
  }
  
  .home-section-2 {
    grid-template-columns: 1fr 1fr;
  }
  
  .home-section-2 .section-image {
    order: 2;
  }
  
  .home-section-2 .section-content {
    order: 1;
  }
  
  .home-section-3 {
    grid-template-columns: 1fr 1fr;
  }
  
  .section-image {
    width: 100%;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  .section-content {
    padding: 2rem;
  }
  
  .section-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  .section-content p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 1024px) {
    .home-section {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
  ```

### 7c. Add Minecraft button styling (box-shadow, spring animation on press)
- **As per detailed plan** (unchanged)

### 7d. Implement smooth scroll transitions
- **As per detailed plan**: `scroll-behavior: smooth;` on html element

### 7e. Add parallax or subtle animations to hero
- **As per detailed plan** (unchanged)

---

## NAVBAR LOGO UPDATE (Phase 4)

### Update navbar logo href
- **In layout.html navbar**:
  ```html
  <a href="/" class="navbar-logo">
    <img src="static/images/logo.png" alt="Redstone Register Home" class="logo-image">
  </a>
  ```
- **Ensure logo links to `/` (homepage), not `/catalogue`**
- This applies to all pages (home, catalogue, faq)

### 7c. Add Minecraft button styling (box-shadow, spring animation on press)
- **HTML button structure**:
  ```html
  <a href="/catalogue" class="minecraft-button">Browse Catalogue</a>
  ```
  
- **CSS (.minecraft-button)**:
  ```css
  .minecraft-button {
    display: inline-block;
    padding: 15px 40px;
    background: linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    border: 3px solid #1B5E20;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: transform 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.1s;
    position: relative;
  }
  
  .minecraft-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(46, 125, 50, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  .minecraft-button:active {
    transform: translateY(2px) scaleY(0.95);
    box-shadow: 0 2px 4px rgba(46, 125, 50, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .minecraft-button {
      transition: none;
    }
    
    .minecraft-button:active {
      transform: none;
    }
  }
  ```

- **JavaScript in home.js** (optional additional animation):
  ```javascript
  document.querySelectorAll('.minecraft-button').forEach(button => {
    button.addEventListener('click', (e) => {
      // Let the CSS animation handle it; optional additional logic here
    });
  });
  ```

### 7d. Implement smooth scroll transitions
- **CSS**:
  ```css
  html {
    scroll-behavior: smooth;
  }
  ```

### 7e. Add parallax or subtle animations to hero
- **Parallax effect on hero image** (using background-attachment):
  ```css
  .home-hero {
    background-attachment: fixed;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  ```
  
- **Or fade-in animation on sections as they enter viewport**:
  ```css
  .home-section {
    opacity: 0;
    transform: translateY(30px);
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .home-section-1 {
    animation-delay: 0.2s;
  }
  
  .home-section-2 {
    animation-delay: 0.4s;
  }
  
  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```

---

## PHASE 8: ANIMATION IMPLEMENTATION

### 8a. Card hover effects (catalogue)
- **Already outlined in Phase 5i**
- Implementation: Lift card on hover with shadow change

### 8b. Modal transition (slide/fade in)
- **Already outlined in Phase 5i**
- Implementation: Slide from center with spring easing

### 8c. Minecraft button press effect (spring)
- **Already outlined in Phase 7c**
- Implementation: Active state with cubic-bezier easing function

### 8d. FAQ answer panel slide
- **Already outlined in Phase 6f**
- Implementation: Max-height + opacity transition

### 8e. Pin button animation
- **Already outlined in Phase 5i**
- Implementation: Scale pulse on pin action

### 8f. Filter/menu smooth transitions
- **Add to existing code**:
  ```css
  .filters-panel {
    transition: all 0.3s ease;
  }
  
  .filters-panel.hidden {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
  }
  
  .sort-menu {
    transition: all 0.2s ease;
  }
  
  .sort-menu.hidden {
    opacity: 0;
    pointer-events: none;
  }
  ```

---

## PHASE 9: MOBILE OPTIMIZATION

### 9a. Add mobile-specific breakpoints
- **Breakpoints to use**:
  - 1200px: Large desktop
  - 1024px: Desktop / tablet landscape
  - 768px: Tablet / small desktop
  - 480px: Mobile
  
- **Key changes at 768px and below**:
  - Catalogue grid: 2 columns at 768px, 1 column at 480px
  - FAQ layout: Stack to single column
  - Homepage sections: Stack to single column
  - Font sizes: Scale down proportionally

### 9b. Maintain current portrait-optimised design where needed
- **Mobile catalogue view**: Keep cards compact but leverage larger canvas
- **Navbar**: Keep burger menu on mobile
- **Modal**: On mobile (< 768px), use full-screen modal instead of 90% screen

### 9c. Test responsive behaviour at various sizes
- Not doing in this phase, will be in Phase 11

### 9d. Adjust text sizes for smaller screens
- **Example adjustments**:
  ```css
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }
    
    .card-name {
      font-size: 1.2rem;
    }
    
    .section-content h2 {
      font-size: 1.8rem;
    }
  }
  ```

---

## PHASE 10: DARK MODE REFINEMENT

### 10a. Test theme switching across all pages
- **Manual testing**: Click theme toggle on each page, verify:
  - All backgrounds switch to dark theme colours
  - All text remains readable (contrast check)
  - Navigation looks good
  - Cards/modals display correctly

### 10b. Ensure images/icons look good in both modes
- **Images**: May need brightness adjustments in dark mode
  ```css
  [data-theme="dark"] .section-image {
    filter: brightness(0.9);
  }
  ```
- **Icons**: Material Symbols should inherit text colour (colour: var(--text-primary)), should work fine

### 10c. Verify colour contrast for accessibility
- **WCAG AA standard**: 4.5:1 for normal text, 3:1 for large text
- Use tools like WebAIM Contrast Checker to verify all colour combinations

### 10d. Test pinning persistence across theme changes
- **Test scenario**: Pin a card in light mode → Switch to dark mode → Pinned card should remain pinned and visible
- **Test scenario**: Pin a card → Refresh page → Card should still be pinned
- **Test scenario**: Pin a card in dark mode → LocalStorage should persist across all themes

---

## PHASE 11: TESTING & POLISH

### 11a. Cross-browser testing
- **Browsers**: Chrome, Firefox, Safari (if on Mac), Edge
- **Test cases**:
  - Navigation works on all pages
  - Theme switching works
  - Pinning/unpinning works
  - FAQ answer sliding works
  - Modal expands/closes correctly
  - Responsive breakpoints trigger correctly

### 11b. Performance check
- **Lighthouse audit**: Run in DevTools
- **Check**:
  - No console errors
  - Images optimized
  - CSS/JS loaded efficiently
  - No memory leaks from event listeners
  - Animations run smoothly (60fps where possible)

### 11c. Accessibility audit
- **Screen reader testing** (if possible): Navs, buttons, modals are announced correctly
- **Keyboard navigation**: All interactive elements accessible via Tab
- **Focus indicators**: Visible focus rings on all buttons
- **Colour contrast**: Verified in Phase 10c

### 11d. Final animation tweaks
- **Fine-tune timings**:
  - Modal slide: Maybe 0.4s instead of 0.3s?
  - Card hover: Maybe 0.15s instead of 0.2s?
  - Answer slide: Adjust max-height value if needed
- **Ensure animations respect prefers-reduced-motion**
