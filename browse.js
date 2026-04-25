document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('deckLoadList');
    if (!list) return;

    const flashcardFiles = [
        { name: 'HSK Level 1', path: 'flashcards/flashcards.json' },
        { name: 'Empty Flashcard Set', path: 'flashcards/emptyFile.json' },
        { name: 'Week 12 Flashcards', path: 'flashcards/week12.json' }
    ];

    list.innerHTML = '';

    flashcardFiles.forEach((file) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.gap = '10px';

        const nameLabel = document.createElement('span');
        nameLabel.textContent = file.name;

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.alignItems = 'center';

        const countLabel = document.createElement('span');
        countLabel.textContent = 'Checking...';
        countLabel.style.color = 'var(--muted)';
        countLabel.style.fontSize = '0.9rem';

        fetch(file.path)
            .then((response) => response.json())
            .then((data) => {
                const cards = data.flashcards || data || [];
                countLabel.textContent = `${cards.length} cards`;
            })
            .catch(() => {
                countLabel.textContent = 'Unavailable';
            });

        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load';
        loadButton.type = 'button';
        loadButton.onclick = () => loadFlashcardSet(file.path);

        container.appendChild(countLabel);
        container.appendChild(loadButton);
        li.appendChild(nameLabel);
        li.appendChild(container);
        list.appendChild(li);
    });
});

async function loadFlashcardSet(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}`);
        }
        const data = await response.json();
        const flashcards = data.flashcards || data;

        localStorage.setItem('flashcards', JSON.stringify(flashcards));
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error loading flashcard set:', error);
        alert('Failed to load flashcard set: ' + error.message);
    }
}
