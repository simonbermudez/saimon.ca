import * as THREE from 'three';

// Procedural canvas textures for the Tesla card. Everything is drawn at
// runtime so the model ships without any image assets.

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')];
}

function toTexture(canvas, { srgb = true, anisotropy = 8 } = {}) {
    const tex = new THREE.CanvasTexture(canvas);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    tex.needsUpdate = true;
    return tex;
}

// Seeded RNG so every card (and every visit) gets the same board layout
function rng(seed = 1) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Matte black PCB with copper traces, vias and silkscreen
export function pcbTexture() {
    const [c, g] = makeCanvas(2048, 800);
    const r = rng(7);
    g.fillStyle = '#0a0d0c';
    g.fillRect(0, 0, c.width, c.height);

    // Ground pour noise
    for (let i = 0; i < 9000; i++) {
        g.fillStyle = `rgba(40,60,52,${r() * 0.12})`;
        g.fillRect(r() * c.width, r() * c.height, 2, 2);
    }

    // Traces with 45° jogs
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let i = 0; i < 260; i++) {
        let x = r() * c.width;
        let y = r() * c.height;
        g.strokeStyle = `rgba(${70 + r() * 40},${95 + r() * 40},${80 + r() * 30},${0.25 + r() * 0.3})`;
        g.lineWidth = 1 + r() * 2.5;
        g.beginPath();
        g.moveTo(x, y);
        const segs = 2 + Math.floor(r() * 4);
        for (let s = 0; s < segs; s++) {
            const len = 30 + r() * 220;
            const dir = Math.floor(r() * 4);
            if (dir === 0) x += len;
            else if (dir === 1) y += len * 0.6;
            else if (dir === 2) { x += len * 0.5; y += len * 0.5; }
            else { x += len * 0.5; y -= len * 0.5; }
            g.lineTo(x, y);
        }
        g.stroke();
        g.fillStyle = 'rgba(190,160,90,0.55)';
        g.beginPath();
        g.arc(x, y, 2.5, 0, Math.PI * 2);
        g.fill();
    }

    // Silkscreen component outlines and reference designators
    g.strokeStyle = 'rgba(220,225,230,0.35)';
    g.fillStyle = 'rgba(220,225,230,0.4)';
    g.font = '600 14px monospace';
    for (let i = 0; i < 70; i++) {
        const w = 14 + r() * 40;
        const h = 10 + r() * 26;
        const x = r() * (c.width - w);
        const y = r() * (c.height - h);
        g.lineWidth = 1.5;
        g.strokeRect(x, y, w, h);
        if (r() > 0.5) g.fillText(`${['C', 'R', 'L', 'U', 'Q'][Math.floor(r() * 5)]}${Math.floor(r() * 900 + 100)}`, x, y - 4);
    }
    return toTexture(c);
}

// PCIe x16 edge connector: 82 pads per side with the key notch
export function goldFingerTexture() {
    const [c, g] = makeCanvas(1024, 96);
    g.fillStyle = '#0a0d0c';
    g.fillRect(0, 0, c.width, c.height);
    const pads = 82;
    const notchAt = 11;
    const pitch = c.width / (pads + 2);
    for (let i = 0; i < pads; i++) {
        if (i === notchAt) continue;
        const x = pitch * (i + 1);
        const grad = g.createLinearGradient(0, 0, 0, c.height);
        grad.addColorStop(0, '#8a6a2a');
        grad.addColorStop(0.3, '#f2cf7a');
        grad.addColorStop(1, '#c9973e');
        g.fillStyle = grad;
        g.fillRect(x, 18, pitch * 0.62, c.height - 18);
    }
    return toTexture(c);
}

// Alpha mask for the vented full-height I/O bracket (white = metal)
export function bracketAlphaTexture() {
    const [c, g] = makeCanvas(256, 768);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#000';
    const cols = 5;
    const rows = 26;
    const marginX = 34;
    const top = 90;
    const bottom = 70;
    const cw = (c.width - marginX * 2) / cols;
    const rh = (c.height - top - bottom) / rows;
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const offset = j % 2 ? cw * 0.5 : 0;
            const x = marginX + i * cw + offset;
            if (x + cw * 0.7 > c.width - marginX + 4) continue;
            // Hexagonal perforation
            const cx = x + cw * 0.35;
            const cy = top + j * rh + rh * 0.5;
            const rad = Math.min(cw, rh) * 0.42;
            g.beginPath();
            for (let k = 0; k < 6; k++) {
                const a = (Math.PI / 3) * k + Math.PI / 6;
                g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
            }
            g.closePath();
            g.fill();
        }
    }
    const tex = toTexture(c, { srgb: false });
    return tex;
}

// Lettering for the top edge of the shroud
export function wordmarkTexture(text = 'TESLA', { color = '#e8ecef', sub = null } = {}) {
    const [c, g] = makeCanvas(2048, 256);
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = color;
    g.textBaseline = 'middle';
    g.font = '700 150px "Space Grotesk", "Helvetica Neue", Arial, sans-serif';
    const spacing = 60;
    const widths = [...text].map((ch) => g.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
    let x = (c.width - total) / 2;
    [...text].forEach((ch, i) => {
        g.fillText(ch, x, c.height / 2 + 8);
        x += widths[i] + spacing;
    });
    if (sub) {
        g.font = '600 42px "JetBrains Mono", monospace';
        g.fillStyle = '#76b900';
        g.fillText(sub, 40, c.height / 2 + 4);
    }
    return toTexture(c);
}

// Backplate: dark anodized with a subtle diagonal machining pattern
export function backplateTexture() {
    const [c, g] = makeCanvas(1024, 400);
    g.fillStyle = '#16181c';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(255,255,255,0.025)';
    g.lineWidth = 2;
    for (let i = -c.height; i < c.width; i += 9) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + c.height, c.height);
        g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.lineWidth = 3;
    g.strokeRect(24, 24, c.width - 48, c.height - 48);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.font = '700 56px "Space Grotesk", Arial, sans-serif';
    g.fillText('T E S L A', 70, c.height - 70);
    return toTexture(c);
}

// EPS-12V 8-pin housing face
export function powerConnectorTexture() {
    const [c, g] = makeCanvas(128, 256);
    g.fillStyle = '#121214';
    g.fillRect(0, 0, c.width, c.height);
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 2; i++) {
            const x = 18 + i * 52;
            const y = 22 + j * 56;
            g.fillStyle = '#030303';
            g.beginPath();
            g.roundRect(x, y, 40, 44, j % 2 ? 4 : 14);
            g.fill();
            g.fillStyle = 'rgba(210,180,110,0.65)';
            g.fillRect(x + 14, y + 16, 12, 12);
        }
    }
    return toTexture(c);
}

// Motherboard used when the four cards dock into the chassis
export function motherboardTexture() {
    const [c, g] = makeCanvas(1024, 1024);
    const r = rng(42);
    g.fillStyle = '#07090b';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(0,255,209,0.10)';
    for (let i = 0; i < 320; i++) {
        let x = r() * c.width;
        let y = r() * c.height;
        g.lineWidth = 1 + r() * 2;
        g.beginPath();
        g.moveTo(x, y);
        for (let s = 0; s < 3; s++) {
            if (r() > 0.5) x += (r() - 0.5) * 300;
            else y += (r() - 0.5) * 300;
            g.lineTo(x, y);
        }
        g.stroke();
    }
    return toTexture(c);
}
