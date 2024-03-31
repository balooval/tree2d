import TreeLayer from './renderer/TreeLayer.js'
import { randomize } from "./Math.js";

const leaves = new Set();

export function addLeaf(position, size) {
    leaves.add(new Leaf(position, size));
}

export function update() {
    const leavesToRemove = new Set();
    
    for (let leaf of leaves) {
        leaf.update();
        drawLeaf(leaf);

        if (leaf.position.y <= 0) {
            leavesToRemove.add(leaf);
        }
    }

    for (let leaf of leavesToRemove) {
        leaves.delete(leaf);
    }
}

function drawLeaf(leaf) {
    TreeLayer.drawCircle(leaf.position, leaf.size, leaf.color)
}

class Leaf {
    constructor(position, size) {
        this.position = position;
        this.size = size;
        this.color = 'hsl(120, 100%, 50%)';
        this.shadeValue = 20;
        this.colorCycle = Math.random() * 20;
    }

    update() {
        this.colorCycle += 0.1;
        this.color = `hsl(80, 100%, ${this.shadeValue + Math.sin(this.colorCycle) * 20}%)`;
        this.position.x = randomize(this.position.x, 10);
        this.position.y -= 7;
    }
}