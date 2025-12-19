const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;
let scale = 1;
let offsetX = 0;
let offsetY = 40;

const MAX_ROWS = 10000;
const CELL_SIZE = 28;
const FONT_SIZE = 12;

let triangle = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ---------- Генерация ---------- */
function generate(rows) {
    triangle = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j <= i; j++) {
            if (j === 0 || j === i) row.push(1n);
            else row.push(triangle[i - 1][j - 1] + triangle[i - 1][j]);
        }
        triangle.push(row);
    }
}
generate(MAX_ROWS);

/* ---------- Отрисовка ---------- */
function draw() {
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.clearRect(-offsetX / scale, -offsetY / scale, width / scale, height / scale);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${FONT_SIZE}px monospace`;

    const pastel = [
        "#ffd6e0", "#d0f4de", "#fcf6bd",
        "#e4c1f9", "#a9def9"
    ];

    for (let i = 0; i < triangle.length; i++) {
        const y = i * CELL_SIZE;
        const startX = -i * CELL_SIZE / 2;

        if (y * scale > height) break;

        for (let j = 0; j < triangle[i].length; j++) {
            const x = startX + j * CELL_SIZE;

            ctx.fillStyle = pastel[(i + j) % pastel.length];
            ctx.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);

            ctx.fillStyle = "#000";
            ctx.fillText(
                triangle[i][j].toString(),
                x + CELL_SIZE / 2 - 1,
                y + CELL_SIZE / 2 - 1
            );
        }
    }
}

function loop() {
    draw();
    requestAnimationFrame(loop);
}
loop();

/* ---------- Зум мышью ---------- */
canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    scale = Math.min(5, Math.max(0.1, scale * zoom));
});

/* ---------- Touch pinch ---------- */
let lastDist = null;

canvas.addEventListener("touchmove", e => {
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);

        if (lastDist) {
            const zoom = dist / lastDist;
            scale = Math.min(5, Math.max(0.1, scale * zoom));
        }
        lastDist = dist;
    }
});

canvas.addEventListener("touchend", () => {
    lastDist = null;
});

/* ---------- Центровка вершины ---------- */
offsetX = width / 2;