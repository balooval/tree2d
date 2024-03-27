import Render from './renderer/Render.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightLayer from './renderer/LightLayer.js'
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';
import RBush from '../vendor/rbush.js';
import Attractor from './Attractor.js';
import RBushKnn from '../vendor/rbush-knn.js';
import {presets} from './Tree.js';
import * as UiControls from './UiControls.js';
import * as UiMouse from './UiMouse.js';
import UiCut from './UiCut.js';

const rbushAttractors = new RBush();
const rbushBranchs = new RBush();

const illuminatedBranchs = new Set();
let attractors = [];

const treesList = [];
const treesSolo = [];
const treeRender = new TreeRender(Render);
const lightSource = new LightDirectional(new Vector(0, 0), new Vector(0, 20));

const currentPreset = presets['typeB'];

let canvasId = null;
let canvas = null;
let context = null;
let run = false;
let applyBend = true;

// const backgroundColor = 'rgb(100, 100, 100)';
const backgroundColor = 'rgb(10, 10, 10)';

export function init(_canvasId) {
    canvasId = _canvasId;
    UiMouse.init(canvasId);
    canvas = document.getElementById(canvasId);
    context = canvas.getContext('2d');
    clearCanvas();
    
    
    Render.init(canvas);
    UiCut.init(canvas, onCutBranch);
    UiControls.init(treeRender, currentPreset);
    UiControls.setPreset(currentPreset);
    LightLayer.init(canvasId);

    const groundPosition = 50;

    treesSolo.push(new Tree(new Vector(0, 0), currentPreset));

    treesList.push(treesSolo);

    setMouseRunMode(true);

    document.getElementById('cutMode').addEventListener('change', evt => setMouseCutMode(evt.target.checked));
    document.getElementById('applyBend').addEventListener('change', onApplyBendChanged);
    document.getElementById('presetTypeA').addEventListener('change', onTreeTypeSelectChanged);
    document.getElementById('presetTypeB').addEventListener('change', onTreeTypeSelectChanged);
    document.body.addEventListener('keyup', onKeyUp);

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

function onFrame() {
    clearCanvas();

    if (run === true) {
        play();
    }

    Render.draw(context);

    requestAnimationFrame(onFrame);
}

function onKeyUp(evt) {
    if (evt.code === 'Space') {
        play();
    }
}

function onMouseDown() {
    run = true;
}
function onMouseUp(evt) {
    run = false;
}

function onCutBranch() {
    Render.clear();
    for (const trees of treesList) {
        trees.forEach(tree => treeRender.draw(tree));
    }
}

function play() {
    for (const trees of treesList) {
        treeGrow(trees);
    }
}

function treeGrow(trees) {
    
    rbushAttractors.clear();
    rbushBranchs.clear();

    const lightPosition = Render.canvasToWorldPosition(new Vector(UiMouse.mousePosition[0], UiMouse.mousePosition[1]));
    lightSource.reset(new Vector(lightPosition[0], lightPosition[1]));

    LightLayer.clear();
    Render.clear();
    
    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));
    indexBranchs(branchs);
    UiCut.setBranches(rbushBranchs);
    lightSource.emit(rbushBranchs);
    LightRender.draw(lightSource);
    LightLayer.draw();

    attractors = createAttractors(lightSource.getPhotons());

    branchs.forEach(branch => branch.clearAttractors());
    
    branchs.forEach(branch => attachBranchToAttractors(branch));
    attachAttractorsToBranch(attractors);
    
    trees.forEach(tree => tree.startCycle());
    branchs.forEach(branch => branch.startCycle());

    for (let branch of illuminatedBranchs) {
        branch.askEnergy();
    }

    trees.forEach(tree => tree.distributeEnergy());
    trees.forEach(tree => tree.prune());
    trees.forEach(tree => tree.bendBranches());

    trees.forEach(tree => treeRender.draw(tree));
    trees.forEach(tree => tree.endCycle());

    // Render.draw(context);

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

function clearCanvas() {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

