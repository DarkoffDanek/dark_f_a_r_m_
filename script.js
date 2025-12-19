const triangle = document.getElementById("triangle");
const modeSelect = document.getElementById("mode");
const modInput = document.getElementById("modValue");

let scale = 1;
let offsetX = 0;
let offsetY = 0;

let rowsRendered = 0;
const MAX_ROWS = 10000;
const ROWS_PER_BATCH = 25;

// ---------- МАТЕМАТИКА ----------
function nextRow(prev) {
    const row = [1n];
    for (let i = 1; i < prev.length; i++) {
        row.push(prev[i - 1] + prev[i]);
    }
    row.push(1n);
    return row;
}

// ---------- ЦВЕТА ----------
function isPowerOfTwo(n) {
    return n > 0n && (n & (n - 1n)) === 0n;
}

function createCell(value) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    const mode = modeSelect.value;

    if (mode === "normal") {
        cell.classList.add("normal");
        cell.textContent = value.toString();

        if (isPowerOfTwo(value)) {
            cell.classList.add("highlight");
        }
    } else {
        const mod = BigInt(modInput.value);
        if (value % mod === 0n) {
            cell.classList.add("mod0");
        } else {
            cell.classList.add("modn");
        }
    }

    return cell;
}

// ---------- РЕНДЕР ----------
let currentRow = [1n];

function renderBatch() {
    for (let i = 0; i < ROWS_PER_BATCH; i++) {
        if (rowsRendered >= MAX_ROWS) return;

        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        currentRow.forEach(v => rowDiv.appendChild(createCell(v)));
        triangle.appendChild(rowDiv);

        currentRow = nextRow(currentRow);
        rowsRendered++;
    }
}

function resetTriangle() {
    triangle.innerHTML = "";
    rowsRendered = 0;
    currentRow = [1n];
    renderBatch();
    renderBatch();
}

// ---------- ТРАНСФОРМ ----------
function updateTransform() {
    triangle.style.transform =
        `translate(${offsetX}px, ${offsetY}px) scale(${scale}) translateX(-50%)`;
}

// ---------- ЗУМ ----------
window.addEventListener("wheel", e => {
    e.preventDefault();
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.1, scale), 5);
    updateTransform();
    if (scale > 1.3) renderBatch();
}, { passive: false });

// ---------- DRAG ----------
let dragging = false;
let lastX = 0;
let lastY = 0;

window.addEventListener("mousedown", e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("mousemove", e => {
    if (!dragging) return;
    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    updateTransform();
});

window.addEventListener("mouseup", () => dragging = false);

// ---------- TOUCH ----------
let lastDist = null;

window.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    }
});

window.addEventListener("touchmove", e => {
    e.preventDefault();

    if (e.touches.length === 1) {
        offsetX += e.touches[0].clientX - lastX;
        offsetY += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        updateTransform();
    }

    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);

        if (lastDist) {
            scale *= dist / lastDist;
            scale = Math.min(Math.max(0.1, scale), 5);
            updateTransform();
            if (scale > 1.3) renderBatch();
        }
        lastDist = dist;
    }
}, { passive: false });

window.addEventListener("touchend", () => lastDist = null);

// ---------- UI ----------
modeSelect.addEventListener("change", resetTriangle);
modInput.addEventListener("change", resetTriangle);

// ---------- START ----------
updateTransform();
renderBatch();
renderBatch();