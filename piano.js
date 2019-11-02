import * as THREE from 'https://unpkg.com/three@0.108.0/build/three.module.js';

const ratios = {
    width: 0.2,
    height: 3.0,
    depth: 0.35,
    gap: 0.020,
    sharp: {
        width: 0.15,
        height: 2.00,
        depth: .05
    }
}
const rotation = -0.15;

const PIANO_BLACK = 0x1C110F;
const BLACK = 0x000000;
const WHITE = 0xFFFFFF;
const BROWN = 0x654321;


export function renderPiano(canvas, numOctaves, octaveStart) {
    if (numOctaves === undefined) numOctaves = 3;
    if (octaveStart === undefined || octaveStart === null) octaveStart = 3;

    const numKeys = numOctaves*8 - (numOctaves - 1);
    const totWidth = ratios.width*numKeys + ratios.gap*(numKeys-1);
    const startX = -totWidth/2;

    const camera = new THREE.PerspectiveCamera(75);
    camera.position.z = 4.0;
    const renderer = new THREE.WebGLRenderer({canvas});
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BLACK);

    const light = new THREE.DirectionalLight(WHITE,1.25);
    light.position.set(0, 2, 4);
    scene.add(light);


    let {keys} = keyboard(startX, numOctaves, octaveStart);
    keys.forEach(key => {scene.add(key);});

    keys.forEach(key => {
        key.press = (duration) => {
            const rotOff = 0.05;
            key.rotation.x += rotOff;
            renderer.render(scene, camera);
            setTimeout(() => {
                key.rotation.x -= rotOff;
                renderer.render(scene, camera);
            }, duration);
        }
    })
    renderer.render(scene, camera);
    return {keys, scene, camera,renderer};
}

const letters = ["A", "B", "C", "D", "E", "F", "G", "A"];

const sharpIndices = [
    1, //A-sharp/B-flat
    3, //C-sharp/D-flat
    4, //D-sharp/E-flat
    6, //F-sharp/G-flat
    7, //G-sharp/A-flat
];





function keyboard(startX, numOctaves, octaveStart) {
    let {gap} = ratios;
    let nextStart = startX;
    let fullKeys = [];
    for (let i = 0; i < numOctaves; ++i) {
        const octaveNo = octaveStart + i;
        const fullEight = i == numOctaves - 1;
        let {keys, width} = octave(nextStart,fullEight, octaveNo);
        fullKeys.push(...keys);
        nextStart += gap + width;
    }
    
    return {keys:fullKeys};
}
function octave(startX, fullEight, octaveNo) {
    if (fullEight === undefined) fullEight = false;
    let {width, gap} = ratios;
    let keys = [];

    const numWhite = fullEight ? 8 : 7;
    for (let i = 0; i < numWhite; ++i) {
        let k = whiteKey(); k.position.x = startX + i*(width+gap);
        k.pitch = `${letters[i]}${octaveNo}`
        keys.push(k);
    }

    const inds = sharpIndices.slice(0, sharpIndices.length);
    for (let i = 0; i < inds.length; ++i) {
        let ind = inds[i];
        let k = sharpKey();
        k.position.x = startX + ind*(width + gap) - gap/2 - ratios.sharp.width/2
        k.position.y += (ratios.height - ratios.sharp.height) / 2;
        k.position.z += ratios.depth / 2;
        k.pitch = `${letters[ind]}${octaveNo}b`;
        keys.push(k);
    }

    keys.forEach(key => {
        key.rotation.x = rotation;
    });

    let octWidth = numWhite*width + (numWhite-1)*gap;
    return {keys, width:octWidth};
}


function whiteKey() {
    let k = _key({...ratios, color: WHITE});
    return k;
}
function sharpKey() {
    let color = PIANO_BLACK;
    let k = _key({...ratios.sharp, color});
    return k;
}

function _key({width, height, depth, color}){
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({color});//new THREE.MeshBasicMaterial({color});
    return new THREE.Mesh(geometry, material);
}