const triangle = document.getElementById("triangle");

let scale = 1;
let rowsRendered = 0;
const MAX_ROWS = 50;
const ROWS_PER_BATCH = 20;

// ---------- МАТЕМАТИКА ----------
function generateRow(prevRow) {
    const row = [1n];
    for (let i = 1; i < prevRow.length; i++) {
        row.push(prevRow[i - 1] + prevRow[i]);
    }
    row.push(1n);
    return row;
}

// ---------- РЕНДЕР ----------
let currentRow = [1n];

function renderNextBatch() {
    for (let i = 0; i < ROWS_PER_BATCH; i++) {
        if (rowsRendered >= MAX_ROWS) return;

        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        currentRow.forEach(num => {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.textContent = num.toString();
            rowDiv.appendChild(cell);
        });

        triangle.appendChild(rowDiv);
        currentRow = generateRow(currentRow);
        rowsRendered++;
    }
}

// ---------- ЗУМ (ПК) ----------
window.addEventListener("wheel", e => {
    e.preventDefault();
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.1, scale), 4);
    triangle.style.transform = `translateX(-50%) scale(${scale})`;

    if (scale > 1.2) renderNextBatch();
}, { passive: false });

// ---------- ЗУМ (ТАЧ) ----------
let lastDist = null;

window.addEventListener("touchmove", e => {
    if (e.touches.length === 2) {
        e.preventDefault();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);

        if (lastDist) {
            scale *= dist / lastDist;
            scale = Math.min(Math.max(0.1, scale), 4);
            triangle.style.transform = `translateX(-50%) scale(${scale})`;

            if (scale > 1.2) renderNextBatch();
        }
        lastDist = dist;
    }
}, { passive: false });

window.addEventListener("touchend", () => lastDist = null);

// ---------- СТАРТ ----------
renderNextBatch();
renderNextBatch();