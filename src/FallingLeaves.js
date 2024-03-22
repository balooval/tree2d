import Render from './renderer/Render.js'
import { randomize } from "./Math.js";

const leaves = new Set();

export function addLeaf(position, size, color) {
    leaves.add(new Leaf(position, size, color));
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
    Render.drawCircle(leaf.position, leaf.size, leaf.color)
}

class Leaf {
    constructor(position, size, color) {
        this.position = position;
        this.size = size;
        this.color = color;
    }

    update() {
        this.position.x = randomize(this.position.x, 5) + 8;
        this.position.y -= 15;
    }
}