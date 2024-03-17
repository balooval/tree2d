import { randomize, randomElement } from "./Math.js";
import Render from './renderer/Render.js'

export const presets = {
    typeA: {
        maxLightDistance: 200,
        newBranchLength: 90,
        lightDecay: 3,
        lightBeforeGrow: 10,
        maxLightStore: 20,
        directionConstrainFactor: 0.5,
        leaveCountMultiplier: 2,
        leaveSize: 3,
        leaveColors: [
            'rgb(0, 255, 0)',
            'rgb(147, 237, 102)',
        ],
        trunkColors: [
            'rgb(107, 99, 85)',
            'rgb(117, 111, 100)',
        ],
    },
    typeB: {
        maxLightDistance: 100,
        newBranchLength: 50,
        lightDecay: 3,
        lightBeforeGrow: 0,
        maxLightStore: 40,
        directionConstrainFactor: 0,
        leaveCountMultiplier: 3,
        leaveSize: 5,
        leaveColors: [
            'rgb(22, 130, 23)',
            'rgb(75, 156, 59)',
        ],
        trunkColors: [
            'rgb(71, 58, 37)',
            'rgb(82, 62, 29)',
            'rgb(61, 37, 16)',
        ],
    },
};

export class Tree {

    constructor(position, preset) {
        this.position = position;
        this.root = new Branch(preset, position, new Vector(position.x + 20, position.y + 100), 5);
        this.branchs = [this.root];
    }

    addAge() {
        this.getBranchs().forEach(branch => branch.addAge());
    }

    prune() {
        this.root.pruneIfNeeded();
    }

    addBranchs(branchs) {
        this.branchs.push(...branchs);
    }

    getBranchs() {
        return this.root.addToList([]);
    }
}

class Branch {
    constructor(presetType, start, end) {
        this.presetType = presetType;
        this.start = start;
        this.end = end;
        this.direction = this.end.sub(this.start).normalizeSelf();
        this.preset = presets[this.presetType];
        this.maxLightDistance = this.preset.maxLightDistance;
        this.newBranchLength = this.preset.newBranchLength;
        this.lightDecay = this.preset.lightDecay;
        this.lightBeforeGrow = this.preset.lightBeforeGrow;
        this.maxLightStore = this.preset.maxLightStore;
        this.directionConstrainFactor = this.preset.directionConstrainFactor;
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.attractors = [];
        this.childs = [];
        this.parent = null;
        this.totalChildsCount = 0;
        this.receivedLight = 4;
    }

    addToList(branchs) {
        branchs.push(this);
        for (let i = 0; i < this.childs.length; i ++) {
            branchs = this.childs[i].addToList(branchs);
        }
        return branchs;
    }

    takeLight() {
        this.receivedLight += this.attractors.length;

        if (this.receivedLight > 0) {
            this.giveLightToParent();
        }

        if (this.receivedLight > this.lightBeforeGrow) {
            this.createChild();
        }
    }

    addAge() {
        this.receivedLight -= this.lightDecay;
    }

    giveLightToParent() {
        if (this.parent === null) {
            return;
        }

        this.parent.receivedLight = Math.min(this.maxLightStore, this.parent.receivedLight + 1);
        this.parent.giveLightToParent();
    }

    pruneIfNeeded() {
        if (this.receivedLight <= 0 && this.parent !== null) {
            
            this.parent.childs = this.parent.childs.filter(branch => branch !== this);
            return;
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }
    }

    getWidth() {
        return Math.max(3, Math.atan(this.totalChildsCount * 0.005) * 50);
    }

    createChild() {
        const childEnd = this.computeAverageAttraction();
        const child = new Branch(this.presetType, this.end, childEnd);
        child.parent = this;
        child.newBranchLength = this.newBranchLength * 0.98;
        this.childs.push(child);
        this.addChildCount(1);
    }

    addChildCount(count) {
        this.totalChildsCount += count;
        if (this.parent === null) {
            return;
        }
        this.parent.addChildCount(count);
    }

    computeAverageAttraction() {
        const newBranchEnd = new Vector(0, 0);

        this.attractors.forEach(attractor => {
            const vectorToAttractor = attractor.position.sub(this.end);
            const normalizedAttractorForce = (this.maxLightDistance - vectorToAttractor.length()) / this.maxLightDistance;
            const normalizedTranslation = vectorToAttractor.normalize().mulScalarSelf(normalizedAttractorForce);
            newBranchEnd.addSelf(normalizedTranslation);
        });
        newBranchEnd.addSelf(this.direction.mulScalar(this.directionConstrainFactor));

        newBranchEnd.normalizeSelf();
        newBranchEnd.mulScalarSelf(this.newBranchLength);
        newBranchEnd.addSelf(this.end); 

        return newBranchEnd;
    }
}