export type StyleEdit = {
  selector: string;
  styles: Record<string, string>;
};

export type TextEdit = {
  selector: string;
  text: string;
};

export const HERO_PREVIEW_TEMPLATE: Record<string, string> = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Codraw | Super Duper Kuper idk Heroooooo</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

<style>
    :root {
        --bg-color: #030305;
        --purple: #c084fc;
        --cyan: #38bdf8;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background-color: var(--bg-color);
        color: #fff;
        font-family: 'Space Grotesk', sans-serif;
    }

    .mesh-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        background: #010103;
    }

    .aurora-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(140px); 
        opacity: 0.6;
        animation: floatOrb 20s infinite ease-in-out alternate;
    }

    .orb-1 {
        background: rgba(192, 132, 252, 0.25); 
        width: 60vw; height: 60vw;
        top: -20%; left: -10%;
    }

    .orb-2 {
        background: rgba(56, 189, 248, 0.2); 
        width: 70vw; height: 70vw;
        bottom: -20%; right: -20%;
        animation-delay: -5s;
    }
    
    .orb-3 {
        background: rgba(10, 10, 20, 0.8); 
        width: 50vw; height: 50vw;
        top: 25%; left: 25%;
        animation-duration: 25s;
    }

    @keyframes floatOrb {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(8%, 12%) scale(1.1); }
        100% { transform: translate(-5%, 8%) scale(0.95); }
    }

    .vignette {
        position: absolute;
        inset: 0;
        z-index: 15;
        pointer-events: none;
        background: radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 120%);
    }

    #webgl-container {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
    }

    .glass-nav {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 90px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 4vw;
        z-index: 20;
    }

    .nav-logo { 
        font-weight: 700; 
        letter-spacing: 0.15em; 
        font-size: 1.1rem;
        opacity: 0;
    }
    
    .nav-links { 
        display: flex; gap: 3rem; 
        font-size: 0.85rem; font-weight: 500; 
        color: rgba(255,255,255,0.6); 
    }
    .nav-links span { 
        cursor: pointer; transition: color 0.3s ease; 
        opacity: 0; transform: translateY(-10px);
    }
    .nav-links span:hover { color: #fff; }

    .hero {
        position: relative;
        z-index: 10;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1.8rem;
        padding: 2rem;
        pointer-events: auto;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.92); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulseGlow {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.03); }
    }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 6px 18px 6px 12px;
        border-radius: 100px;
        background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.5);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        color: rgba(255, 255, 255, 0.9);
        opacity: 0;
        transform: translateY(20px);
    }

    .badge-icon {
        background: rgba(56,189,248,0.2);
        padding: 4px 8px;
        border-radius: 100px;
        color: var(--cyan);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .dot {
        width: 4px; height: 4px;
        border-radius: 50%;
        background: var(--cyan);
        box-shadow: 0 0 10px var(--cyan);
        animation: pulse 2s infinite ease-in-out;
    }

    .hero-title {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.3em;
        font-size: clamp(3.5rem, 9vw, 8.5rem);
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 700;
        text-align: center;
    }

    .hero-title .word {
        display: inline-block;
        opacity: 0;
        transform: translateY(40px) scale(0.95);
        transform-origin: bottom center;
    }

    .gradient-text {
        background: linear-gradient(to right, #ffffff 20%, #c084fc 60%, #38bdf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 30px rgba(192, 132, 252, 0.2));
    }

    .hero-sub {
        max-width: 580px;
        text-align: center;
        font-size: clamp(0.95rem, 2vw, 1.2rem);
        font-weight: 400;
        line-height: 1.7;
        letter-spacing: 0.02em;
        color: rgba(255, 255, 255, 0.6);
        opacity: 0;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }

    @media (max-width: 768px) {
        body { overflow-y: auto; overflow-x: hidden; height: auto; min-height: 100vh; }
        .glass-nav { height: 60px; padding: 0 1.25rem; }
        .hero { min-height: 100vh; height: auto; padding: 4.5rem 1.25rem 2.5rem; gap: 1.25rem; justify-content: center; }
        .hero-badge { font-size: 0.65rem; padding: 5px 14px; letter-spacing: 0.15em; }
        .hero-title { font-size: clamp(2rem, 8vw, 3.6rem); gap: 0.25em; line-height: 1.15; flex-direction: column; align-items: center; }
        .hero-title .word { margin: 0; }
        .hero-sub { font-size: 0.9rem; max-width: 92%; line-height: 1.6; }
    }
</style>

<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
}
</script>
</head>
<body>

<div class="mesh-bg">
    <div class="aurora-orb orb-1"></div>
    <div class="aurora-orb orb-2"></div>
    <div class="aurora-orb orb-3"></div>
</div>

<div class="vignette"></div>
<div id="webgl-container"></div>

<nav class="glass-nav" id="nav">
    <div class="nav-logo">CODRAW</div>
</nav>

<main class="hero">
    <div class="hero-badge" id="heroBadge">
        <span>VISUAL ENGINE</span>
    </div>

    <h1 class="hero-title">
        <span class="word">DESIGN</span>
        <span class="word gradient-text">THE FUTURE</span>
    </h1>

    <p class="hero-sub" id="heroSub">
        The next-generation interactive workspace. Build, collaborate, and ship immersive 3D experiences directly in the browser.
    </p>
</main>

<script type="module">
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const container = document.getElementById("webgl-container");

// 1. SCENE SETUP
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 9;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const light1 = new THREE.PointLight(0x38bdf8, 50, 20); // Cyan
scene.add(light1);

const light2 = new THREE.PointLight(0xc084fc, 50, 20); // Purple
scene.add(light2);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const geometry = new THREE.TorusKnotGeometry(1.6, 0.7, 256, 64); 
const material = new THREE.MeshPhysicalMaterial({
    color: 0x050505,        
    metalness: 1.0,         
    roughness: 0.15,        
    clearcoat: 1.0,         
    clearcoatRoughness: 0.1,
    iridescence: 1.0,       
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [100, 400]
});

const shape = new THREE.Mesh(geometry, material);
scene.add(shape);

const particleCount = 1000;
const posArray = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

for(let i = 0; i < particleCount; i++) {
    posArray[i*3] = (Math.random() - 0.5) * 25;     
    posArray[i*3+1] = (Math.random() - 0.5) * 25;   
    posArray[i*3+2] = (Math.random() - 0.5) * 15 - 2; 
    sizes[i] = Math.random() * 1.5 + 0.5;
}

const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particlesMat = new THREE.PointsMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    size: 0.05,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

let mouse = new THREE.Vector2(0, 0);
let targetMouse = new THREE.Vector2(0, 0);
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

document.addEventListener("pointermove", (e) => {
    targetMouse.x = (e.clientX - windowHalf.x) * 0.001;
    targetMouse.y = (e.clientY - windowHalf.y) * 0.001;
});

window.addEventListener("resize", () => {
    windowHalf.set(window.innerWidth / 2, window.innerHeight / 2);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
    const time = clock.getElapsedTime();

    mouse.lerp(targetMouse, 0.05);

    camera.position.x = mouse.x * 3;
    camera.position.y = -mouse.y * 3;
    camera.lookAt(scene.position);

    shape.rotation.y = time * 0.15;
    shape.rotation.x = time * 0.1;
    shape.rotation.z = mouse.x * 0.5;

    light1.position.x = Math.sin(time * 0.6) * 5;
    light1.position.y = Math.cos(time * 0.4) * 4;
    light1.position.z = Math.sin(time * 0.5) * 4;

    light2.position.x = Math.cos(time * 0.5) * 5;
    light2.position.y = Math.sin(time * 0.7) * 4;
    light2.position.z = Math.cos(time * 0.4) * 4;

    particlesMesh.rotation.y = -time * 0.03;
    particlesMesh.rotation.x = mouse.y * 0.2;
    particlesMesh.rotation.z = mouse.x * 0.2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 2 } });

