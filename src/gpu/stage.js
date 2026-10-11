import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createMaterials, buildTeslaCard, buildMotherboard, CARD_LENGTH_MM } from './teslaCard.js';

const BG = 0x05070a;
const CYAN = new THREE.Color('#00ffd1');
const PINK = new THREE.Color('#ff4d97');
const SLOT_Z = [-72, -24, 24, 72]; // dual-slot pitch, mm
const PRIMARY_SLOT = 3;
const FOV = 35;
const CAM_Z = 10;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, v) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const KEYS = ['x', 'y', 'len', 'rx', 'ry', 'rz', 'dim'];
const blend = (a, b, t) => Object.fromEntries(KEYS.map((k) => [k, a[k] + (b[k] - a[k]) * t]));

/**
 * One fixed full-viewport WebGL canvas behind the page. The Tesla card is
 * choreographed by scroll position: hero → about → exploded anatomy → ×4 array.
 */
export class GpuStage {
    constructor(canvas, { reducedMotion = false, callouts = [], clusterSticky = null } = {}) {
        this.canvas = canvas;
        this.reducedMotion = reducedMotion;
        this.callouts = callouts;
        this.clusterSticky = clusterSticky;
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setClearColor(BG, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        this.renderer = renderer;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(BG);
        this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
        this.camera.position.set(0, 0, CAM_Z);

        const pmrem = new THREE.PMREMGenerator(renderer);
        this.scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
        pmrem.dispose();

        this.addLights();
        this.buildCards();
        this.buildFloor();
        this.buildParticles();

        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.5, 0.96);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());

        this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
        this.current = null;
        this.explode = 0;
        this.array = 0;
        this.opacity = -1;
        this.clock = new THREE.Clock();
        this.tmp = new THREE.Vector3();

