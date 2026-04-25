document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('flashcardForm');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const defaultDeckPaths = ['flashcards/flashcards.json', 'flashcards.json'];

    let fileDataUrl = null;

    function normalizeCard(card) {
        const now = new Date().toISOString();
        return {
            id: card.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            character: (card.character || '').trim(),
            pinyin: (card.pinyin || '').trim(),
            tags: Array.isArray(card.tags) ? card.tags.map(t => t.trim()).filter(Boolean) : String(card.tags || '').split(',').map(t => t.trim()).filter(Boolean),
            starred: Boolean(card.starred),
            media: card.media || '',
            createdAt: card.createdAt || now,
            lastReviewedAt: card.lastReviewedAt || null,
            dueAt: card.dueAt || now,
            correctCount: Number.isFinite(card.correctCount) ? card.correctCount : 0,
            wrongCount: Number.isFinite(card.wrongCount) ? card.wrongCount : 0,
            streak: Number.isFinite(card.streak) ? card.streak : 0,
            reviewHistory: Array.isArray(card.reviewHistory) ? card.reviewHistory : []
        };
    }

    async function fetchDefaultDeck() {
        for (const path of defaultDeckPaths) {
            try {
                const response = await fetch(path);
                if (!response.ok) continue;
                const data = await response.json();
                return data.flashcards || [];
            } catch (_) {
                // Continue to next known path.
            }
        }
        return [];
    }

    async function loadFlashcards() {
        const stored = localStorage.getItem('flashcards');
        if (stored) {
            try {
                const cards = JSON.parse(stored);
                if (!Array.isArray(cards)) throw new Error('Flashcards not array');
                return cards.map(normalizeCard);
            } catch (e) {
                console.error('Invalid flashcards in localStorage, clearing', e);
                localStorage.removeItem('flashcards');
            }
        }

        const cards = await fetchDefaultDeck();
        return cards.map(normalizeCard);
    }

    function saveFlashcards(cards) {
        localStorage.setItem('flashcards', JSON.stringify(cards));
        window.dispatchEvent(new CustomEvent('flashcardsUpdated', { detail: cards }));
    }

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

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const character = document.getElementById('newCharacter').value.trim();
        const pinyin = document.getElementById('newPinyin').value.trim();
        const tags = document.getElementById('newTags').value.trim();
        const starred = document.getElementById('newStarred').checked;

        if (!character || !pinyin) {
            alert('Please enter both character and pinyin');
            return;
        }

        const newCard = normalizeCard({
            character,
            pinyin,
            tags,
            starred,
            media: fileDataUrl || ''
        });

        const flashcards = await loadFlashcards();
        flashcards.push(newCard);
        saveFlashcards(flashcards);

        alert('Flashcard added to local set');
        form.reset();
        fileDataUrl = null;
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
    });
});
