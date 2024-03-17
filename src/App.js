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
let cycles = 0;

const treesSolo = [];
const treesA = [];
const treesB = [];
const treeRender = new TreeRender(Render);

let canvas = null;
let context = null;
let run = true;
const mousePosition = [400, 100];

export function init(canvasId) {

    canvas = document.getElementById(canvasId);
    context = canvas.getContext('2d');

    Render.init(canvas);
    LightLayer.init(canvasId);
    mousePosition[0] = Render.sceneWidth / 2;

    // lightSource = new Light(new Vector(0, 1800), new Vector(0, 150));
    const lightSource = new LightDirectional(new Vector(0, 1800), new Vector(0, 150));
    tree = new Tree(new Vector(0, 0), 'typeA');
    const treeA = new Tree(new Vector(-850, 0), 'typeA');
    const treeB = new Tree(new Vector(-200, 0), 'typeB');
    const treeC = new Tree(new Vector(100, 0), 'typeB');
    const treeD = new Tree(new Vector(400, 0), 'typeB');
    const treeE = new Tree(new Vector(1000, 0), 'typeB');
    const treeF = new Tree(new Vector(1200, 0), 'typeA');
    const treeG = new Tree(new Vector(800, 0), 'typeB');
    const treeH = new Tree(new Vector(-300, 0), 'typeA');
    const treeI = new Tree(new Vector(-600, 0), 'typeA');

    treesA.push(
        // tree,
        treeA,
        treeB,
        // treeC,
        treeD,
        treeE,
        // treeF,
    );

    treesB.push(
        treeC,
        treeF,
        treeG,
        treeH,
        treeI,
    );

    treesSolo.push(new Tree(new Vector(0, 0), 'typeB'));

    // lightSource.emit([]);
    // LightRender.draw(lightSource);

    // const photons = lightSource.getPhotons();
    // attractors = createAttractors(photons);

    // treeRender.draw(tree);

    document.getElementById('main').addEventListener('click', onClick);
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
    // mousePosition[0] = evt.clientX - rect.left;
    // mousePosition[1] = evt.clientY - rect.top;
}

function onMouseDown() {
    run = true;
}
function onMouseUp(evt) {
    run = false;
}

function onClick(evt) {
    // play();
}

function play() {
    context.fillStyle = 'rgb(20, 20, 20)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const lightPosition = Render.canvasToWorldPosition(new Vector(mousePosition[0], mousePosition[1]));

    const treesList = [
        treesB,
        treesA,
        // treesSolo,
    ];

    for (const trees of treesList) {

        const lightSource = new LightDirectional(new Vector(lightPosition[0], lightPosition[1]), new Vector(0, 20));

        Render.clear();
        
        const branchs = [];
        trees.forEach(tree => branchs.push(...tree.getBranchs()));
        lightSource.emit(branchs);
        LightRender.draw(lightSource);

        attractors = createAttractors(lightSource.getPhotons());

        treeGrow(trees);
        

        Render.draw(context);
    }

    cycles ++;

    if (cycles % 15 === 0) {
        run = false;
    }
}

function treeGrow(trees) {
    
    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));

    branchs.forEach(branch => branch.attractors = []);
    
    branchs.forEach(branch => attachBrancheToAttractors(branch, attractors));
    attractors.forEach(attractor => attachAttractorsToBranch(attractor));
    
    branchs.forEach(branch => branch.takeLight());
    
    trees.forEach(tree => treeRender.draw(tree));
    trees.forEach(tree => tree.addAge());
    trees.forEach(tree => tree.prune());
    
    // tree.addBranchs(newBranchs);
    attractors = clearUsedAttractors(attractors);
}

function clearUsedAttractors(attractors) {
    const minimalDistance = 100;
    return attractors.filter(attractor => attractor.nearestDistance > minimalDistance);
}

function attachBrancheToAttractors(branch, attractors) {
    attractors.forEach(attractor => attachBranchToAttractorIfNeeded(branch, attractor));
}

function attachAttractorsToBranch(attractor) {
    if (attractor.nearestBranch === null) {
        return;
    }
    attractor.nearestBranch.attractors.push(attractor);
}

function attachBranchToAttractorIfNeeded(branch, attractor) {
    const distance = branch.end.distanceFrom(attractor.position);
    if (distance > branch.maxLightDistance) {
        return;
    }

    if (attractor.nearestDistance < distance) {
        return;
    }

    attractor.nearestDistance = distance;
    attractor.nearestBranch = branch;
}

function createAttractors(photons) {
    return photons.map(photon => new Attractor(photon.position));
}

class Attractor {
    constructor(position) {
        this.position = position;
        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }
    
    reset() {
        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }
} 