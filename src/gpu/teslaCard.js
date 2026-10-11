import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as tex from './textures.js';

// Procedural model of a passively cooled, dual-slot Pascal Tesla accelerator.
// Units are millimetres, centred on the card:
//   X: bracket end (-133.5) → rear/power end (+133.5)
//   Y: PCIe edge (-55) → top edge (+55)
//   Z: backplate (-6) → shroud face (+37)

export const CARD_LENGTH_MM = 267;
const CYAN = new THREE.Color('#00ffd1');

export function createMaterials() {
    const pcbMap = tex.pcbTexture();
    const backMap = tex.backplateTexture();
    const bracketAlpha = tex.bracketAlphaTexture();

    return {
        gunmetal: new THREE.MeshPhysicalMaterial({
            color: 0x2a2e35, metalness: 0.85, roughness: 0.34, clearcoat: 0.4, clearcoatRoughness: 0.25,
        }),
        silver: new THREE.MeshPhysicalMaterial({
            color: 0xaab0b8, metalness: 1, roughness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.2,
        }),
        fins: new THREE.MeshStandardMaterial({ color: 0xbfc4cb, metalness: 1, roughness: 0.32 }),
        copper: new THREE.MeshPhysicalMaterial({
            color: 0xd28a57, metalness: 1, roughness: 0.22, clearcoat: 0.5,
        }),
        pcb: new THREE.MeshStandardMaterial({ map: pcbMap, roughness: 0.62, metalness: 0.15 }),
        backplate: new THREE.MeshStandardMaterial({ map: backMap, metalness: 0.7, roughness: 0.42 }),
        substrate: new THREE.MeshStandardMaterial({ color: 0x1d3527, roughness: 0.5, metalness: 0.2 }),
        die: new THREE.MeshPhysicalMaterial({
            color: 0x0b0d12, metalness: 0.6, roughness: 0.1, clearcoat: 1,
            emissive: CYAN, emissiveIntensity: 0,
        }),
        chip: new THREE.MeshStandardMaterial({ color: 0x16171b, roughness: 0.45, metalness: 0.3 }),
        choke: new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.5, metalness: 0.6 }),
        cap: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.25, metalness: 1 }),
        plastic: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.7, metalness: 0 }),
        powerFace: new THREE.MeshStandardMaterial({ map: tex.powerConnectorTexture(), roughness: 0.7 }),
        gold: new THREE.MeshStandardMaterial({ map: tex.goldFingerTexture(), metalness: 0.75, roughness: 0.3 }),
        bracket: new THREE.MeshStandardMaterial({
            color: 0xa7adb5, metalness: 1, roughness: 0.38,
            alphaMap: bracketAlpha, alphaTest: 0.5, side: THREE.DoubleSide,
        }),
        graphite: new THREE.MeshPhysicalMaterial({
            color: 0x41464e, metalness: 1, roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.15,
        }),
        steel: new THREE.MeshStandardMaterial({ color: 0xa7adb5, metalness: 1, roughness: 0.38 }),
        screw: new THREE.MeshStandardMaterial({ color: 0x55595f, metalness: 1, roughness: 0.3 }),
        wordmark: new THREE.MeshBasicMaterial({
            map: tex.wordmarkTexture('TESLA'), transparent: true, depthWrite: false,
            polygonOffset: true, polygonOffsetFactor: -2,
        }),
        // HDR colour (>1) so the light strips feed the bloom pass
        strip: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(2.2), toneMapped: false }),
    };
}

function boxBetween(x0, x1, y0, y1, z0, z1, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
}

function anchor(parent, x, y, z) {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
}

function chamferedRect(x0, x1, y0, y1, c) {
    const s = new THREE.Shape();
    s.moveTo(x0 + c, y0);
    s.lineTo(x1 - c, y0);
    s.lineTo(x1, y0 + c);
    s.lineTo(x1, y1 - c);
    s.lineTo(x1 - c, y1);
    s.lineTo(x0 + c, y1);
    s.lineTo(x0, y1 - c);
    s.lineTo(x0, y0 + c);
    s.closePath();
    return s;
}

