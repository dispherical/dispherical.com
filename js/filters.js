import { FFmpeg } from "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/classes.js";
import { fetchFile } from "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js";
import {
  initializeImageMagick,
  ImageMagick,
  MagickFormat,
} from "/js/magick-wasm.js";

const RAW_EXTENSIONS = new Set([
  "3fr",
  "ari", "arw",
  "bay",
  "braw", "crw", "cr2", "cr3",
  "cap",
  "data", "dcs", "dcr", "dng",
  "drf",
  "eip", "erf",
  "fff",
  "gpr",
  "iiq",
  "k25", "kdc",
  "mdc", "mef", "mos", "mrw",
  "nef", "nrw",
  "obm", "orf",
  "pef", "ptx", "pxn",
  "r3d", "raf", "raw", "rwl", "rw2", "rwz",
  "sr2", "srf", "srw",
  "tif",
  "x3f",
]);

let magickReady = false;

async function ensureMagickLoaded() {
  if (magickReady) return;
  const wasmBytes = await fetch("/js/magick.wasm").then((r) => r.arrayBuffer());
  await initializeImageMagick(new Uint8Array(wasmBytes));
  magickReady = true;
}

function isRawFile(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  return RAW_EXTENSIONS.has(ext);
}

function developRawToTiff(fileBytes) {
  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(fileBytes, (image) => {
        image.autoOrient()

        image.write(MagickFormat.Tiff, (data) => {
          resolve(new Uint8Array(data));
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}


const ffmpeg = new FFmpeg();
const BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

const FILTERS = {
  "retro-1": {
    name: "Retro 1",
    lut: { url: "https://cdn.dispherical.com/lut/retro-1.cube", file: "retro-1.cube" },
    defaultBlend: 0.6,
    effects: [
      { id: "unsharp", label: "Unsharp", build: () => "unsharp=5:5:0.8" },
      { id: "contrast", label: "Contrast", build: () => "eq=contrast=1.05" },
      {
        id: "noise",
        label: "Noise",
        hasSlider: true,
        sliderMin: 0,
        sliderMax: 40,
        sliderStep: 1,
        sliderDefault: 10,
        build: (v) => `noise=alls=${v}:allf=t`,
      },
      { id: "vignette", label: "Vignette", build: () => "vignette=angle=PI/5" },
    ],
  },
  film: {
    name: "Film",
    lut: { url: "https://cdn.dispherical.com/lut/film-1.cube", file: "film-1.cube" },
    defaultBlend: 0.6,
    effects: [
      { id: "denoise", label: "Denoise", build: () => "hqdn3d=1.0:1.0:8:8" },
      { id: "eq", label: "Brightness / Gamma / Contrast", build: () => "eq=brightness=0.05:gamma=1.12:contrast=1.03" },
      {
        id: "noise",
        label: "Noise",
        hasSlider: true,
        sliderMin: 0,
        sliderMax: 40,
        sliderStep: 1,
        sliderDefault: 10,
        build: (v) => `noise=alls=${v}:allf=t`,
      },
      { id: "boxblur", label: "Box Blur", build: () => "boxblur=1:1" },
    ],
  },
  "disposable-camera": {
    name: "Disposable Camera",
    lut: { url: "https://cdn.dispherical.com/lut/disposable-camera-1.cube", file: "disposable-camera-1.cube" },
    defaultBlend: 0.6,
    effects: [
      { id: "eq", label: "Contrast / Saturation", build: () => "eq=contrast=1.08:saturation=1.1" },
      {
        id: "noise",
        label: "Noise",
        hasSlider: true,
        sliderMin: 0,
        sliderMax: 40,
        sliderStep: 1,
        sliderDefault: 15,
        build: (v) => `noise=alls=${v}:allf=t`,
      },
      { id: "boxblur", label: "Box Blur", build: () => "boxblur=1:1" },
      { id: "vignette", label: "Vignette", build: () => "vignette=angle=PI/6" },
    ],
  },
};

const loadBtn = document.getElementById("ffmpeg-load");
const applyBtn = document.getElementById("ffmpeg-apply");
const image = document.getElementById("ffmpeg-image");
const download = document.getElementById("ffmpeg-download");
const message = document.getElementById("ffmpeg-message");
const fileInput = document.getElementById("ffmpeg-file");
const loadedUI = document.getElementById("ffmpeg-loaded");
const filtersSelect = document.getElementById("ffmpeg-filters");
const controlsContainer = document.getElementById("ffmpeg-controls");

let isLoaded = false;
let outputUrl = null;

function setMessage(text) {
  console.log(text);
  message.textContent = text || "";
}

function setBusy(isBusy, label) {
  applyBtn.disabled = isBusy;
  fileInput.disabled = isBusy;
  filtersSelect.disabled = isBusy;
  if (label) applyBtn.textContent = label;
}

async function ensureLoaded() {
  if (isLoaded) return;
  loadBtn.disabled = true;
  loadBtn.textContent = "Loading…";
  ffmpeg.on("log", ({ message: msg }) => setMessage(msg));
  await ffmpeg.load({
    classWorkerURL: `${window.location.origin}/js/ffmpeg-worker.js`,
    coreURL: `${BASE_URL}/ffmpeg-core.js`,
    wasmURL: `${BASE_URL}/ffmpeg-core.wasm`,
  });
  isLoaded = true;
  loadBtn.style.display = "none";
  loadedUI.style.display = "block";
}

function getSelectedFilters() {
  return Array.from(filtersSelect.selectedOptions).map((o) => o.value);
}

function sanitizeBaseName(name) {
  const base = (name || "image").replace(/\.[^.]+$/, "");
  const safe = base.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "image";
}

function revokeOutputUrl() {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = null;
}

function renderControls() {
  controlsContainer.innerHTML = "";
  const selected = getSelectedFilters();
  for (const filterId of selected) {
    const def = FILTERS[filterId];
    if (!def) continue;

    const section = document.createElement("fieldset");
    section.style.marginTop = "0.75rem";

    const legend = document.createElement("legend");
    legend.textContent = def.name;
    section.appendChild(legend);

    const blendLabel = document.createElement("label");
    blendLabel.style.display = "block";
    blendLabel.style.marginBottom = "0.5rem";
    const blendSlider = document.createElement("input");
    blendSlider.type = "range";
    blendSlider.min = "0";
    blendSlider.max = "1";
    blendSlider.step = "0.05";
    blendSlider.value = String(def.defaultBlend);
    blendSlider.dataset.filterId = filterId;
    blendSlider.dataset.param = "blend";
    blendSlider.style.verticalAlign = "middle";
    const blendValue = document.createElement("span");
    blendValue.textContent = ` ${blendSlider.value}`;
    blendSlider.addEventListener("input", () => {
      blendValue.textContent = ` ${blendSlider.value}`;
    });
    blendLabel.append("LUT blend ", blendSlider, blendValue);
    section.appendChild(blendLabel);

    for (const effect of def.effects) {
      const row = document.createElement("label");
      row.style.display = "block";
      row.style.marginBottom = "0.25rem";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true;
      cb.dataset.filterId = filterId;
      cb.dataset.effectId = effect.id;
      cb.style.marginRight = "0.35rem";
      row.append(cb, effect.label);

      if (effect.hasSlider) {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = String(effect.sliderMin);
        slider.max = String(effect.sliderMax);
        slider.step = String(effect.sliderStep);
        slider.value = String(effect.sliderDefault);
        slider.dataset.filterId = filterId;
        slider.dataset.effectId = effect.id;
        slider.dataset.param = "slider";
        slider.style.verticalAlign = "middle";
        slider.style.marginLeft = "0.5rem";
        const valSpan = document.createElement("span");
        valSpan.textContent = ` ${slider.value}`;
        slider.addEventListener("input", () => {
          valSpan.textContent = ` ${slider.value}`;
        });
        row.append(" ", slider, valSpan);
      }

      section.appendChild(row);
    }

    controlsContainer.appendChild(section);
  }
}

function readControlState(filterId) {
  const def = FILTERS[filterId];
  if (!def) return null;

  const blendInput = controlsContainer.querySelector(
    `input[data-filter-id="${filterId}"][data-param="blend"]`
  );
  const blend = blendInput ? parseFloat(blendInput.value) : def.defaultBlend;

  const enabledEffects = [];
  for (const effect of def.effects) {
    const cb = controlsContainer.querySelector(
      `input[type="checkbox"][data-filter-id="${filterId}"][data-effect-id="${effect.id}"]`
    );
    if (cb && !cb.checked) continue;

    let value = undefined;
    if (effect.hasSlider) {
      const slider = controlsContainer.querySelector(
        `input[data-filter-id="${filterId}"][data-effect-id="${effect.id}"][data-param="slider"]`
      );
      value = slider ? parseFloat(slider.value) : effect.sliderDefault;
    }
    enabledEffects.push({ effect, value });
  }

  return { blend, enabledEffects };
}

function buildGraph(filterId, state) {
  const def = FILTERS[filterId];
  const lutFile = def.lut.file;
  const parts = [];

  parts.push(`[0:v]format=yuv444p,split=2[orig][lut]`);
  parts.push(`[lut]lut3d=${lutFile}[graded]`);
  parts.push(`[orig][graded]blend=all_opacity=${state.blend}[blended]`);

  const chain = state.enabledEffects.map((e) =>
    e.value !== undefined ? e.effect.build(e.value) : e.effect.build()
  );
  chain.push("scale=4096:-1");

  parts.push(`[blended]${chain.join(",")}[out]`);
  return parts.join(";");
}

async function applyFilter(filterId, inputName, outputName) {
  const def = FILTERS[filterId];
  const state = readControlState(filterId);
  if (!state) return;

  await ffmpeg.writeFile(def.lut.file, await fetchFile(def.lut.url));
  const graph = buildGraph(filterId, state);

  await ffmpeg.exec([
    "-y", "-i", inputName,
    "-filter_complex", graph,
    "-map", "[out]",
    "-frames:v", "1",
    outputName,
  ]);
}

filtersSelect.addEventListener("change", renderControls);

loadBtn.addEventListener("click", async () => {
  try {
    await ensureLoaded();
    setMessage("Ready.");
  } catch (err) {
    setMessage(err?.message || String(err));
    loadBtn.disabled = false;
    loadBtn.textContent = "Load ffmpeg-core (~31 MB)";
  }
});

applyBtn.addEventListener("click", async () => {
  try {
    await ensureLoaded();

    const file = fileInput.files[0];
    if (!file) {
      setMessage("Please select an image file first.");
      return;
    }

    const selected = getSelectedFilters();
    if (!selected.length) {
      setMessage("Please select at least one filter.");
      return;
    }

    setBusy(true, "Applying…");
    revokeOutputUrl();
    image.style.display = "none";
    download.style.display = "none";

    const inputName = "input";
    const baseName = sanitizeBaseName(file.name);
    const outputName = `${baseName}-filtered.jpg`;

    let fileData = await fetchFile(file);

    if (isRawFile(file.name)) {
      setMessage("Developing raw file with ImageMagick…");
      await ensureMagickLoaded();
      fileData = await developRawToTiff(new Uint8Array(fileData));
      setMessage("Raw developed to TIFF.");
    }

    await ffmpeg.writeFile(inputName, fileData);

    let currentInput = inputName;
    for (let i = 0; i < selected.length; i += 1) {
      const filterId = selected[i];
      if (!FILTERS[filterId]) continue;
      const stepOutput = i === selected.length - 1 ? outputName : `step-${i + 1}.jpg`;
      setMessage(`Applying ${FILTERS[filterId].name}…`);
      await applyFilter(filterId, currentInput, stepOutput);
      currentInput = stepOutput;
    }

    const data = await ffmpeg.readFile(outputName);
    outputUrl = URL.createObjectURL(new Blob([data.buffer], { type: "image/jpeg" }));
    image.src = outputUrl;
    image.style.display = "block";

    download.href = outputUrl;
    download.download = outputName;
    download.style.display = "inline";

    setMessage("Done.");
  } catch (err) {
    setMessage(err?.message || String(err));
  } finally {
    setBusy(false, "Apply filters");
  }
});
