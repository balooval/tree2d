import Attractor from './Attractor.js';
import RBush from '../vendor/rbush.js';
import RBushKnn from '../vendor/rbush-knn.js';
import { canvasToWorldPosition } from './renderer/BaseRender.js';
import * as UiMouse from './UiMouse.js';
import UiCut from './UiCut.js';

const rbushAttractors = new RBush();
const rbushBranchs = new RBush();
const illuminatedBranchs = new Set();
let attractors = [];


export function treeGrowUpdate(trees, lightSource, applyBend) {
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
