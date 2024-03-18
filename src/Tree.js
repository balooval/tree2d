import { randomize, randomElement } from "./Math.js";

export const presets = {
    typeA: {
        maxLightDistance: 200,
        newBranchLength: 90,
        uselessBeforePrune: 10,
        lightBeforeGrow: 10,
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
        uselessBeforePrune: 10,
        lightBeforeGrow: 5,
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
        this.root = new Branch(null, preset, position, new Vector(position.x + 20, position.y + 100), 5);
        this.root.energy = 500;
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
    constructor(parent, presetType, start, end) {
        this.presetType = presetType;
        this.start = start;
        this.end = end;
        this.direction = this.end.sub(this.start).normalizeSelf();
        this.preset = presets[this.presetType];
        this.maxLightDistance = this.preset.maxLightDistance;
        this.newBranchLength = this.preset.newBranchLength;
        this.lightBeforeGrow = this.preset.lightBeforeGrow;
        this.directionConstrainFactor = this.preset.directionConstrainFactor;
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.attractors = [];
        this.childs = [];
        this.parent = parent;
        this.totalChildsCount = 0;
        this.energy = 0;
        this.uselessBeforePrune = 10;
        this.stepsWithUselesEnergy = 0;
        this.energyAsked = false;
    }

    takeLight() {
        let lightQuantity = 0;

        for (let i = 0; i < this.attractors.length; i ++) {
            const distance = this.attractors[i].position.distanceFrom(this.end);
            lightQuantity += (this.maxLightDistance - distance) / this.maxLightDistance;
        }

        if (lightQuantity === 0) {
            return;
        }

        if (this.energy < this.lightBeforeGrow) {
            if (this.parent !== null) {
                const pumpedEnergy = this.parent.pumpEnergy(lightQuantity);
                this.energy += pumpedEnergy;
            }
            return;
        }

        this.createChild();
    }

    pumpEnergy(quantity) {
        this.energyAsked = true;
        this.stepsWithUselesEnergy = 0;
        // J'en ai assez, je te retourne ce dont tu a besoin
        let energyToGive;

        energyToGive = this.takeEnergy(quantity);

        if (energyToGive >= quantity) {
            return energyToGive;
        }

        if (this.parent === null) {
            this.energy += 10;
            return energyToGive;
        }

        // Il m'en manque, je refais mon stock et te retourne ce que tu me demande
        const parentEnergy = this.parent.pumpEnergy(5);
        this.energy += parentEnergy;

        energyToGive += this.takeEnergy(quantity - energyToGive);

        return energyToGive;
    }

    takeEnergy(quantity) {
        const energyToGive = Math.min(this.energy, quantity);
        this.energy -= energyToGive;
        return energyToGive;
    }

    addAge() {
        if (this.energyAsked === false) {
            this.stepsWithUselesEnergy ++;
        }
        this.energyAsked = false;
    }

    pruneIfNeeded() {
        if (this.stepsWithUselesEnergy > this.uselessBeforePrune && this.parent !== null) {
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
        const child = new Branch(this, this.presetType, this.end, childEnd);
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

    clearAttractors() {
        this.attractors = [];
    }

    addToList(branchs) {
        branchs.push(this);
        for (let i = 0; i < this.childs.length; i ++) {
            branchs = this.childs[i].addToList(branchs);
        }
        return branchs;
    }
}