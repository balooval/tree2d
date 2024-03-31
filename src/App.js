import { BaseRender, setOutputCanvas, changeScale, canvasToWorldPosition } from './renderer/BaseRender.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';
import { presets } from './Tree.js';
import { treeGrowUpdate } from './TreesUpdater.js';
import * as UiControls from './UiControls.js';
import * as UiMouse from './UiMouse.js';
import UiCut from './UiCut.js';
import * as ImageLoader from './ImageLoader.js';


const treesList = [];
const treesSolo = [];
const treeLayer = new BaseRender();
const lightLayer = new BaseRender();
const lightSource = new LightDirectional(new Vector(0, 500), new Vector(0, 20));
const treeRender = new TreeRender(treeLayer, lightSource);
const lightRender = new LightRender(lightLayer);

const heavyProcesses = new Map();

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
    UiControls.init(treeRender, onPresetChanged);
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
    }
}

function onMouseDown() {
    run = true;
}

function onMouseUp(evt) {
    run = false;
}

function onPresetChanged() {
    updateTrees();
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

function drawLeaves() {
    for (const trees of treesList) {
        trees.forEach(tree => treeRender.drawHighQualityLeaves(tree));
    }
}

function updateTrees() {
    for (const trees of treesList) {
        treeGrowUpdate(trees, lightSource, applyBend);
    }
    
    drawTrees();
}

function drawTrees() {
    treeLayer.clear();
    for (const trees of treesList) {
        trees.forEach(tree => treeRender.draw(tree));
    }

    queueHeavyProcess(drawLeaves);
}

function onMouseWheel(evt) {
    changeScale(evt.deltaY);
    drawTrees();
}

function clearCanvas() {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
}


function queueHeavyProcess(process) {
    let timeoutId = heavyProcesses.get(process);
    
    if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(process, 200);
    heavyProcesses.set(process, timeoutId);
}