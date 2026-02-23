document.addEventListener('DOMContentLoaded', function() {

    // Add header to beginning
    const header = document.createElement('header');
    header.innerHTML = `
        <nav>
            <ul>
                <li><a href="index.html">Drawing Tool</a></li>
            </ul>
        </nav>
    `;
    document.body.insertBefore(header, document.body.firstChild);
});