document.addEventListener('DOMContentLoaded', function() {

    // Add header to beginning
    const header = document.createElement('header');
    header.innerHTML = `
        <nav>
            <ul>
                <li><a href="index.html">Drawing Tool</a></li>
                <li><a href="flashcard_create.html">Create Flashcard</a></li>
            </ul>
        </nav>
        <h1>My Website</h1>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    // Add footer to end
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <p>&copy; 2024 My Website. All rights reserved.</p>
    `;
    document.body.appendChild(footer);
});