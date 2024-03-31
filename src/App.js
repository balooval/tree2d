import { BaseRender, setOutputCanvas, changeScale, canvasToWorldPosition } from './renderer/BaseRender.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';
import RBush from '../vendor/rbush.js';
import Attractor from './Attractor.js';
import RBushKnn from '../vendor/rbush-knn.js';
import {presets} from './Tree.js';
import * as UiControls from './UiControls.js';
import * as UiMouse from './UiMouse.js';
import UiCut from './UiCut.js';
import * as ImageLoader from './ImageLoader.js';

const rbushAttractors = new RBush();
const rbushBranchs = new RBush();

const illuminatedBranchs = new Set();
let attractors = [];

const treesList = [];
const treesSolo = [];
const treeLayer = new BaseRender();
const lightLayer = new BaseRender();
const lightSource = new LightDirectional(new Vector(0, 0), new Vector(0, 20));
const treeRender = new TreeRender(treeLayer, lightSource);
const lightRender = new LightRender(lightLayer);

const currentPreset = presets['typeA'];

let canvasId = null;
let canvas = null;
let context = null;
let run = false;
let applyBend = true;

const backgroundColor = 'rgb(200, 200, 200)';
// const backgroundColor = 'rgb(100, 100, 100)';
// const backgroundColor = 'rgb(10, 10, 10)';
// const backgroundColor = 'rgb(74, 110, 144)';

export function init(_canvasId) {
    canvasId = _canvasId;
    
    ImageLoader.loadBatch([
        {
            id: 'leaf2',
            url: './assets/leaf2.png',
        },
        {
            id: 'leaf3',
            url: './assets/leaf3.png',
        },
        {
            id: 'leaf4',
            url: './assets/leaf4.png',
        },
    ]).then(start);
}

