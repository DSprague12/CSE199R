document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const display = document.getElementById('characterDisplay');
    const pinyinDisplay = document.getElementById('pinyinDisplay');

    let showCharacter = false;
    let characterIndex = 0;
    let flashcards = [];
    const initialMedia = document.getElementById('mediaDisplay');
    if (initialMedia) initialMedia.style.display = 'none';

    function updateUI() {
        const mediaDisplay = document.getElementById('mediaDisplay');
        if (flashcards.length === 0) {
            pinyinDisplay.textContent = '';
            if (mediaDisplay) mediaDisplay.src = '';
            return;
        }
        pinyinDisplay.textContent = flashcards[characterIndex].pinyin || '';
        const card = flashcards[characterIndex];
        if (mediaDisplay) {
            if (card && card.media && typeof card.media === 'string' && card.media.startsWith('data:')) {
                mediaDisplay.src = card.media;
                mediaDisplay.style.display = 'block';
            } else {
                mediaDisplay.src = '';
                mediaDisplay.style.display = 'none';
            }
        }

        // update download link
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

    function loadDeck() {
        const stored = localStorage.getItem('flashcards');
        if (stored) {
            try {
                flashcards = JSON.parse(stored);
                updateUI();
                return;
            } catch (e) {
                console.error('Error parsing stored flashcards', e);
                localStorage.removeItem('flashcards');
            }
        }
        fetch('flashcards.json')
            .then(response => response.json())
            .then(data => {
                flashcards = data.flashcards || [];
                updateUI();
            })
            .catch(error => {
                console.error('Error loading flashcards:', error);
                flashcards = [];
                updateUI();
            });
    }

    loadDeck();

    // Listen for updates from the create form (same page) or other scripts
    window.addEventListener('flashcardsUpdated', (e) => {
        try {
            const updated = e && e.detail ? e.detail : null;
            if (Array.isArray(updated)) {
                flashcards = updated;
            }
        } catch (err) {
            console.error('Invalid flashcardsUpdated event detail', err);
        }
        // jump to the newest card
        characterIndex = Math.max(0, flashcards.length - 1);
        updateUI();
    });

    const uploadInput = document.getElementById('uploadFlashcards');
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(reader.result);
                    if (Array.isArray(parsed)) {
                        flashcards = parsed;
                    } else if (parsed.flashcards) {
                        flashcards = parsed.flashcards;
                    } else {
                        alert('JSON does not contain a flashcards array');
                        return;
                    }
                    localStorage.setItem('flashcards', JSON.stringify(flashcards));
                    characterIndex = 0;
                    updateUI();
                    alert('Flashcards imported');
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(f);
        });
    }


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth*0.8;
        const height = window.innerHeight*0.5;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
        updateMouse(evt);
    }

    function pointerUp() {
        drawing = false;
    }

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointerleave', pointerUp);

    const BRUSH_RADIUS = 10;
    const STEP_DISTANCE = 4; 


    function drawStroke() {
        const dx = mouse.x - prev.x;
        const dy = mouse.y - prev.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) return;

        const steps = Math.ceil(dist / STEP_DISTANCE);

        ctx.beginPath();

        for (let i = 1; i <= steps; i++) {
            const x = prev.x + (dx * i) / steps;
            const y = prev.y + (dy * i) / steps;
            ctx.moveTo(x + BRUSH_RADIUS, y);
            ctx.ellipse(x, y, BRUSH_RADIUS, BRUSH_RADIUS, 0, 0, Math.PI * 2);
        }

        ctx.fill();

        prev.x = mouse.x;
        prev.y = mouse.y;
    }

    function loop() {
        if (drawing) {
            drawStroke();
        }
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    window.clearCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    window.toggleCharacter = () => {
        if (flashcards.length === 0) return;
        if (showCharacter) {
            showCharacter = false;
            display.textContent = "";
        } else {
            showCharacter = true;
            display.textContent = flashcards[characterIndex].character || "";
        }
    }

    window.nextCharacter = () => {
        clearCanvas();
        characterIndex++;
        if(characterIndex >= flashcards.length){
            characterIndex = 0;
        }
        display.textContent = "";
        showCharacter = false;
        updateUI();
    }

});
