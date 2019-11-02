import * as THREE from 'https://unpkg.com/three@0.108.0/build/three.module.js';

var dims = {width: 0.2, height: 3.0,depth: 0.35}
dims.rotation = -0.15;
dims.gap = dims.width * 0.1;
dims.sharp = {
    width: dims.width * 0.75,
    height: dims.height * 2. / 3.,
    depth: dims.depth * 1. / 7.
}
const rotOff = 0.05;

//Named Color constants (for convenience)
const TEAL = 0x008080;
const BLACK = 0x000000;
const PIANO_BLACK = 0x1C110F;
const WHITE = 0xFFFFFF;
const BROWN = 0x654321;

const KEYDOWN_COLOR = TEAL;

export function renderPiano(canvas, numOctaves, octaveStart) {
    if (numOctaves === undefined) numOctaves = 3;
    if (octaveStart === undefined || octaveStart === null) octaveStart = 3;

    const numKeys = numOctaves*8 - (numOctaves - 1);
    const totWidth = dims.width*numKeys + dims.gap*(numKeys-1);
    const startX = -totWidth/2;

    const camera = new THREE.PerspectiveCamera(75);
    camera.position.z = 4.0;
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
    const scene = new THREE.Scene();

    const light = new THREE.DirectionalLight(WHITE,1.25);
    light.position.set(0, 2, 4);
    scene.add(light);


    let {keys} = keyboard(startX, numOctaves, octaveStart);
    keys.forEach(key => {scene.add(key);});

    keys.forEach(key => {
        key.keyDown = keyDown;
        key.keyUp = keyUp;

        key.timedPress = (duration) => {
            key.keyDown();
            renderer.render(scene, camera);
            setTimeout(() => {
                key.keyUp();
                renderer.render(scene, camera);
            }, duration);
        }
    });

    keys.get = get;
    renderer.render(scene, camera);

    return {keys, scene, camera,renderer};
}

export function play(piano, note, duration) {
    let {keys, scene, camera, renderer} = piano;
    note = note.toLowerCase();
    keys.get(note).timedPress(duration);
}

export function demoPlay(piano) {
    let {keys} = piano;
    var i = 0;
    return setInterval(() => {
        play(piano, keys[i].pitch, 250);
        i = (i+1) % keys.length;
    }, 1000);
}



function keyDown() {
    const key = this;
    key.rotation.x += rotOff;
    key.prevColor = key.material.color.getHex();;
    key.material.color.setHex(KEYDOWN_COLOR);
}
function keyUp() {
    const key = this;
    key.rotation.x -= rotOff;
    key.material.color.setHex(key.prevColor);
}

function get(id) { // "a#3"
    const keys = this;
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        if (id === key.pitch || id === key.altPitch) return key;
    }
    return null;
    
}


const letters = ["a", "b", "c", "d", "e", "f", "g", "a"];

const sharpIndices = [
    1, //A-sharp/B-flat
    3, //C-sharp/D-flat
    4, //D-sharp/E-flat
    6, //F-sharp/G-flat
    7, //G-sharp/A-flat
];

function keyboard(startX, numOctaves, octaveStart) {
    let {gap} = dims;
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
    let {width, gap} = dims;
    let keys = [];

    const numWhite = fullEight ? 8 : 7;
    for (let i = 0; i < numWhite; ++i) {
        let k = whiteKey(); k.position.x = startX + i*(width+gap);

        if (i === 7) k.pitch = `${letters[i]}${octaveNo + 1}`;
        else         k.pitch = `${letters[i]}${octaveNo}`;

        k.altPitch = k.pitch;

        keys.push(k);
    }

    const inds = sharpIndices.slice(0, sharpIndices.length);
    for (let i = 0; i < inds.length; ++i) {
        let ind = inds[i];
        let k = sharpKey();
        k.position.x = startX + ind*(width + gap) - gap/2 - dims.sharp.width/2
        k.position.y += (dims.height - dims.sharp.height) / 2;
        k.position.z += dims.depth / 2; //FIXME: Hardcoding

        if (letters[ind] === "a") k.pitch = toId(letters[ind], octaveNo+1, "b");
        else                      k.pitch = toId(letters[ind], octaveNo, "b" );
        k.altPitch = toId(letters[ind-1], octaveNo, "#");

        keys.push(k);
    }

    keys.forEach(key => {
        key.rotation.x = dims.rotation;
    });

    let octWidth = numWhite*width + (numWhite-1)*gap;
    return {keys, width:octWidth};
}

function toId(pitch, octave, sign) {
    if (sign === undefined) sign = "";
    return `${pitch}${sign}${octave}`;
}


function whiteKey() {
    let k = _key({...dims, color: WHITE});
    return k;
}
function sharpKey() {
    let color = PIANO_BLACK;
    let k = _key({...dims.sharp, color});
    return k;
}

function _key({width, height, depth, color}){
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({color});
    return new THREE.Mesh(geometry, material);
}