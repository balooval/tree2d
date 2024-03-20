import Render from './renderer/Render.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import LightLayer from './renderer/LightLayer.js'
import Light from './Light.js';
import LightDirectional from './LightDirectional.js';
import {Tree} from './Tree.js';

let tree;
// let lightSource;
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
// const backgroundColor = 'rgb(20, 20, 20)';

export function init(canvasId) {

    canvas = document.getElementById(canvasId);
    context = canvas.getContext('2d');
    clearCanvas();


    Render.init(canvas);
    LightLayer.init(canvasId);
    mousePosition[0] = Render.sceneWidth / 2;

    const groundPosition = 50;

    // lightSource = new Light(new Vector(0, 1800), new Vector(0, 150));
    const lightSource = new LightDirectional(new Vector(0, 1800), new Vector(0, 150));
    tree = new Tree(new Vector(0, 0), 'typeA');

    treesA.push(
        new Tree(new Vector(-1500, groundPosition), 'typeB'),
        new Tree(new Vector(-1050, groundPosition), 'typeB'),
        new Tree(new Vector(-850, groundPosition), 'typeA'),
        new Tree(new Vector(-200, groundPosition), 'typeB'),
        new Tree(new Vector(400, groundPosition), 'typeB'),
        new Tree(new Vector(1000, groundPosition), 'typeB'),
    );

    treesB.push(
        new Tree(new Vector(100, groundPosition), 'typeB'),
        new Tree(new Vector(1200, groundPosition), 'typeA'),
        new Tree(new Vector(800, groundPosition), 'typeB'),
        new Tree(new Vector(-300, groundPosition), 'typeA'),
        new Tree(new Vector(-600, groundPosition), 'typeA'),
    );

    treesSolo.push(new Tree(new Vector(0, 0), 'typeA'));

    // lightSource.emit([]);
    // LightRender.draw(lightSource);

    // const photons = lightSource.getPhotons();
    // attractors = createAttractors(photons);

    // treeRender.draw(tree);

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
        // treesB,
        // treesA,
        treesSolo,
    ];

    for (const trees of treesList) {
        treeGrow(trees);
    }
}

function treeGrow(trees) {
    const lightPosition = Render.canvasToWorldPosition(new Vector(mousePosition[0], mousePosition[1]));
    const lightSource = new LightDirectional(new Vector(lightPosition[0], lightPosition[1]), new Vector(0, 20));

    Render.clear();
    
    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));
    lightSource.emit(branchs);
    LightRender.draw(lightSource);

    attractors = createAttractors(lightSource.getPhotons());

    branchs.forEach(branch => branch.clearAttractors());
    
    branchs.forEach(branch => attachBranchToAttractors(branch, attractors));
    attractors.forEach(attractor => attachAttractorsToBranch(attractor));
    
    trees.forEach(tree => tree.resetTips());
    branchs.forEach(branch => branch.startCycle());
    branchs.forEach(branch => branch.takeLight());
    trees.forEach(tree => tree.prune());
    trees.forEach(tree => tree.updateFromTips());
    
    trees.forEach(tree => tree.bendBranches());
    trees.forEach(tree => treeRender.draw(tree));
    trees.forEach(tree => tree.endCycle());

    Render.draw(context);
}

function attachBranchToAttractors(branch, attractors) {
    attractors.forEach(attractor => attractor.attachBranchIfNeeded(branch));
}

function attachAttractorsToBranch(attractor) {
    if (attractor.nearestBranch === null) {
        return;
    }
    attractor.nearestBranch.attractors.push(attractor);
}

function createAttractors(photons) {
    return photons.map(photon => new Attractor(photon.position, photon.orientation));
}

function clearCanvas() {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // context.drawImage(backgroundImage,
    //     0, 0, backgroundImage.width, backgroundImage.height,
    //     0, 0, canvas.width, canvas.height,
    // );
}

class Attractor {
    constructor(position, orientation) {
        this.position = position;
        this.orientation = orientation;
        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }
    
    reset() {
        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }

    attachBranchIfNeeded(branch) {
        const distance = branch.end.distanceFrom(this.position);
        if (distance > branch.maxLightDistance) {
            return;
        }
    
        if (this.nearestDistance < distance) {
            return;
        }
    
        this.nearestDistance = distance;
        this.nearestBranch = branch;
    }
} 