document.addEventListener('DOMContentLoaded', () => {
    const searchinput = document.getElementById("searchbar"); 
    const navbar = document.getElementById("navbarsearch");

    // Safety check: Only run if BOTH elements exist on this specific page
    if (searchinput && navbar) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If searchbar is scrolled past the top
                if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                    navbar.classList.remove('hidden'); 
                } else {
                    navbar.classList.add('hidden'); 
                }
            });
        }, { threshold: 0 }); 

        observer.observe(searchinput);
    } else {
        console.warn("Scroll observer skipped: Searchbar or Navbar missing from this page.");
    }
});