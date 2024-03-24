import Render from './renderer/Render.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightLayer from './renderer/LightLayer.js'
import Light from './Light.js';
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';
import RBush from '../vendor/rbush.js';
import RBushKnn from '../vendor/rbush-knn.js';
import {presets} from './Tree.js';
import * as Ui from './Ui.js';

const rbushAttractors = new RBush();
const rbushBranchs = new RBush();

const illuminatedBranchs = new Set();
let attractors = [];

const treesSolo = [];
const treeRender = new TreeRender(Render);
const lightSource = new LightDirectional(new Vector(0, 0), new Vector(0, 20));

const currentPreset = presets['typeB'];

let canvasId = null;
let canvas = null;
let context = null;
let run = false;
let applyBend = true;
const mousePosition = [400, 100];
let mouseMode = null;
let cutPoints = [];

// const backgroundColor = 'rgb(100, 100, 100)';
const backgroundColor = 'rgb(10, 10, 10)';

export function init(_canvasId) {
    canvasId = _canvasId;
    canvas = document.getElementById(canvasId);
    context = canvas.getContext('2d');
    clearCanvas();


    Render.init(canvas);
    Ui.init(treeRender, currentPreset);
    Ui.setPreset(currentPreset);
    LightLayer.init(canvasId);
    mousePosition[0] = Render.sceneWidth / 2;

    const groundPosition = 50;

    treesSolo.push(new Tree(new Vector(0, 0), currentPreset));

    setMouseRunMode(true);

    document.getElementById('cutMode').addEventListener('change', evt => setMouseCutMode(evt.target.checked));
    document.getElementById('applyBend').addEventListener('change', onApplyBendChanged);
    document.getElementById('presetTypeA').addEventListener('change', onTreeTypeSelectChanged);
    document.getElementById('presetTypeB').addEventListener('change', onTreeTypeSelectChanged);
    document.getElementById(canvasId).addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('keyup', onKeyUp);

    onFrame();
}

function setMouseCutMode(state) {
    if (state === true) {
        setMouseRunMode(false);
        mouseMode = 'CUT';
        cutPoints = [];
        document.getElementById(canvasId).addEventListener('mouseup', addCutPoint);
    } else {
        setMouseRunMode(true);
        document.getElementById(canvasId).removeEventListener('mouseup', addCutPoint);
    }
}

function setMouseRunMode(state = true) {
    if (state === true) {
        mouseMode = 'RUN';
        document.getElementById(canvasId).addEventListener('mousedown', onMouseDown);
        document.getElementById(canvasId).addEventListener('mouseup', onMouseUp);
    } else {
        document.getElementById(canvasId).removeEventListener('mousedown', onMouseDown);
        document.getElementById(canvasId).removeEventListener('mouseup', onMouseUp);
    }
}

function addCutPoint() {
    cutPoints.push(Render.canvasToWorldPosition({x:mousePosition[0], y:mousePosition[1]}));
    console.log('cutPoints', cutPoints);
    if (cutPoints.length === 2) {
        cutBranchs(cutPoints);
        cutPoints = [];
    }
}

function onApplyBendChanged() {
    applyBend = document.getElementById('applyBend').checked;
}

function onTreeTypeSelectChanged() {
    const typeBChecked = document.getElementById('presetTypeB').checked;
    // treesSolo.length = 0;
    let treeType = 'typeA';
    if (typeBChecked === true) {
        treeType = 'typeB';
    }
    // treesSolo.push(new Tree(new Vector(0, 0), treeType));

    treesSolo[0].preset = presets[treeType];
    Ui.setPreset(presets[treeType]);
}

function onFrame() {
    if (run === true) {
        play();
    }
    requestAnimationFrame(onFrame);
}

function onKeyUp(evt) {
    if (evt.code === 'Space') {
        play();
    }
}

function onMouseMove(evt) {
    var rect = evt.target.getBoundingClientRect();
    mousePosition[0] = evt.clientX - rect.left;
    mousePosition[1] = evt.clientY - rect.top;

    if (mouseMode === 'CUT') {
        // if (cutPoints.length !== 1) {
        //     return;
        // }
        // const cutEnd = Render.canvasToWorldPosition({x:mousePosition[0], y:mousePosition[1]});
        // Render.drawLine(cutPoints[0], cutEnd, 2, 'rgb(255, 0, 0)');
    }
}

function onMouseDown() {
    run = true;
}
function onMouseUp(evt) {
    run = false;
}

function cutBranchs(cutPoints) {
    const intersectingBranchs = rbushBranchs.search({
        minX: Math.min(cutPoints[0][0], cutPoints[1][0]),
        minY: Math.min(cutPoints[0][1], cutPoints[1][1]),
        maxX: Math.max(cutPoints[0][0], cutPoints[1][0]),
        maxY: Math.max(cutPoints[0][1], cutPoints[1][1]),
    });

    for (let i = 0; i < intersectingBranchs.length; i ++) {
        const branch = intersectingBranchs[i].branch;
        branch.remove();
    }

    play();
}

function play() {
    clearCanvas();

    const treesList = [
        treesSolo,
    ];

    for (const trees of treesList) {
        treeGrow(trees);
    }
}

function treeGrow(trees) {
    
    rbushAttractors.clear();
    rbushBranchs.clear();

    const lightPosition = Render.canvasToWorldPosition(new Vector(mousePosition[0], mousePosition[1]));
    lightSource.reset(new Vector(lightPosition[0], lightPosition[1]));

    LightLayer.clear();
    Render.clear();
    
    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));
    indexBranchs(branchs);
    lightSource.emit(rbushBranchs);
    LightRender.draw(lightSource);
    // LightLayer.draw();

    attractors = createAttractors(lightSource.getPhotons());

    branchs.forEach(branch => branch.clearAttractors());
    
    branchs.forEach(branch => attachBranchToAttractors(branch));
    attachAttractorsToBranch(attractors);
    
    trees.forEach(tree => tree.resetTips());
    branchs.forEach(branch => branch.startCycle());

    for (let branch of illuminatedBranchs) {
        branch.takeLight()
    }

    trees.forEach(tree => tree.prune());
    trees.forEach(tree => tree.updateFromTips());
    
    if (applyBend === true) {
        trees.forEach(tree => tree.bendBranches());
    }
    trees.forEach(tree => treeRender.draw(tree));
    trees.forEach(tree => tree.endCycle());

    Render.draw(context);

}

function indexBranchs(branchs) {
    const items = [];

    for (let i = 0; i < branchs.length; i ++) {
        const branch = branchs[i];

        items.push({
            minX: Math.min(branch.start.x, branch.end.x),
            maxX: Math.max(branch.start.x, branch.end.x),
            minY: Math.min(branch.start.y, branch.end.y),
            maxY: Math.max(branch.start.y, branch.end.y),
            branch: branch,
        });
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

class Attractor {
    constructor(position, orientation) {
        this.position = position;
        this.orientation = orientation;
        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }
    
    attachBranchIfNeeded(branch) {
        const distance = branch.end.distanceFrom(this.position);
        
        if (this.nearestDistance < distance) {
            return;
        }
    
        this.nearestDistance = distance;
        this.nearestBranch = branch;
    }
} 