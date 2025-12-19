const triangle = document.getElementById("triangle");
const viewport = document.getElementById("viewport");
const modeSelect = document.getElementById("mode");
const modInput = document.getElementById("modValue");

let scale = 1;
let offsetX = window.innerWidth / 2;
let offsetY = 80;

let rowsRendered = 0;
const MAX_ROWS = 10000;
const ROWS_PER_BATCH = 25;

// ---------- MATH ----------
function nextRow(prev) {
    const row = [1n];
    for (let i = 1; i < prev.length; i++) {
        row.push(prev[i - 1] + prev[i]);
    }
    row.push(1n);
    return row;
}

function isPowerOfTwo(n) {
    return n > 0n && (n & (n - 1n)) === 0n;
}

// ---------- CELL ----------
function createCell(v) {
    const cell = document.createElement("div");
    cell.className = "cell";

    if (modeSelect.value === "normal") {
        cell.classList.add("normal");
        cell.textContent = v.toString();
        if (isPowerOfTwo(v)) cell.classList.add("highlight");
    } else {
        const mod = BigInt(modInput.value);
        if (v % mod === 0n) cell.classList.add("mod0");
        else cell.classList.add("modn");
    }
    return cell;
}

// ---------- RENDER ----------
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

// ---------- TRANSFORM ----------
function applyTransform() {
    triangle.style.transform =
        `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// ---------- ZOOM CORE ----------
function zoomAt(focusX, focusY, zoomFactor) {
    const oldScale = scale;
    scale *= zoomFactor;
    scale = Math.min(Math.max(0.1, scale), 5);

    offsetX = focusX - (focusX - offsetX) * (scale / oldScale);
    offsetY = focusY - (focusY - offsetY) * (scale / oldScale);

    applyTransform();
    if (scale > 1.3) renderBatch();
}

// ---------- MOUSE ----------
viewport.addEventListener("wheel", e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(e.clientX, e.clientY, factor);
}, { passive: false });

// ---------- DRAG ----------
let dragging = false;
let lastX, lastY;

viewport.addEventListener("mousedown", e => {
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
    applyTransform();
});

window.addEventListener("mouseup", () => dragging = false);

// ---------- TOUCH ----------
let lastDist = null;

viewport.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    }
});

viewport.addEventListener("touchmove", e => {
    e.preventDefault();

    if (e.touches.length === 1) {
        offsetX += e.touches[0].clientX - lastX;
        offsetY += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        applyTransform();
    }

    if (e.touches.length === 2) {
        const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);

        if (lastDist) {
            zoomAt(x, y, dist / lastDist);
        }
        lastDist = dist;
    }
}, { passive: false });

viewport.addEventListener("touchend", () => lastDist = null);

// ---------- UI ----------
modeSelect.addEventListener("change", resetTriangle);
modInput.addEventListener("change", resetTriangle);

// ---------- START ----------
applyTransform();
renderBatch();
renderBatch();