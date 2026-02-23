document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('flashcardForm');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');

    let fileDataUrl = null;
    let flashcards = [];

    function loadFlashcards() {
        const stored = localStorage.getItem('flashcards');
        if (stored) {
            try {
                flashcards = JSON.parse(stored);
                return Promise.resolve(flashcards);
            } catch (e) {
                console.error('Invalid flashcards in localStorage, clearing', e);
                localStorage.removeItem('flashcards');
            }
        }
        return fetch('flashcards.json')
            .then(r => r.json())
            .then(data => {
                flashcards = data.flashcards || [];
                return flashcards;
            })
            .catch(() => {
                flashcards = [];
                return flashcards;
            });
    }

    loadFlashcards();

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) {
                fileDataUrl = null;
                if (preview) preview.style.display = 'none';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                fileDataUrl = reader.result;
                if (preview && f.type.startsWith('image')) {
                    preview.src = fileDataUrl;
                    preview.style.display = 'block';
                }
            };
            reader.readAsDataURL(f);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const character = document.getElementById('newCharacter').value.trim();
        const pinyin = document.getElementById('newPinyin').value.trim();
        if (!character) {
            alert('Please enter a character');
            return;
        }

        const newCard = { character, pinyin, media: fileDataUrl || null };

        await loadFlashcards();
        flashcards.push(newCard);
        localStorage.setItem('flashcards', JSON.stringify(flashcards));

        // Notify other scripts/pages in this window about the update
        try {
            window.dispatchEvent(new CustomEvent('flashcardsUpdated', { detail: flashcards }));
        } catch (e) {
            console.warn('Could not dispatch flashcardsUpdated event', e);
        }

        alert('Flashcard added to local set');
        form.reset();
        fileDataUrl = null;
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
    });

});
