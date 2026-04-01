document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const display = document.getElementById('characterDisplay');
    const pinyinDisplay = document.getElementById('pinyinDisplay');
    const container = document.getElementById('container');

    let dpr;

    let showCharacter = false;
    let activeIndex = 0;
    let flashcards = [];

    const themeToggle = document.getElementById('themeToggle');

    function normalizeCard(card) {
        const now = new Date().toISOString();
        return {
            id: card.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            character: (card.character || '').trim(),
            pinyin: (card.pinyin || '').trim(),
            tags: Array.isArray(card.tags)
                ? card.tags.map((t) => t.trim()).filter(Boolean)
                : String(card.tags || '')
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
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

    function loadFlashcardsFromStorage() {
        const stored = localStorage.getItem('flashcards');
        if (stored) {
            try {
                const items = JSON.parse(stored);
                if (!Array.isArray(items)) throw new Error('Invalid flashcards data');
                flashcards = items.map(normalizeCard);
                return;
            } catch (err) {
                console.warn('Failed to parse stored flashcards', err);
                localStorage.removeItem('flashcards');
            }
        }
        fetch('flashcards.json')
            .then((res) => res.json())
            .then((data) => {
                const items = data.flashcards || [];
                flashcards = items.map(normalizeCard);
                if (flashcards.length && activeIndex >= flashcards.length) activeIndex = flashcards.length - 1;
                updateUI();
            })
            .catch((err) => {
                console.error('Failed to load default flashcards', err);
                flashcards = [];
                updateUI();
            });
    }

    function saveFlashcards() {
        localStorage.setItem('flashcards', JSON.stringify(flashcards));
        window.dispatchEvent(new CustomEvent('flashcardsUpdated', { detail: flashcards }));
    }

    function getActiveCard() {
        if (!flashcards.length) return null;
        activeIndex = Math.min(activeIndex, flashcards.length - 1);
        activeIndex = Math.max(activeIndex, 0);
        return flashcards[activeIndex];
    }

    function getFilteredCards() {
        const filter = document.getElementById('filterSelect').value;
        const search = document.getElementById('searchInput').value.trim().toLowerCase();
        const tagQuery = document.getElementById('tagFilter').value.trim().toLowerCase();

        const now = Date.now();

        return flashcards
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => {
                if (filter === 'due' && new Date(card.dueAt).getTime() > now) return false;
                if (filter === 'missed' && card.wrongCount === 0) return false;
                if (filter === 'starred' && !card.starred) return false;
                if (filter === 'recent' && Date.now() - new Date(card.createdAt).getTime() > 1000 * 60 * 60 * 24 * 7) return false;
                if (search && !`${card.character} ${card.pinyin}`.toLowerCase().includes(search)) return false;
                if (tagQuery && !card.tags.some((t) => t.toLowerCase().includes(tagQuery))) return false;
                return true;
            });
    }

    function renderFlashcardList() {
        const listEl = document.getElementById('flashcardList');
        if (!listEl) return;

        const filtered = getFilteredCards();
        listEl.innerHTML = '';

        if (filtered.length === 0) {
            const placeholder = document.createElement('li');
            placeholder.textContent = 'No cards match current filters/search.';
            listEl.appendChild(placeholder);
            return;
        }

        filtered.forEach(({ card, idx }) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '6px 8px';
            li.style.borderBottom = '1px solid #ddd';
            if (idx === activeIndex) {
                li.style.background = 'rgba(47, 156, 149, 0.1)';
            }

            const text = document.createElement('span');
            text.style.flex = '1';
            text.textContent = `${card.character || '(no char)'} — ${card.pinyin || '(no pinyin)'} [${card.tags.join(', ')}]`;

            const actionGroup = document.createElement('div');
            actionGroup.style.display = 'flex';
            actionGroup.style.gap = '6px';

            const selectBtn = document.createElement('button');
            selectBtn.textContent = 'Select';
            selectBtn.onclick = () => {
                activeIndex = idx;
                updateUI();
            };

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => {
                activeIndex = idx;
                populateEditor(card);
                updateUI();
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => {
                if (confirm('Delete this card?')) {
                    flashcards.splice(idx, 1);
                    if (activeIndex >= flashcards.length) activeIndex = Math.max(flashcards.length - 1, 0);
                    saveFlashcards();
                    updateUI();
                }
            };

            actionGroup.append(selectBtn, editBtn, deleteBtn);
            li.append(text, actionGroup);
            listEl.appendChild(li);
        });
    }

    function populateEditor(card) {
        if (!card) return;
        document.getElementById('editCardId').value = card.id;
        document.getElementById('editCharacter').value = card.character;
        document.getElementById('editPinyin').value = card.pinyin;
        document.getElementById('editTags').value = card.tags.join(', ');
        document.getElementById('editStarred').checked = card.starred;
    }

    function applyEditorSave() {
        const id = document.getElementById('editCardId').value;
        if (!id) {
            alert('No card selected to save. Use Select/Edit first.');
            return;
        }
        const card = flashcards.find((c) => c.id === id);
        if (!card) {
            alert('Selected card not found');
            return;
        }

        card.character = document.getElementById('editCharacter').value.trim();
        card.pinyin = document.getElementById('editPinyin').value.trim();
        card.tags = document.getElementById('editTags').value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        card.starred = document.getElementById('editStarred').checked;
        card.lastReviewedAt = new Date().toISOString();

        saveFlashcards();
        updateUI();
        alert('Card updated');
    }

    function applyCardReview(result) {
        const card = getActiveCard();
        if (!card) return;

        const now = new Date();
        const nowStr = now.toISOString();

        card.lastReviewedAt = nowStr;
        card.reviewHistory = card.reviewHistory || [];

        if (result === 'easy') {
            card.correctCount = (card.correctCount || 0) + 1;
            card.streak = (card.streak || 0) + 1;
            const intervalDays = Math.min(30, Math.pow(2, Math.max(0, card.streak - 1)));
            card.dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
            card.reviewHistory.push({ at: nowStr, result: 'easy', nextDueInDays: intervalDays });
        } else if (result === 'hard') {
            card.correctCount = (card.correctCount || 0) + 0;
            card.wrongCount = (card.wrongCount || 0) + 1;
            card.streak = Math.max(0, (card.streak || 0) - 1);
            card.dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            card.reviewHistory.push({ at: nowStr, result: 'hard', nextDueInDays: 1 });
        } else if (result === 'missed') {
            card.wrongCount = (card.wrongCount || 0) + 1;
            card.streak = 0;
            card.dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            card.reviewHistory.push({ at: nowStr, result: 'missed', nextDueInDays: 1 });
        }

        saveFlashcards();
        updateUI();
    }

    function updateStats() {
        const statsEl = document.getElementById('stats');
        if (!statsEl) return;

        const total = flashcards.length;
        const dueCount = flashcards.filter((c) => new Date(c.dueAt).getTime() <= Date.now()).length;
        const starred = flashcards.filter((c) => c.starred).length;
        const correct = flashcards.reduce((sum, c) => sum + (c.correctCount || 0), 0);
        const wrong = flashcards.reduce((sum, c) => sum + (c.wrongCount || 0), 0);
        const streak = getActiveCard()?.streak || 0;

        statsEl.textContent = `Total: ${total}, Due: ${dueCount}, Starred: ${starred}, Correct: ${correct}, Wrong: ${wrong}, Streak (active): ${streak}`;
    }

    function formatISO(dateString) {
        if (!dateString) return 'n/a';
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    }

    function renderReviewDetails(card) {
        if (!card) return;
        const cardCount = document.getElementById('cardCount');
        if (!cardCount) return;

        const due = formatISO(card.dueAt);
        const last = formatISO(card.lastReviewedAt);
        cardCount.textContent = `Card ${activeIndex + 1} of ${flashcards.length} | Due: ${due} | Last reviewed: ${last}`;
    }

    function updateTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        themeToggle.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    function toggleTheme() {
        const currentlyDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', currentlyDark ? 'light' : 'dark');
        updateTheme();
    }

    function updateUI() {
        const mediaDisplay = document.getElementById('mediaDisplay');
        const card = getActiveCard();

        if (!card) {
            pinyinDisplay.textContent = '';
            display.textContent = '';
            if (mediaDisplay) {
                mediaDisplay.src = '';
                mediaDisplay.style.display = 'none';
            }
            renderFlashcardList();
            updateStats();
            return;
        }

        pinyinDisplay.textContent = card.pinyin || '';
        if (showCharacter) {
            display.textContent = card.character || '';
            const text = card.character || '';
            const baseSize = 400;
            const minSize = 30;
            const size = Math.max(minSize, baseSize / Math.sqrt(Math.max(1, text.length)));
            display.style.fontSize = size + 'px';
        } else {
            display.textContent = '';
        }

        if (mediaDisplay) {
            if (card.media && typeof card.media === 'string' && card.media.startsWith('data:')) {
                mediaDisplay.src = card.media;
                mediaDisplay.style.display = 'block';
            } else {
                mediaDisplay.src = '';
                mediaDisplay.style.display = 'none';
            }
        }

        renderReviewDetails(card);
        renderFlashcardList();
        populateEditor(card);
        updateStats();

        const download = document.getElementById('downloadFlashcards');
        if (download) {
            try {
                const blob = new Blob([JSON.stringify({ flashcards }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                download.href = url;
                download.download = 'flashcards.json';
            } catch (e) {
                console.error('Could not create download link', e);
            }
        }
    }

    function csvFromFlashcards(cards) {
        const headers = ['id', 'character', 'pinyin', 'tags', 'starred', 'createdAt', 'dueAt', 'lastReviewedAt', 'correctCount', 'wrongCount', 'streak'];
        const rows = [headers.join(',')];
        cards.forEach((c) => {
            const safe = (v) => '"' + String(v || '').replace(/"/g, '""') + '"';
            rows.push([
                safe(c.id),
                safe(c.character),
                safe(c.pinyin),
                safe(c.tags.join(';')),
                safe(c.starred),
                safe(c.createdAt),
                safe(c.dueAt),
                safe(c.lastReviewedAt),
                safe(c.correctCount),
                safe(c.wrongCount),
                safe(c.streak)
            ].join(','));
        });
        return rows.join('\n');
    }

    function parseCsvText(text) {
        const lines = text.trim().split(/\r?\n/); if (!lines.length) return [];
        const headers = lines[0].split(',').map((h) => h.trim().replace(/(^\"|\"$)/g, ''));
        return lines.slice(1).map((line) => {
            const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((item) => item.trim().replace(/^\"|\"$/g, '').replace(/\"\"/g, '"'));
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = parts[idx] || '';
            });
            if (obj.tags) obj.tags = obj.tags.split(';').map((t) => t.trim()).filter(Boolean);
            obj.starred = String(obj.starred).toLowerCase() === 'true';
            obj.correctCount = Number(obj.correctCount) || 0;
            obj.wrongCount = Number(obj.wrongCount) || 0;
            obj.streak = Number(obj.streak) || 0;
            return normalizeCard(obj);
        });
    }

    function showSnackbar(message) {
        const hint = document.createElement('div');
        hint.textContent = message;
        hint.style.position = 'fixed';
        hint.style.bottom = '10px';
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.background = '#2f9c95';
        hint.style.color = '#fff';
        hint.style.padding = '10px 14px';
        hint.style.borderRadius = '8px';
        hint.style.zIndex = '9999';
        document.body.appendChild(hint);
        setTimeout(() => hint.remove(), 2100);
    }

    // UI event bindings
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('searchInput').addEventListener('input', renderFlashcardList);
    document.getElementById('filterSelect').addEventListener('change', renderFlashcardList);
    document.getElementById('tagFilter').addEventListener('input', renderFlashcardList);
    document.getElementById('clearFilter').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterSelect').value = 'all';
        document.getElementById('tagFilter').value = '';
        renderFlashcardList();
    });

    document.getElementById('saveCard').addEventListener('click', applyEditorSave);
    document.getElementById('deleteCard').addEventListener('click', () => {
        const id = document.getElementById('editCardId').value;
        const idx = flashcards.findIndex((c) => c.id === id);
        if (idx >= 0 && confirm('Delete this card?')) {
            flashcards.splice(idx, 1);
            activeIndex = Math.max(0, Math.min(activeIndex, flashcards.length - 1));
            saveFlashcards();
            updateUI();
            showSnackbar('Card deleted');
        }
    });

    document.getElementById('markEasy').addEventListener('click', () => {
        applyCardReview('easy');
        showSnackbar('Marked easy');
    });
    document.getElementById('markHard').addEventListener('click', () => {
        applyCardReview('hard');
        showSnackbar('Marked hard');
    });
    document.getElementById('markMissed').addEventListener('click', () => {
        applyCardReview('missed');
        showSnackbar('Marked missed');
    });

    document.getElementById('exportJson').addEventListener('click', () => {
        try {
            const blob = new Blob([JSON.stringify({ flashcards }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flashcards.json';
            a.click();
            URL.revokeObjectURL(url);
            showSnackbar('JSON exported');
        } catch (err) {
            alert('Failed to export JSON');
        }
    });

    document.getElementById('importJson').addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                const cards = Array.isArray(data) ? data : data.flashcards || [];
                flashcards = cards.map(normalizeCard);
                activeIndex = 0;
                saveFlashcards();
                updateUI();
                showSnackbar('JSON deck imported');
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(f);
    });

    document.getElementById('exportCsv').addEventListener('click', () => {
        try {
            const csv = csvFromFlashcards(flashcards);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flashcards.csv';
            a.click();
            URL.revokeObjectURL(url);
            showSnackbar('CSV exported');
        } catch (err) {
            alert('Failed to export CSV');
        }
    });

    document.getElementById('importCsv').addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const cards = parseCsvText(reader.result);
                flashcards = cards;
                activeIndex = 0;
                saveFlashcards();
                updateUI();
                showSnackbar('CSV deck imported');
            } catch (err) {
                alert('Invalid CSV file');
            }
        };
        reader.readAsText(f);
    });

    window.addEventListener('flashcardsUpdated', (e) => {
        if (Array.isArray(e?.detail)) {
            flashcards = e.detail.map(normalizeCard);
            activeIndex = Math.max(0, Math.min(activeIndex, flashcards.length - 1));
            updateUI();
        }
    });

    function resizeCanvas() {
        dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth;
        const height = window.innerHeight * 0.5;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let brushRadius = 10;
    const STEP_DISTANCE = 4;

    function updateBrushWidthDisplay() {
        const strokeWidthValue = document.getElementById('strokeWidthValue');
        if (strokeWidthValue) {
            strokeWidthValue.textContent = String(brushRadius);
        }
    }

    const strokeWidthRange = document.getElementById('strokeWidthRange');
    if (strokeWidthRange) {
        strokeWidthRange.addEventListener('input', (e) => {
            const value = Number(e.target.value);
            if (!Number.isNaN(value) && value > 0) {
                brushRadius = value;
                updateBrushWidthDisplay();
            }
        });
    }

    updateBrushWidthDisplay();

    let drawing = false;
    let mouse = { x: 0, y: 0 };
    let prev = { x: 0, y: 0 };

    function updateMouse(evt) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = evt.clientX - rect.left;
        mouse.y = evt.clientY - rect.top;
    }

    function pointerDown(evt) {
        drawing = true;
        updateMouse(evt);
        prev.x = mouse.x;
        prev.y = mouse.y;
    }

    function pointerMove(evt) {
        if (!drawing) return;
        updateMouse(evt);
    }

    function pointerUp() {
        drawing = false;
    }

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointerleave', pointerUp);

    function drawStroke() {
        if (!drawing) return;
        const dx = mouse.x - prev.x;
        const dy = mouse.y - prev.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) return;

        const steps = Math.ceil(dist / STEP_DISTANCE);

        ctx.beginPath();
        for (let i = 1; i <= steps; i++) {
            const x = prev.x + (dx * i) / steps;
            const y = prev.y + (dy * i) / steps;
            ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
        }
        ctx.fill();

        prev.x = mouse.x;
        prev.y = mouse.y;
    }

    function loop() {
        if (drawing) drawStroke();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    window.clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

    window.toggleCharacter = () => {
        if (!flashcards.length) return;
        showCharacter = !showCharacter;
        updateUI();
    };

    window.nextCharacter = () => {
        clearCanvas();
        activeIndex = (activeIndex + 1) % Math.max(1, flashcards.length);
        showCharacter = false;
        updateUI();
    };

    window.addEventListener('keydown', (event) => {
        if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
        switch (event.key.toLowerCase()) {
            case 'n':
                window.nextCharacter();
                event.preventDefault();
                break;
            case 't':
                window.toggleCharacter();
                event.preventDefault();
                break;
            case 'c':
                window.clearCanvas();
                event.preventDefault();
                break;
        }
    });

    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        loadFlashcardsFromStorage();
        updateUI();
        updateTheme();
    }

    init();
});