        this.onResize = this.onResize.bind(this);
        this.measure = this.measure.bind(this);
        this.tick = this.tick.bind(this);
        window.addEventListener('resize', this.onResize);
        window.addEventListener('load', this.measure);
        window.addEventListener('pointermove', (e) => {
            this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
        if ('ResizeObserver' in window) {
            new ResizeObserver(() => this.measure()).observe(document.body);
        }

        this.onResize();
    }

    addLights() {
        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(-4, 8, 6);
        this.scene.add(key);

        const cyan = new THREE.PointLight(CYAN, 10, 30, 1.6);
        cyan.position.set(-6, 1, 4);
        this.scene.add(cyan);

        const pink = new THREE.PointLight(PINK, 14, 30, 1.6);
        pink.position.set(6, 3, -3);
        this.scene.add(pink);

        const under = new THREE.PointLight(CYAN, 4, 12, 2);
        under.position.set(0, -3, 2);
        this.scene.add(under);
        this.lights = { key, cyan, pink, under };
    }

    buildCards() {
        const mats = createMaterials();
        Object.values(mats).forEach((m) => {
            if ('envMapIntensity' in m) m.envMapIntensity = 0.9;
        });
        this.mats = mats;

        this.rig = new THREE.Group();
        this.scene.add(this.rig);
        this.rack = new THREE.Group();
        this.rig.add(this.rack);

        this.cards = SLOT_Z.map((z, i) => {
            const built = buildTeslaCard(mats);
            // Per-card strip material so the array can pulse card by card
            const stripMat = mats.strip.clone();
            built.stripGroup.children.forEach((m) => { m.material = stripMat; });
            const holder = new THREE.Group();
            holder.add(built.card);
            this.rack.add(holder);
            return { ...built, holder, stripMat, slotZ: z, primary: i === PRIMARY_SLOT };
        });
        this.primary = this.cards[PRIMARY_SLOT];

        this.motherboard = buildMotherboard(SLOT_Z);
        this.rack.add(this.motherboard);
    }

    buildFloor() {
        const geo = new THREE.PlaneGeometry(120, 120, 1, 1);
        geo.rotateX(-Math.PI / 2);
        this.floorMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: CYAN.clone() },
                uOpacity: { value: 1 },
            },
            vertexShader: /* glsl */`
                varying vec3 vWorld;
                void main() {
                    vec4 w = modelMatrix * vec4(position, 1.0);
                    vWorld = w.xyz;
                    gl_Position = projectionMatrix * viewMatrix * w;
                }
            `,
            fragmentShader: /* glsl */`
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uOpacity;
                varying vec3 vWorld;
                float gridLine(vec2 p, float scale) {
                    vec2 g = abs(fract(p * scale - 0.5) - 0.5) / fwidth(p * scale);
                    return 1.0 - min(min(g.x, g.y), 1.0);
                }
                void main() {
                    vec2 p = vWorld.xz;
                    float minor = gridLine(p, 2.0) * 0.35;
                    float major = gridLine(p, 0.5);
                    float d = length(p - vec2(0.0, -1.0));
                    float ring = exp(-pow((d - mod(uTime * 2.4, 26.0)) * 1.6, 2.0));
                    float fade = smoothstep(22.0, 3.0, d) * smoothstep(-26.0, -8.0, vWorld.z + 0.0);
                    float glow = exp(-d * 0.35) * 0.18;
                    float a = (minor + major * 0.8) * 0.2 + ring * 0.3 * (minor + major) + glow * 0.6;
                    gl_FragColor = vec4(uColor * (0.6 + ring), a * fade * uOpacity);
                }
            `,
        });
        this.floor = new THREE.Mesh(geo, this.floorMat);
        this.scene.add(this.floor);
    }

    buildParticles() {
        const count = this.isMobile ? 500 : 1400;
        const pos = new Float32Array(count * 3);
        const seed = new Float32Array(count);
        const col = new Float32Array(count * 3);
        const white = new THREE.Color(0xffffff);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
            pos[i * 3 + 2] = -Math.random() * 30 + 4;
            seed[i] = Math.random();
            const c = Math.random() < 0.7 ? CYAN : Math.random() < 0.6 ? PINK : white;
            col.set([c.r, c.g, c.b], i * 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        this.particleMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            uniforms: {
                uTime: { value: 0 },
                uPixel: { value: 1 },
                uScroll: { value: 0 },
            },
            vertexShader: /* glsl */`
                attribute float aSeed;
                uniform float uTime;
                uniform float uPixel;
                uniform float uScroll;
                varying vec3 vColor;
                varying float vTwinkle;
                void main() {
                    vec3 p = position;
                    p.y = mod(p.y + uTime * (0.08 + aSeed * 0.25) + uScroll * (0.5 + aSeed) + 9.0, 18.0) - 9.0;
                    p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.3;
                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mv;
                    gl_PointSize = (1.0 + aSeed * 2.5) * uPixel * (12.0 / -mv.z);
                    vColor = color;
                    vTwinkle = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 100.0), 3.0);
                }
            `,
            fragmentShader: /* glsl */`
                varying vec3 vColor;
                varying float vTwinkle;
                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    float a = smoothstep(0.5, 0.0, d);
                    gl_FragColor = vec4(vColor, a * a * vTwinkle * 0.8);
                }
            `,
        });
        this.particles = new THREE.Points(geo, this.particleMat);
        this.scene.add(this.particles);
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(w, h, false);
        this.composer.setPixelRatio(dpr);
        this.composer.setSize(w, h);
        this.bloom.resolution.set(w / 2, h / 2);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.particleMat.uniforms.uPixel.value = dpr;
        this.size = { w, h };
        this.measure();
    }

    measure() {
        const top = (id) => {
            const el = document.getElementById(id);
            return el ? el.getBoundingClientRect().top + window.scrollY : 0;
        };
        const track = document.querySelector('.cluster-track');
        this.metrics = {
            about: top('about'),
            aboutH: document.getElementById('about')?.offsetHeight || 1,
            cluster: track ? track.getBoundingClientRect().top + window.scrollY : top('cluster'),
            trackH: track?.offsetHeight || window.innerHeight * 4,
        };
    }

    keyframes() {
        const vh = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
        const vw = vh * this.camera.aspect;
        const narrow = this.camera.aspect < 0.9;
        const L = (f, cap) => Math.min(vw * f, vh * cap);
        if (narrow) {
            return {
                hero: { x: 0.04 * vw, y: -0.33 * vh, len: L(0.82, 0.5), rx: 0.42, ry: -0.7, rz: -0.08, dim: 1 },
                about: { x: 0, y: 0.25 * vh, len: L(0.85, 0.5), rx: 0.6, ry: 0.5, rz: 0.12, dim: 0.3 },
                explode: { x: -0.07 * vw, y: -0.15 * vh, len: L(0.44, 0.26), rx: 0.24, ry: -0.42, rz: 0.02, dim: 1 },
                array: { x: 0, y: -0.14 * vh, len: L(0.56, 0.36), rx: 0.55, ry: -0.75, rz: 0, dim: 1 },
                vh, vw,
            };
        }
        return {
            hero: { x: 0.25 * vw, y: -0.01 * vh, len: L(0.38, 1.0), rx: 0.3, ry: -0.85, rz: -0.06, dim: 1 },
            about: { x: -0.25 * vw, y: 0, len: L(0.36, 1), rx: 0.55, ry: 0.45, rz: 0.12, dim: 1 },
            explode: { x: 0.12 * vw, y: -0.03 * vh, len: L(0.25, 0.4), rx: 0.24, ry: -0.42, rz: 0.02, dim: 1 },
            array: { x: 0.14 * vw, y: -0.1 * vh, len: L(0.3, 0.8), rx: 0.55, ry: -0.75, rz: 0, dim: 1 },
            vh, vw,
        };
    }

    // Scroll → choreography targets
    targets() {
        const y = window.scrollY;
        const vhPx = window.innerHeight;
        const m = this.metrics;
        const K = this.keyframes();

        const t01 = clamp01(y / Math.max(1, m.about * 0.9));
        const aboutHold = m.about + m.aboutH * 0.3;
        const t12 = clamp01((y - aboutHold) / Math.max(1, m.cluster - aboutHold));
        const c = clamp01((y - m.cluster) / Math.max(1, m.trackH - vhPx));
        const exit = clamp01((y - (m.cluster + m.trackH - vhPx)) / (vhPx * 0.7));

        const explode = smoothstep(0.04, 0.3, c) * (1 - smoothstep(0.44, 0.58, c));
        const array = smoothstep(0.58, 0.9, c);

        let s = blend(K.hero, K.about, easeInOut(t01));
        s = blend(s, K.explode, easeInOut(t12));
        s = blend(s, K.array, easeInOut(array));
        s.ry += 0.18 * smoothstep(0.04, 0.5, c) * (1 - array);
        s.y += exit * K.vh * 0.25;

        return { s, explode, array, c, exit, heroWeight: 1 - t01, vh: K.vh };
    }

    start() {
        this.renderer.setAnimationLoop(this.tick);
    }

    stop() {
        this.renderer.setAnimationLoop(null);
    }

    tick() {
        const dt = Math.min(this.clock.getDelta(), 0.05);
        const t = this.clock.elapsedTime;
        const tg = this.targets();
        const k = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 5);

        if (!this.current) this.current = { ...tg.s };
        KEYS.forEach((key) => { this.current[key] += (tg.s[key] - this.current[key]) * k; });
        this.explode += (tg.explode - this.explode) * k;
        this.array += (tg.array - this.array) * k;

        const p = this.pointer;
        p.sx += (p.x - p.sx) * (1 - Math.exp(-dt * 3));
        p.sy += (p.y - p.sy) * (1 - Math.exp(-dt * 3));
        const motion = this.reducedMotion ? 0 : 1;

        const s = this.current;
        const idle = motion * tg.heroWeight;
        this.rig.position.set(s.x, s.y + Math.sin(t * 0.9) * 0.08 * idle, 0);
        this.rig.rotation.set(
            s.rx + p.sy * 0.08 * motion + Math.sin(t * 0.6) * 0.03 * idle,
            s.ry + p.sx * 0.14 * motion + Math.sin(t * 0.35) * 0.06 * idle,
            s.rz + Math.sin(t * 0.5) * 0.02 * idle,
        );
        this.rig.scale.setScalar(s.len / CARD_LENGTH_MM);

        this.updateCards(t, motion);

        // Floor sits under the rig, particles drift with scroll
        this.floor.position.y = -tg.vh * 0.5;
        this.floorMat.uniforms.uTime.value = t * motion;
        this.particleMat.uniforms.uTime.value = t * motion;
        this.particleMat.uniforms.uScroll.value = window.scrollY * 0.0015;

        this.lights.cyan.position.x = -6 + Math.sin(t * 0.4) * 1.5 * motion;
        this.lights.pink.intensity = 14 + this.array * 10;

        const opacity = Math.round(s.dim * (1 - tg.exit) * 1000) / 1000;
        if (opacity !== this.opacity) {
            this.canvas.style.opacity = String(opacity);
            this.opacity = opacity;
        }

        this.updateOverlay(tg);

        if (opacity > 0.001) this.composer.render(dt);
        if (!this.firstFrame) {
            this.firstFrame = true;
            this.onFirstFrame?.();
        }
    }

    updateCards(t, motion) {
        const a = this.array;
        this.primary.setExplode(easeInOut(clamp01(this.explode)));
        this.mats.die.emissiveIntensity = this.explode * 2.4 + (0.6 + 0.4 * Math.sin(t * 3)) * this.explode;

        this.cards.forEach((card, i) => {
            if (card.primary) {
                card.holder.position.set(0, 0, card.slotZ * a);
            } else {
                const order = [2, 1, 0].indexOf(i);
                const local = easeOut(clamp01((a - order * 0.12) / 0.6));
                card.holder.visible = local > 0.001;
                const from = new THREE.Vector3(80 - order * 30, 260 + order * 60, card.slotZ - 520);
                card.holder.position.set(
                    from.x + (0 - from.x) * local,
                    from.y + (0 - from.y) * local,
                    from.z + (card.slotZ - from.z) * local,
                );
                card.holder.rotation.set((1 - local) * -0.5, 0, (1 - local) * 0.7);
            }
            // Strip glow: steady in single view, a travelling pulse once racked
            const pulse = Math.pow(Math.max(0, Math.sin(t * 2.2 - i * 0.8)), 10) * a * motion;
            const base = 0.75 + 0.25 * Math.sin(t * 1.4) * motion;
            card.stripMat.color.copy(CYAN).multiplyScalar(2.2 * (base + pulse * 1.8));
        });

        const mbOpacity = smoothstep(0.35, 1, a);
        this.motherboard.visible = mbOpacity > 0.001;
        this.motherboard.userData.materials.forEach((m) => { m.opacity = mbOpacity; });
    }

    updateOverlay(tg) {
        const sticky = this.clusterSticky;
        if (!sticky) return;
        const active = tg.c > 0 && tg.c < 1;
        sticky.style.setProperty('--progress', tg.c.toFixed(4));
        sticky.dataset.phase = tg.c < 0.52 ? 'anatomy' : 'array';

        if (!this.callouts.length) return;
        const showAmount = active ? this.explode : 0;
        const { w, h } = this.size;
        this.callouts.forEach((el, i) => {
            const key = el.dataset.anchor;
            const anchorObj = this.primary.anchors[key];
            if (!anchorObj) return;
            const vis = smoothstep(0.55 + i * 0.03, 0.85 + i * 0.03, showAmount);
            if (vis <= 0.001) {
                if (el.style.opacity !== '0') el.style.opacity = '0';
                return;
            }
            anchorObj.getWorldPosition(this.tmp).project(this.camera);
            const x = (this.tmp.x * 0.5 + 0.5) * w;
            const y = (-this.tmp.y * 0.5 + 0.5) * h;
            el.style.opacity = vis.toFixed(3);
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            const side = (w < 900 && el.dataset.sideMobile) || el.dataset.side;
            el.classList.toggle('is-left', side ? side === 'left' : x < w * 0.5);
        });
    }
}