function start() {
    UiMouse.init(canvasId);
    canvas = document.getElementById(canvasId);
    context = canvas.getContext('2d');
    clearCanvas();
    
    setOutputCanvas(canvas);
    treeLayer.init();
    lightLayer.init();
    UiCut.init(canvas, updateTrees);
    UiControls.init(treeRender, currentPreset);
    UiControls.setPreset(currentPreset);

    const groundPosition = 200;

    treesSolo.push(new Tree(new Vector(0, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(-560, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(-400, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(-230, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(320, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(600, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(710, groundPosition), currentPreset));

    treesList.push(treesSolo);

    setMouseRunMode(true);

    document.getElementById('cutMode').addEventListener('change', evt => setMouseCutMode(evt.target.checked));
    document.getElementById('applyBend').addEventListener('change', onApplyBendChanged);
    document.getElementById('presetTypeA').addEventListener('change', onTreeTypeSelectChanged);
    document.getElementById('presetTypeB').addEventListener('change', onTreeTypeSelectChanged);
    document.body.addEventListener('keyup', onKeyUp);
    document.getElementById(canvasId).addEventListener('wheel', onMouseWheel);

    onFrame();
}

function setMouseCutMode(state) {
    if (state === true) {
        setMouseRunMode(false);
        UiCut.start();
    } else {
        setMouseRunMode(true);
        UiCut.stop();
    }
}

function setMouseRunMode(state = true) {
    if (state === true) {
        document.getElementById(canvasId).addEventListener('mousedown', onMouseDown);
        document.getElementById(canvasId).addEventListener('mouseup', onMouseUp);
    } else {
        document.getElementById(canvasId).removeEventListener('mousedown', onMouseDown);
        document.getElementById(canvasId).removeEventListener('mouseup', onMouseUp);
    }
}

function onApplyBendChanged() {
    applyBend = document.getElementById('applyBend').checked;
}

function onTreeTypeSelectChanged() {
    const typeBChecked = document.getElementById('presetTypeB').checked;

    let treeType = 'typeA';
    if (typeBChecked === true) {
        treeType = 'typeB';
    }

    treesSolo[0].preset = presets[treeType];
    UiControls.setPreset(presets[treeType]);
}

function onKeyUp(evt) {
    if (evt.code === 'Space') {
        updateTrees();
    
    } else if (evt.key === 'c') {
        testDrawLeaves();
    }
}

function testDrawLeaves() {
    for (const trees of treesList) {
        trees.forEach(tree => treeRender.testLeaves(tree));
    }
    treeLayer.drawIntoContext(context);
}

function onMouseDown() {
    run = true;
}

function onMouseUp(evt) {
    run = false;
    testDrawLeaves();
}

function onFrame() {
    if (run === true) {
        updateTrees();
    }

    updateScreen();

    UiCut.draw();

    requestAnimationFrame(onFrame);
}

function updateScreen() {
    clearCanvas();
    lightLayer.clear();
    lightRender.draw(lightSource);

    treeLayer.drawIntoContext(context);
    lightLayer.drawIntoContext(context);
}

function updateTrees() {
    for (const trees of treesList) {
        treeGrow(trees);
    }
    
    drawTrees();
}

function drawTrees() {
    treeLayer.clear();
    for (const trees of treesList) {
        trees.forEach(tree => treeRender.draw(tree));
    }
}

function treeGrow(trees) {
    rbushAttractors.clear();
    rbushBranchs.clear();

    const lightPosition = canvasToWorldPosition(new Vector(UiMouse.mousePosition[0], UiMouse.mousePosition[1]));
    lightSource.reset(new Vector(lightPosition[0], lightPosition[1]));

    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));
    indexBranchs(branchs);
    UiCut.setBranches(rbushBranchs);
    lightSource.emit(rbushBranchs);

    attractors = createAttractors(lightSource.getPhotons());

    branchs.forEach(branch => branch.clearAttractors());
    
    branchs.forEach(branch => attachBranchToAttractors(branch));
    attachAttractorsToBranch(attractors);
    
    trees.forEach(tree => tree.startCycle());
    branchs.forEach(branch => branch.startCycle());

    for (let branch of illuminatedBranchs) {
        branch.takeLight();
    }

    trees.forEach(tree => tree.distributeEnergy());
    trees.forEach(tree => tree.prune());
    if (applyBend) {
        trees.forEach(tree => tree.bendBranches());
    }

    trees.forEach(tree => tree.endCycle());
}

function indexBranchs(branchs) {
    const items = [];

    for (let i = 0; i < branchs.length; i ++) {
        const branch = branchs[i];

        const branchBbox = {
            minX: Math.min(branch.start.x, branch.end.x),
            maxX: Math.max(branch.start.x, branch.end.x),
            minY: Math.min(branch.start.y, branch.end.y),
            maxY: Math.max(branch.start.y, branch.end.y),
            branch: branch,
        };

        items.push(branchBbox);
    }
    
    rbushBranchs.load(items);
}

function attachBranchToAttractors(branch) {
    const nearAttractors = RBushKnn(rbushAttractors, branch.end.x, branch.end.y, undefined, undefined, branch.maxLightDistance);
    nearAttractors.forEach(attractorItem => attractorItem.attractor.attachBranchIfNeeded(branch));
}

function attachAttractorsToBranch(attractors) {

    illuminatedBranchs.clear();

    for (let i = 0; i < attractors.length; i ++) {
        const attractor = attractors[i];
        const branch = attractor.nearestBranch;
        if (branch === null) {
            continue;
        }
        branch.attractors.push(attractor);
        illuminatedBranchs.add(branch);
    }
}

function createAttractors(photons) {

    const attractors = [];
    const items = [];

    for (let i = 0; i < photons.length; i ++) {
        const photon = photons[i];
        const attractor = new Attractor(photon.position, photon.orientation);
        attractors.push(attractor);

        items.push({
            minX: photon.position.x,
            maxX: photon.position.x,
            minY: photon.position.y,
            maxY: photon.position.y,
            attractor: attractor,
        });
    }
    
    rbushAttractors.load(items);


    return attractors;
}

function onMouseWheel(evt) {
    changeScale(evt.deltaY);
    drawTrees();
}

function clearCanvas() {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

