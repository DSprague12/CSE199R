document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const display = document.getElementById('characterDisplay');
    const pinyinDisplay = document.getElementById('pinyinDisplay');

    let showCharacter = false;
    let characterIndex = 0;
    let flashcards = [];
    fetch('flashcards.json')
    .then(response => response.json())
    .then(data => {
        flashcards = data.flashcards;
        pinyinDisplay.textContent = flashcards[characterIndex].pinyin;
    })
    .catch(error => {
        console.error('Error loading flashcards:', error);
        flashcards = [];
    });


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth*0.9;
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
        if(showCharacter){
            showCharacter = false;
            display.textContent = "";
        }else{
            showCharacter = true;
            display.textContent = flashcards[characterIndex].character;
        }
    }

    window.nextCharacter = () => {
        clearCanvas();
        characterIndex++;
        if(characterIndex >= flashcards.length){
            characterIndex = 0;
        }
        display.textContent = "";
        pinyinDisplay.textContent = flashcards[characterIndex].pinyin;
        showCharacter = false;
    }

});
