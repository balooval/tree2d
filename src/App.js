import Render from './renderer/Render.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightLayer from './renderer/LightLayer.js'
import Light from './Light.js';
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';
import RBush from '../vendor/rbush.js';
import RBushKnn from '../vendor/rbush-knn.js';

const rbushAttractors = new RBush();
const rbushBranchs = new RBush();

const illuminatedBranchs = new Set();
let attractors = [];

const treesSolo = [];
const treesA = [];
const treesB = [];
const treeRender = new TreeRender(Render);

let backgroundImage = null;
let canvas = null;
let context = null;
let run = false;
const mousePosition = [400, 100];

const backgroundColor = 'rgb(100, 100, 100)';
// const backgroundColor = 'rgb(10, 10, 10)';

export function init(canvasId) {

    canvas = document.getElementById(canvasId);
    context = canvas.getContext('2d');
    clearCanvas();


    Render.init(canvas);
    LightLayer.init(canvasId);
    mousePosition[0] = Render.sceneWidth / 2;

    const groundPosition = 50;

    treesA.push(
        new Tree(new Vector(-1000, groundPosition), 'typeB'),
        // new Tree(new Vector(-1050, groundPosition), 'typeA'),
        // new Tree(new Vector(-400, groundPosition), 'typeA'),
        // new Tree(new Vector(-200, groundPosition), 'typeB'),
        // new Tree(new Vector(400, groundPosition), 'typeB'),
        new Tree(new Vector(1000, groundPosition), 'typeA'),
    );

    treesB.push(
        new Tree(new Vector(100, groundPosition), 'typeB'),
        new Tree(new Vector(1200, groundPosition), 'typeA'),
        new Tree(new Vector(800, groundPosition), 'typeB'),
        new Tree(new Vector(-300, groundPosition), 'typeA'),
        new Tree(new Vector(-600, groundPosition), 'typeA'),
    );

    treesSolo.push(new Tree(new Vector(0, 0), 'typeB'));


    document.getElementById('main').addEventListener('mousedown', onMouseDown);
    document.getElementById('main').addEventListener('mouseup', onMouseUp);
    document.getElementById('main').addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('keyup', onKeyUp);

    onFrame();
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
}

function onMouseDown() {
    run = true;
}
function onMouseUp(evt) {
    run = false;
}

function play() {
    clearCanvas();

    const treesList = [
        // treesA,
        // treesB,
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
    const lightSource = new LightDirectional(new Vector(lightPosition[0], lightPosition[1]), new Vector(0, 20));

    Render.clear();
    
    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));
    indexBranchs(branchs);
    lightSource.emit(branchs, rbushBranchs);
    LightRender.draw(lightSource);

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
    
    trees.forEach(tree => tree.bendBranches());
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