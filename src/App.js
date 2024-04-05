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
import { LeafDrawer } from './renderer/LeavesDrawer.js';
import { GrassDrawer } from './renderer/GrassDrawer.js';
import TrunkRender from './renderer/TrunkRender.js';
import * as Render3D from './renderer/Render3d.js';
import { Butterfly } from './Butterfly.js';
import { BackgroundGrass } from './BackgroundGrass.js';


const groundPosition = 100;
const treesList = [];
const treesSolo = [];
const lightSource = new LightDirectional(0, 500, 0, 20);
const treeLayer = new BaseRender();
const leafLayer = new BaseRender();
const trunkRender = new TrunkRender(treeLayer, lightSource);
const leafDrawer = new LeafDrawer(leafLayer, lightSource, treeLayer);
const grassDrawer = new GrassDrawer(treeLayer, lightSource);
const treeRender = new TreeRender(treeLayer, lightSource, trunkRender, leafDrawer, grassDrawer);
const lightLayer = new BaseRender();
const lightRender = new LightRender(lightLayer);

const heavyProcesses = new Map();

const currentPreset = presets['typeA'];

let canvasId = null;
let canvas = null;
let context = null;
let run = false;
let applyBend = true;

let canvas3D;
const butterflies = [];
let backgroundGrass;

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

    canvas3D = document.createElement('canvas');
    canvas3D.width = canvas.width;
    canvas3D.height = canvas.height;
    Render3D.init(canvas3D);
    
    leafLayer.init();
    treeLayer.init();
    lightLayer.init();
    UiCut.init(canvas, updateTrees);
    UiControls.init(treeRender, onPresetChanged);
    UiControls.setPreset(currentPreset);


    treesSolo.push(new Tree(0, groundPosition, currentPreset));
    // treesSolo.push(new Tree(new Vector(-560, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(-400, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(-230, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(320, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(600, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(710, groundPosition), currentPreset));

    treesList.push(treesSolo);

    setMouseRunMode(true);

    document.getElementById('btn-reset-tree').addEventListener('change', resetTree);
    document.getElementById('cutMode').addEventListener('change', evt => setMouseCutMode(evt.target.checked));
    document.getElementById('applyBend').addEventListener('change', onApplyBendChanged);
    document.getElementById('presetTypeA').addEventListener('change', onTreeTypeSelectChanged);
    document.getElementById('presetTypeB').addEventListener('change', onTreeTypeSelectChanged);

    document.getElementById('presetLeavesStandard').addEventListener('change', onLeavesPresetChanged);
    document.getElementById('presetLeavesSpike').addEventListener('change', onLeavesPresetChanged);

    document.body.addEventListener('keyup', onKeyUp);
    document.getElementById(canvasId).addEventListener('wheel', onMouseWheel);

    butterflies.push(
        new Butterfly(0, groundPosition + 100),
        new Butterfly(0, groundPosition + 100),
        new Butterfly(0, groundPosition + 100),
        new Butterfly(0, groundPosition + 100),
        new Butterfly(0, groundPosition + 100),
    );
    
    
    backgroundGrass = new BackgroundGrass(groundPosition);

    onFrame();
}

function resetTree() {
    grassDrawer.reset();
    treesSolo[0] = new Tree(0, groundPosition, currentPreset);
    drawTrees();
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

function onLeavesPresetChanged() {
    const typeBChecked = document.getElementById('presetLeavesSpike').checked;

    let leavesType = 'standard';
    if (typeBChecked === true) {
        leavesType = 'spike';
    }

    treesSolo[0].preset.leavesPreset = leavesType;

    drawTrees();
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

    if (document.hasFocus() === true) {
        backgroundGrass.update();
        butterflies.forEach(butterfly => butterfly.update());
    }

    updateScreen();

    UiCut.draw();

    requestAnimationFrame(onFrame);
}

function updateScreen() {
    clearCanvas();

    Render3D.update();
    Render3D.drawIntoContext(context);

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