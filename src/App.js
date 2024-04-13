import { BaseRender, setOutputCanvas, changeScale, intCanvasToWorldPosition } from './renderer/BaseRender.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';
import { presets } from './Tree.js';
import { treeGrowUpdate } from './TreesUpdater.js';
import * as UiControls from './UiControls.js';
import * as UiMouse from './UiMouse.js';
import UiLightMode from './UiLightMode.js';
import UiCut from './UiCut.js';
import UiBend from './UiBend.js';
import { LeafDrawer3d, leavesPresets } from './renderer/LeavesDrawer3d.js';
import TrunkRender3d from './renderer/TrunkRender3d.js';
import * as Render3D from './renderer/Render3d.js';
import { Butterfly } from './Butterfly.js';
import { BackgroundGrass } from './BackgroundGrass.js';


const groundPosition = 70;
const treesList = [];
const treesSolo = [];
const lightSource = new LightDirectional(0, 500, 0, 200);
const treeLayer = new BaseRender();
const leafLayer = new BaseRender();
const backgroundGrass = new BackgroundGrass(groundPosition);
const trunkRender = new TrunkRender3d(treeLayer, lightSource);
const treeRender = new TreeRender(treeLayer, lightSource, trunkRender, backgroundGrass);
const lightLayer = new BaseRender();
const lightRender = new LightRender(lightLayer);

const heavyProcesses = new Map();

const currentPreset = presets['typeA'];

let canvasId = null;
let canvas = null;
let context = null;

let canvas3D;
const butterflies = [];

let currentMouseMode = null;
const mouseModes = {
    lightMode: null,
    cutMode: null,
    bendMode: null,
};

const backgroundColor = 'rgb(200, 200, 200)';

export function init(_canvasId) {
    canvasId = _canvasId;
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
    UiLightMode.init(canvas, lightSource, updateTrees);
    UiCut.init(canvas, updateTrees);
    UiBend.init(canvas, updateTrees);

    mouseModes.lightMode = UiLightMode;
    mouseModes.cutMode = UiCut;
    mouseModes.bendMode = UiBend;

    currentMouseMode = UiLightMode;
    currentMouseMode.start();
    
    UiControls.init(treeRender, onPresetChanged);
    UiControls.setPreset(currentPreset);

    treesSolo.push(new Tree(0, groundPosition, currentPreset));
    // treesSolo.push(new Tree(-560, groundPosition, currentPreset));
    // treesSolo.push(new Tree(new Vector(-400, groundPosition), currentPreset));
    // treesSolo.push(new Tree(-230, groundPosition, currentPreset));
    // treesSolo.push(new Tree(200, groundPosition, currentPreset));
    // treesSolo.push(new Tree(new Vector(600, groundPosition), currentPreset));
    // treesSolo.push(new Tree(new Vector(710, groundPosition), currentPreset));

    treesList.push(treesSolo);

    document.getElementById('btn-reset-tree').addEventListener('change', resetTree);

    document.getElementById('lightMode').addEventListener('change', changeMouseMode);
    document.getElementById('cutMode').addEventListener('change', changeMouseMode);
    document.getElementById('bendMode').addEventListener('change', changeMouseMode);
    document.getElementById('presetTypeA').addEventListener('change', onTreeTypeSelectChanged);
    document.getElementById('presetTypeB').addEventListener('change', onTreeTypeSelectChanged);

    document.getElementById('presetLeavesStandard').addEventListener('change', onLeavesPresetChanged);
    document.getElementById('presetLeavesTige').addEventListener('change', onLeavesPresetChanged);
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
    
    onFrame();
}

function resetTree() {
    treesSolo[0] = new Tree(0, groundPosition, currentPreset);
    drawTrees();
}

function changeMouseMode() {
    const selectedMode = document.querySelector('input[name="mouseMode"]:checked').id;
    currentMouseMode.stop();
    currentMouseMode = mouseModes[selectedMode];
    currentMouseMode.start();
}

function onLeavesPresetChanged() {
    const leafType = document.querySelector('input[name="leavesPreset"]:checked').value;
    treesSolo[0].preset.leavesPreset = leafType;

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

    switch (evt.key) {
        case 'l':
            document.getElementById('lightMode').checked = true;
            changeMouseMode();
        break;
        case 'b':
            document.getElementById('bendMode').checked = true;
            changeMouseMode();
        break;
        case 'c':
            document.getElementById('cutMode').checked = true;
            changeMouseMode();
        break;
    }
}

function onPresetChanged() {
    drawTrees();
}

function onFrame() {
    if (document.hasFocus() === true) {
        butterflies.forEach(butterfly => butterfly.update());
        for (const trees of treesList) {
            trees.forEach(tree => treeRender.update(tree));
        }
    }
    
    updateScreen();
    
    currentMouseMode.update();
    
    
    // leafDrawer.update();

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
        treeGrowUpdate(trees, lightSource);
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
    Render3D.changeScale();
    // drawTrees();
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