document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('deckLoadList');

    // Array of flashcard file paths to display
    const flashcardFiles = [
        { name: 'HSK Level 1', path: 'flashcards/flashcards.json' },
        { name: 'Empty Flashcard Set', path: 'flashcards/emptyFile.json' },
        { name: 'Week 12 Flashcards', path: 'flashcards/week12.json' }
    ];

    // Clear existing content
    list.innerHTML = '';

    // Create buttons for each flashcard file
    flashcardFiles.forEach(file => {
        const li = document.createElement('li');
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.alignItems = 'center';

        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load';
        loadButton.onclick = () => loadFlashcardSet(file.path);
        loadButton.style.flex = '1';

        container.appendChild(loadButton);
        li.appendChild(document.createTextNode(file.name + ': '));
        li.appendChild(container);
        list.appendChild(li);
    });
});

// Function to load a flashcard set and switch to it
async function loadFlashcardSet(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}`);
        }
        const data = await response.json();
        const flashcards = data.flashcards || data;

        // Store the loaded flashcards in localStorage
        localStorage.setItem('flashcards', JSON.stringify(flashcards));

        // Navigate to the main page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error loading flashcard set:', error);
        alert('Failed to load flashcard set: ' + error.message);
    }
}