const FILTER_DEFS = {
    brightness: { value: 100, min: 0,   max: 200, step: 1,   unit: '%',  label: 'Brightness' },
    contrast:   { value: 100, min: 0,   max: 200, step: 1,   unit: '%',  label: 'Contrast'   },
    saturation: { value: 100, min: 0,   max: 200, step: 1,   unit: '%',  label: 'Saturation' },
    exposure:   { value: 100, min: 0,   max: 200, step: 1,   unit: '%',  label: 'Exposure'   },
    hueRotate:  { value: 0,   min: 0,   max: 360, step: 1,   unit: 'deg',label: 'Hue Rotate' },
    blur:       { value: 0,   min: 0,   max: 20,  step: 0.1, unit: 'px', label: 'Blur'       },
    grayscale:  { value: 0,   min: 0,   max: 100, step: 1,   unit: '%',  label: 'Grayscale'  },
    sepia:      { value: 0,   min: 0,   max: 100, step: 1,   unit: '%',  label: 'Sepia'      },
    opacity:    { value: 100, min: 0,   max: 100, step: 1,   unit: '%',  label: 'Opacity'    },
    invert:     { value: 0,   min: 0,   max: 100, step: 1,   unit: '%',  label: 'Invert'     },
};

// Live filter state (flat values)
const filters = {};
Object.keys(FILTER_DEFS).forEach(k => { filters[k] = FILTER_DEFS[k].value; });

// ─── Presets ──────────────────────────────────────────────────────────────
const PRESETS = {
    vintage:  { brightness: 108, contrast: 92,  saturation: 82,  exposure: 105, hueRotate: 5,  blur: 0.4, grayscale: 8,  sepia: 20, opacity: 100, invert: 0  },
    cool:     { brightness: 100, contrast: 108, saturation: 90,  exposure: 100, hueRotate: 195,blur: 0,   grayscale: 0,  sepia: 0,  opacity: 100, invert: 0  },
    warm:     { brightness: 108, contrast: 100, saturation: 118, exposure: 105, hueRotate: 340,blur: 0,   grayscale: 0,  sepia: 12, opacity: 100, invert: 0  },
    mono:     { brightness: 100, contrast: 125, saturation: 0,   exposure: 100, hueRotate: 0,  blur: 0,   grayscale: 100,sepia: 0,  opacity: 100, invert: 0  },
    vivid:    { brightness: 105, contrast: 115, saturation: 175, exposure: 108, hueRotate: 0,  blur: 0,   grayscale: 0,  sepia: 0,  opacity: 100, invert: 0  },
    fade:     { brightness: 115, contrast: 82,  saturation: 70,  exposure: 95,  hueRotate: 0,  blur: 0.5, grayscale: 18, sepia: 10, opacity: 90,  invert: 0  },
};

// ─── Build filter UI ───────────────────────────────────────────────────────
const filtersContainer = document.getElementById('filters-container');
const sliderEls = {};   // key → { input, valueEl }

function formatValue(key, val) {
    const def = FILTER_DEFS[key];
    const v = parseFloat(val);
    return `${def.unit === 'px' ? v.toFixed(1) : Math.round(v)}${def.unit}`;
}

function createFilterEl(key) {
    const def = FILTER_DEFS[key];
    const wrapper = document.createElement('div');
    wrapper.className = 'filter';
    wrapper.innerHTML = `
        <div class="filter-label-row">
            <label for="sl-${key}">${def.label}</label>
            <span class="filter-value" id="val-${key}">${formatValue(key, def.value)}</span>
        </div>
        <input id="sl-${key}" type="range"
               min="${def.min}" max="${def.max}" step="${def.step}"
               value="${def.value}" />
    `;
    return wrapper;
}

Object.keys(FILTER_DEFS).forEach(key => {
    const el = createFilterEl(key);
    filtersContainer.appendChild(el);
    sliderEls[key] = {
        input:   el.querySelector('input'),
        valueEl: el.querySelector(`#val-${key}`)
    };
    sliderEls[key].input.addEventListener('input', () => {
        filters[key] = Number(sliderEls[key].input.value);
        sliderEls[key].valueEl.textContent = formatValue(key, filters[key]);
        clearActivePreset();
        drawImage();
    });
});

