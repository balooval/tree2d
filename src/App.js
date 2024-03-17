import Render from './renderer/Render.js'
import TreeRender from './renderer/TreeRender.js'
import LightRender from './renderer/LightRender.js'
import Light from './Light.js';
import LightDirectional from './LightDirectional.js';
import Tree from './Tree.js';

let tree;
// let lightSource;
let attractors;

let run = false;
const mousePosition = [0, 0];

export function init(canvasId) {
    Render.init(canvasId);

    // lightSource = new Light(new Vector(0, 1800), new Vector(0, 150));
    const lightSource = new LightDirectional(new Vector(0, 1800), new Vector(0, 150));
    tree = new Tree(new Vector(0, 0));

    lightSource.emit([]);
    LightRender.draw(lightSource);

    const photons = lightSource.getPhotons();
    attractors = createAttractors(photons);

    TreeRender.draw(tree);

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
    mousePosition[0] = evt.clientX - rect.left;
    mousePosition[1] = evt.clientY - rect.top;
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
    const lightPosition = Render.canvasToWorldPosition(new Vector(mousePosition[0], mousePosition[1]));
    const lightSource = new LightDirectional(new Vector(lightPosition[0], lightPosition[1]), new Vector(0, 20));

    Render.clear();
    
    treeGrow(tree);
    
    lightSource.emit(tree.getBranchs());
    attractors = createAttractors(lightSource.getPhotons());

    LightRender.draw(lightSource);
}

function treeGrow(tree) {
    
    const branchs = tree.getBranchs();
    
    branchs.forEach(branch => branch.attractors = []);
    
    branchs.forEach(branch => attachBrancheToAttractors(branch, attractors));
    attractors.forEach(attractor => attachAttractorsToBranch(attractor));
    
    branchs.forEach(branch => branch.createChild());
    
    TreeRender.draw(tree);
    
    tree.addAge();
    tree.prune();
    
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