const shardExtrude = { depth: 2, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.7, bevelSegments: 2, curveSegments: 1 };

// Thin glowing bar between two points, lying on the shroud face
function stripSegment(a, b, z, mat, width = 1.6) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + width, width, 0.8), mat);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
    m.rotation.z = Math.atan2(dy, dx);
    return m;
}

export function buildTeslaCard(mats) {
    const card = new THREE.Group();
    card.name = 'tesla-card';

    const parts = {
        backplate: new THREE.Group(),
        board: new THREE.Group(),
        cooler: new THREE.Group(),
        fins: new THREE.Group(),
        shroud: new THREE.Group(),
        bracket: new THREE.Group(),
    };
    Object.values(parts).forEach((p) => card.add(p));

    // ---- Board ---------------------------------------------------------
    const { board } = parts;
    board.add(boxBetween(-131, 122, -50, 50, -2.6, -1, mats.pcb));

    // PCIe 3.0 x16 edge
    const fingers = boxBetween(-95, -6, -58, -50, -2.6, -1, [
        mats.pcb, mats.pcb, mats.pcb, mats.pcb, mats.gold, mats.gold,
    ]);
    board.add(fingers);

    // GPU package + die
    board.add(boxBetween(-66, -24, -21, 21, -1, 0.2, mats.substrate));
    const die = boxBetween(-57.5, -32.5, -10, 10, 0.2, 1.1, mats.die);
    board.add(die);

    // 12 GDDR5 packages around the GPU (the other 12 live on the back)
    const memPositions = [
        [-87, -24], [-87, 0], [-87, 24],
        [-3, -24], [-3, 0], [-3, 24],
        [-66, 38], [-45, 38], [-24, 38],
        [-66, -38], [-45, -38], [-24, -38],
    ];
    const memGeo = new THREE.BoxGeometry(14, 12, 1.1);
    const mem = new THREE.InstancedMesh(memGeo, mats.chip, memPositions.length);
    const m4 = new THREE.Matrix4();
    memPositions.forEach(([x, y], i) => {
        const rotate = Math.abs(y) > 30;
        m4.makeRotationZ(rotate ? Math.PI / 2 : 0).setPosition(x, y, -0.45);
        mem.setMatrixAt(i, m4);
    });
    board.add(mem);

    // Back-side memory
    const memBack = new THREE.InstancedMesh(memGeo, mats.chip, memPositions.length);
    memPositions.forEach(([x, y], i) => {
        m4.makeRotationZ(Math.abs(y) > 30 ? Math.PI / 2 : 0).setPosition(x, y, -3.15);
        memBack.setMatrixAt(i, m4);
    });
    board.add(memBack);

    // VRM: two rows of chokes + a row of polymer caps
    const chokeGeo = new RoundedBoxGeometry(9, 9, 6, 2, 1.2);
    const chokes = new THREE.InstancedMesh(chokeGeo, mats.choke, 16);
    for (let i = 0; i < 16; i++) {
        const row = i < 8 ? 18 : -8;
        m4.makeTranslation(26 + (i % 8) * 11, row, 2);
        chokes.setMatrixAt(i, m4);
    }
    board.add(chokes);

    const capGeo = new THREE.CylinderGeometry(3, 3, 7, 20);
    capGeo.rotateX(Math.PI / 2);
    const caps = new THREE.InstancedMesh(capGeo, mats.cap, 12);
    for (let i = 0; i < 12; i++) {
        m4.makeTranslation(24 + i * 7.6, 36, 2.5);
        caps.setMatrixAt(i, m4);
    }
    board.add(caps);

    const fets = new THREE.InstancedMesh(new THREE.BoxGeometry(6, 5, 1), mats.chip, 16);
    for (let i = 0; i < 16; i++) {
        m4.makeTranslation(26 + (i % 8) * 11, i < 8 ? 6 : -20, -0.5);
        fets.setMatrixAt(i, m4);
    }
    board.add(fets);

    // EPS-12V 8-pin on the rear end
    board.add(boxBetween(118, 134, 28, 46, -1, 10, [
        mats.powerFace, mats.plastic, mats.plastic, mats.plastic, mats.plastic, mats.plastic,
    ]));

    // ---- Backplate -------------------------------------------------------
    const { backplate } = parts;
    const bp = new THREE.Mesh(new RoundedBoxGeometry(250, 98, 2, 2, 0.8), mats.backplate);
    bp.position.set(-5, 0, -5.2);
    bp.rotation.y = Math.PI; // texture faces outward
    backplate.add(bp);
    const screwGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.8, 16);
    screwGeo.rotateX(Math.PI / 2);
    const screwPts = [[-120, -40], [-120, 40], [-70, -28], [-20, -28], [-70, 28], [-20, 28], [110, -40], [110, 40]];
    const screws = new THREE.InstancedMesh(screwGeo, mats.screw, screwPts.length);
    screwPts.forEach(([x, y], i) => {
        m4.makeTranslation(x, y, -6.5);
        screws.setMatrixAt(i, m4);
    });
    backplate.add(screws);

    // ---- Cooler: vapor chamber + heat pipes ------------------------------
    const { cooler } = parts;
    const vc = new THREE.Mesh(new RoundedBoxGeometry(100, 90, 3.6, 2, 1.2), mats.copper);
    vc.position.set(-45, 0, 2.9);
    cooler.add(vc);
    const pipeGeo = new THREE.CylinderGeometry(3, 3, 210, 20);
    pipeGeo.rotateZ(Math.PI / 2);
    [-30, -10, 10, 30].forEach((y) => {
        const p = new THREE.Mesh(pipeGeo, mats.copper);
        p.position.set(5, y, 7.5);
        cooler.add(p);
    });

    // ---- Fin stack -------------------------------------------------------
    const { fins } = parts;
    const finCount = 46;
    const finStack = new THREE.InstancedMesh(new THREE.BoxGeometry(236, 0.35, 25), mats.fins, finCount);
    for (let i = 0; i < finCount; i++) {
        m4.makeTranslation(-3, -45 + i * 2, 18.5);
        finStack.setMatrixAt(i, m4);
    }
    fins.add(finStack);
    // Fin stack side rails
    fins.add(boxBetween(-121, 115, -47.5, -46.5, 6, 31, mats.fins));
    fins.add(boxBetween(-121, 115, 46.5, 47.5, 6, 31, mats.fins));

    // ---- Shroud ----------------------------------------------------------
    const { shroud } = parts;
    const face = new THREE.Mesh(
        new THREE.ExtrudeGeometry(chamferedRect(-129, 129, -51, 51, 6), {
            depth: 2.4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 3,
        }),
        mats.gunmetal,
    );
    face.position.z = 31.4;
    shroud.add(face);
    shroud.add(boxBetween(-129, 129, 50, 53, 0, 34, mats.gunmetal));
    shroud.add(boxBetween(-129, 129, -53, -50, 0, 34, mats.gunmetal));

    // Faceted chevron shards — each split at y=0 and tilted to form a ridge
    const shardsTop = [
        [[-127, 0], [-127, 49], [-60, 49], [-25, 0]],
        [[-13, 0], [-48, 49], [20, 49], [55, 0]],
        [[67, 0], [32, 49], [127, 49], [127, 0]],
    ];
    const tilt = 0.09;
    shardsTop.forEach((pts, si) => {
        [1, -1].forEach((sign) => {
            const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y * sign)));
            const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, shardExtrude), si === 1 ? mats.graphite : mats.silver);
            const pivot = new THREE.Group();
            pivot.position.z = 35.2;
            pivot.rotation.x = -tilt * sign;
            pivot.add(mesh);
            shroud.add(pivot);
        });
    });

    // Glowing chevrons in the gaps between shards
    const stripGroup = new THREE.Group();
    const chevrons = [
        [[-54, 48], [-19, 0], [-54, -48]],
        [[26, 48], [61, 0], [26, -48]],
    ];
    chevrons.forEach(([a, b, c]) => {
        stripGroup.add(stripSegment(a, b, 34.6, mats.strip));
        stripGroup.add(stripSegment(b, c, 34.6, mats.strip));
    });
    shroud.add(stripGroup);

    // Wordmark on the top edge
    const word = new THREE.Mesh(new THREE.PlaneGeometry(150, 18.75), mats.wordmark);
    word.rotation.x = -Math.PI / 2;
    word.position.set(10, 53.05, 17);
    shroud.add(word);

    // ---- Bracket ---------------------------------------------------------
    const { bracket } = parts;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(44, 124), mats.bracket);
    plate.rotation.y = Math.PI / 2;
    plate.position.set(-134, -2, 15);
    bracket.add(plate);
    bracket.add(boxBetween(-147, -134, 59.2, 60, -7, 37, mats.steel)); // screw tab
    bracket.add(boxBetween(-134.4, -133.6, -76, -64, 3, 11, mats.steel)); // tongue

    // ---- Anchors for HTML callouts -------------------------------------
    const anchors = {
        die: anchor(board, -45, 0, 1.2),
        memory: anchor(board, -24, -38, 0.2),
        vrm: anchor(board, 70, 18, 5),
        pcie: anchor(board, -50, -56, -1),
        power: anchor(board, 134, 37, 4),
        cooler: anchor(cooler, -98, 30, 10),
        fins: anchor(fins, 112, -30, 31),
        shroud: anchor(shroud, -110, 30, 37),
        backplate: anchor(backplate, -110, -40, -6),
        bracket: anchor(bracket, -134, 50, 30),
    };

    // Rest positions + exploded offsets (mm)
    const explodeOffsets = {
        // Fanned diagonally so every layer stays visible from a near-frontal view
        backplate: new THREE.Vector3(-60, -92, -34),
        board: new THREE.Vector3(0, 0, 0),
        cooler: new THREE.Vector3(60, 92, 34),
        fins: new THREE.Vector3(120, 184, 68),
        shroud: new THREE.Vector3(180, 276, 102),
        bracket: new THREE.Vector3(-45, 0, 0),
    };
    // Keep the exploded stack centred on the card's origin
    const explodeCenter = new THREE.Vector3(60, 92, 34);

    const setExplode = (t) => {
        Object.entries(parts).forEach(([name, group]) => {
            group.position.copy(explodeOffsets[name]).sub(explodeCenter).multiplyScalar(t);
        });
    };

    return { card, parts, anchors, setExplode, stripGroup };
}

// The chassis board the four cards dock into
export function buildMotherboard(slotZs) {
    const mbMat = new THREE.MeshStandardMaterial({
        map: tex.motherboardTexture(), roughness: 0.7, metalness: 0.2, transparent: true, opacity: 0,
    });
    const slotMat = new THREE.MeshStandardMaterial({
        color: 0x0d0e10, roughness: 0.55, metalness: 0.1, transparent: true, opacity: 0,
    });
    const group = new THREE.Group();
    const mb = new THREE.Mesh(new THREE.BoxGeometry(360, 2, 300), mbMat);
    mb.position.set(0, -65, 0);
    group.add(mb);
    slotZs.forEach((z) => {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(92, 10, 7.5), slotMat);
        slot.position.set(-50.5, -59, z - 1.8);
        group.add(slot);
    });
    group.userData.materials = [mbMat, slotMat];
    return group;
}