// ─── Canvas setup ─────────────────────────────────────────────────────────
const imageCanvas = document.getElementById('image-canvas');
const canvasCtx   = imageCanvas.getContext('2d');
const placeholder = document.getElementById('placeholder');
const imgInput    = document.getElementById('image-input');
const resetBtn    = document.getElementById('reset-btn');
const downloadBtn = document.getElementById('download-btn');
const presetsEl   = document.getElementById('presets');

const DPR = window.devicePixelRatio || 1;
let image     = null;
let objectUrl = null;

function setCanvasSize() {
    const card = document.querySelector('.image-card');
    const rect = card.getBoundingClientRect();
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(300, Math.round(rect.height));

    imageCanvas.style.width  = `${w}px`;
    imageCanvas.style.height = `${h}px`;
    imageCanvas.width  = Math.round(w * DPR);
    imageCanvas.height = Math.round(h * DPR);
    canvasCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// exposure is mapped to brightness as a multiplier
function buildFilterString() {
    const b = (filters.brightness / 100) * (filters.exposure / 100) * 100;
    return [
        `brightness(${b}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturation}%)`,
        `hue-rotate(${filters.hueRotate}deg)`,
        `blur(${filters.blur}px)`,
        `grayscale(${filters.grayscale}%)`,
        `sepia(${filters.sepia}%)`,
        `opacity(${filters.opacity}%)`,
        `invert(${filters.invert}%)`,
    ].join(' ');
}

// resizeCanvas=true only when image first loads or on window resize.
// Slider moves must NOT trigger setCanvasSize — that causes layout reflow
// which was the second reason the filter panel kept shrinking.
function drawImage(resizeCanvas = false) {
    if (!image || !image.complete) return;

    if (resizeCanvas) setCanvasSize();
    const cw = imageCanvas.width / DPR;
    const ch = imageCanvas.height / DPR;

    const scale = Math.min(cw / image.naturalWidth, ch / image.naturalHeight);
    const w = image.naturalWidth  * scale;
    const h = image.naturalHeight * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    canvasCtx.clearRect(0, 0, cw, ch);
    canvasCtx.filter = buildFilterString();
    canvasCtx.drawImage(image, x, y, w, h);
    canvasCtx.filter = 'none';

    imageCanvas.style.display = 'block';
    placeholder.style.display = 'none';
}

function syncSliders() {
    Object.keys(FILTER_DEFS).forEach(key => {
        const el = sliderEls[key];
        if (!el) return;
        el.input.value = filters[key];
        el.valueEl.textContent = formatValue(key, filters[key]);
    });
}

function resetFilters() {
    Object.keys(FILTER_DEFS).forEach(k => { filters[k] = FILTER_DEFS[k].value; });
}

// ─── Image load ───────────────────────────────────────────────────────────
imgInput.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);

    const img = new Image();
    img.onload  = () => { image = img; drawImage(true); };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); objectUrl = null; alert('Failed to load image.'); };
    img.src = objectUrl;
});

// ─── Presets ──────────────────────────────────────────────────────────────
function clearActivePreset() {
    presetsEl.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
}

presetsEl.addEventListener('click', e => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    Object.assign(filters, preset);
    syncSliders();
    drawImage();
    clearActivePreset();
    btn.classList.add('active');
});

// ─── Reset ────────────────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
    resetFilters();
    syncSliders();
    clearActivePreset();

    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    image = null;

    canvasCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    imageCanvas.style.display = 'none';
    placeholder.style.display = 'flex';

    imgInput.value = '';
    setCanvasSize();
});

// ─── Download ─────────────────────────────────────────────────────────────
downloadBtn.addEventListener('click', () => {
    if (!image) { alert('Please load an image first!'); return; }
    // Render at native image resolution for full quality
    const offscreen = document.createElement('canvas');
    offscreen.width  = image.naturalWidth;
    offscreen.height = image.naturalHeight;
    const ctx = offscreen.getContext('2d');
    ctx.filter = buildFilterString();
    ctx.drawImage(image, 0, 0);
    ctx.filter = 'none';

    const a = document.createElement('a');
    a.download = 'pixelvision-edit.png';
    a.href = offscreen.toDataURL('image/png');
    a.click();
});

// ─── Resize ───────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { image ? drawImage(true) : setCanvasSize(); });

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setCanvasSize();
    imageCanvas.style.display = 'none';
    placeholder.style.display = 'flex';
});