tl.to(".nav-logo", { opacity: 1, duration: 1 }, 0.2)
  .to(".nav-item", { opacity: 1, y: 0, stagger: 0.1, duration: 1.5 }, 0.2)
  .to("#heroBadge", { opacity: 1, y: 0 }, 0.4)
  .to(".hero-title .word", { opacity: 1, y: 0, scale: 1, stagger: 0.15 }, 0.5)
  .to("#heroSub", { opacity: 1, y: 0 }, 0.8)
  .fromTo(shape.scale, 
    { x: 0.01, y: 0.01, z: 0.01 }, 
    { x: 1, y: 1, z: 1, duration: 3, ease: "elastic.out(1, 0.6)" }, 
    0
  );

</script>
</body>
</html>`,
};

export const VISUAL_EDIT_SCRIPT = `
(function() {
  window.__CODRAW_VISUAL_MODE__ = true;

  function cssToCamel(str) {
    return str.replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });
  }

  function getSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return '';
    if (el.id) return '#' + el.id;
    var path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
      var selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        var sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.tagName === el.tagName) nth++;
        }
        if (nth > 1) selector += ':nth-of-type(' + nth + ')';
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  function getCategory(el) {
    var tag = el.tagName.toLowerCase();
    if (['button', 'a'].includes(tag) || el.getAttribute('role') === 'button') return 'button';
    if (['h1','h2','h3','h4','h5','h6','p','span','li','label','strong','em'].includes(tag)) return 'text';
    if (['img', 'svg', 'video', 'canvas'].includes(tag)) return 'media';
    if (['input', 'textarea', 'select'].includes(tag)) return 'input';
    return 'container';
  }

  function canEditText(el) {
    var tag = el.tagName.toLowerCase();
    var textTags = ['h1','h2','h3','h4','h5','h6','p','span','a','button','li','label','strong','em'];
    return textTags.includes(tag) && el.children.length === 0;
  }

  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'CODRAW_VISUAL_TOGGLE') {
      window.__CODRAW_VISUAL_MODE__ = !!e.data.enabled;
    } else if (e.data.type === 'CODRAW_VISUAL_APPLY_STYLE') {
      var sel = window.__CODRAW_SELECTED_SELECTOR__;
      if (!sel) return;
      var el = document.querySelector(sel);
      if (el) {
        if (e.data.property === 'animation') {
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
          el.style.animation = 'none';
          void el.offsetHeight;
          el.style.animation = e.data.value;
        } else {
          el.style[e.data.property] = e.data.value;
        }
      }
    }
  });

})();
`;

const KEYFRAME_DEFINITIONS = `
/* Codraw Animation Keyframes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(35px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.04); }
}
@keyframes floatOrb {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(8%, 12%) scale(1.1); }
  100% { transform: translate(-5%, 8%) scale(0.95); }
}
`;

export function applyVisualEditsToCss(originalCss: string, edits: StyleEdit[]): string {
  let updatedCss = originalCss || "";

  if (!updatedCss.includes("@keyframes fadeIn")) {
    updatedCss += KEYFRAME_DEFINITIONS;
  }

  edits.forEach(({ selector, styles }) => {
    let styleRules = "";
    Object.entries(styles).forEach(([prop, val]) => {
      const kebabProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
      styleRules += `  ${kebabProp}: ${val} !important;\n`;
    });

    const selectorRegex = new RegExp(
      `(${selector.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*\\{)([^}]*)(\\})`,
      "i"
    );

    if (selectorRegex.test(updatedCss)) {
      updatedCss = updatedCss.replace(selectorRegex, (match, p1, p2, p3) => {
        let existingProps = p2;
        Object.entries(styles).forEach(([prop, val]) => {
          const kebabProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
          const propRegex = new RegExp(`${kebabProp}\\s*:[^;]+;?`, "gi");
          if (propRegex.test(existingProps)) {
            existingProps = existingProps.replace(
              propRegex,
              `${kebabProp}: ${val} !important;`
            );
          } else {
            existingProps += `\n  ${kebabProp}: ${val} !important;`;
          }
        });
        return `${p1}${existingProps}\n${p3}`;
      });
    } else {
      updatedCss += `\n\n/* Visual Edit: ${selector} */\n${selector} {\n${styleRules}}\n`;
    }
  });

  return updatedCss;
}

export function applyVisualTextEditsToHtml(originalHtml: string, edits: TextEdit[]): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return originalHtml;
  if (!originalHtml || originalHtml.trim().length === 0 || edits.length === 0) return originalHtml;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, "text/html");

    edits.forEach(({ selector, text }) => {
      const el = doc.querySelector(selector);
      if (el) {
        el.textContent = text;
      }
    });

    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  } catch (err) {
    console.error("Failed to parse HTML for text edits", err);
    return originalHtml;
  }
}

export function buildPreviewHtml(files: Record<string, string>, visualEditEnabled: boolean): string {
  const hasUserFiles = Object.keys(files).length > 0;
  const targetFiles = hasUserFiles ? files : HERO_PREVIEW_TEMPLATE;

  const htmlKey = Object.keys(targetFiles).find((k) => k.endsWith(".html") || k.endsWith(".htm")) || "index.html";
  let doc = targetFiles[htmlKey] || targetFiles["index.html"] || "";

  if (!doc) {
    return `<!DOCTYPE html><html><body style="background:#050508;color:#fff;"></body></html>`;
  }

  const globalKeyframesStyle = `<style data-codraw-keyframes="true">
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(35px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulseGlow {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.04); }
    }
    @keyframes floatOrb {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(8%, 12%) scale(1.1); }
        100% { transform: translate(-5%, 8%) scale(0.95); }
    }
  </style>`;

  if (doc.includes("</head>")) {
    doc = doc.replace("</head>", `${globalKeyframesStyle}\n</head>`);
  } else {
    doc = globalKeyframesStyle + doc;
  }

  Object.entries(targetFiles).forEach(([filename, content]) => {
    if (filename.endsWith(".css")) {
      const linkRegex = new RegExp(`<link[^>]*href=["'](?:\\./)?${filename.replace(".", "\\.")}["'][^>]*>`, "gi");
      const styleTag = `<style data-filename="${filename}">\n${content}\n</style>`;
      if (linkRegex.test(doc)) {
        doc = doc.replace(linkRegex, styleTag);
      } else if (doc.includes("</head>")) {
        doc = doc.replace("</head>", `${styleTag}\n</head>`);
      } else {
        doc = styleTag + doc;
      }
    }
  });

  Object.entries(targetFiles).forEach(([filename, content]) => {
    if (filename.endsWith(".js") && !filename.includes("codraw")) {
      const scriptSrcRegex = new RegExp(`<script[^>]*src=["'](?:\\./)?${filename.replace(".", "\\.")}["'][^>]*>\\s*</script>`, "gi");
      const jsTag = `<script data-filename="${filename}">\n${content}\n</script>`;
      if (scriptSrcRegex.test(doc)) {
        doc = doc.replace(scriptSrcRegex, jsTag);
      } else if (doc.includes("</body>")) {
        doc = doc.replace("</body>", `${jsTag}\n</body>`);
      } else {
        doc += jsTag;
      }
    }
  });

  const visualScriptTag = `<script>\n${VISUAL_EDIT_SCRIPT}\n</script>`;
  if (doc.includes("</body>")) {
    doc = doc.replace("</body>", `${visualScriptTag}\n</body>`);
  } else {
    doc += visualScriptTag;
  }

  return doc;
}
