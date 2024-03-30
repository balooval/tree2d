import { randomElement, randomizeArray } from "./Math.js";

let ID = 0;
export default class Branch {
    constructor(tree, parent, start, end) {
        this.id = ID ++;
        this.tree = tree;
        this.start = start;
        this.end = end;
        this.startToEndVector = this.end.sub(this.start);
        this.length = this.startToEndVector.length();
        this.direction = this.startToEndVector.normalize();
        this.preset = this.tree.preset;
        this.maxLightDistance = this.preset.maxLightDistance;
        this.newBranchLength = this.preset.newBranchLength;
        this.directionConstrainFactor = this.preset.directionConstrainFactor;
        this.uselessBeforePrune = this.preset.uselessBeforePrune;
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.attractors = [];
        this.childs = [];
        this.parent = parent;
        this.weight = 1;
        this.tickness = 1;
        this.heliotropism = this.preset.heliotropism;
        this.ligthReceived = 0;
        
        this.energy = 0;
        this.energyNeededToGrow = 2;
        this.age = 1;
        this.width = 1;
        this.cyclesWithoutEnergy = 0;

        this.tree.addTip(this);

        this.leavesHealth = 1;
        this.leavesSize = 0;

        const angle = 10;
        const angles = randomizeArray([angle, angle * -1]);

        this.growDirection = [
            // this.direction,
            this.direction.rotateDegrees(angles[0]),
            this.direction.rotateDegrees(angles[1]),
        ];

        this.growNextDirection = this.direction;

        this.energyRatioToKeep = 0.8;

        this.growPhase = true;
        
    }

    startCycle() {
        this.ligthReceived = 0;
        this.cyclesWithoutEnergy ++;
    }

    endCycle() {
        this.age ++;

        if (this.ligthReceived === 0) {
            this.leavesHealth = Math.max(0, this.leavesHealth - 0.1);
        }

        if (this.leavesHealth === 0) {
            this.leavesSize = Math.max(0.2, this.leavesSize - 0.05);
        }
    }

    takeLight() {
        if (this.leavesHealth === 0) {
            return;
        }

        // if (this.growDirection.length === 0) {
        //     return;
        // }
        
        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const distance = attractor.position.distanceFrom(this.end);
            const attractorLightPercent = this.getAttractorLightPercent(attractor);
            const attractorLight = ((this.maxLightDistance - distance) / this.maxLightDistance) * attractorLightPercent;
            this.ligthReceived += attractorLight;
        }

        this.tree.askEnergy(this, this.ligthReceived * this.leavesHealth);

    }

    addEnergy(quantity) {
        // console.log('---', this.id);
        this.diffuseEnergy(quantity);
        // this.createChild(); 
        this.addWidth(quantity * 0.01);
    }
    
    diffuseEnergy(quantity) {
        let ratio = this.energyRatioToKeep;
        if (this.parent === null) {
            ratio = 1;
        }
        const energyToKeep = quantity * ratio;
        this.energy += energyToKeep;
        // if (this.id === 0) {
            // console.log('ID', this.id, 'Add', this.energy);
        // }

        if (this.growPhase === true) {
            this.grow(1);
        } else {
            this.createChild();
        }
        
        // console.log('ID', this.id, 'Energy', this.energy);

        if (this.parent === null) {
            return;
        }
        // console.log('diffuseEnergy', quantity, this.energy);
        // this.parent.diffuseEnergy(quantity * (1 - this.energyRatioToKeep));
        const energyForParent = quantity - energyToKeep;
        // console.log('ID', this.id, 'energyForParent', energyForParent);
        this.parent.diffuseEnergy(energyForParent);
    }

    grow(percent) {
        const energyToConsume = this.energyNeededToGrow * percent;
        // console.log('ID', this.id, 'energyToConsume', energyToConsume);
        // console.log('ID', this.id, 'this.energy', this.energy);
        const effectiveEnergyTaken = Math.min(this.energy, energyToConsume);
        // console.log('ID', this.id, 'effectiveEnergyTaken', effectiveEnergyTaken);
        this.energy -= effectiveEnergyTaken;
        // console.log('ID', this.id, 'GROW reste :', this.energy);
        this.leavesSize += effectiveEnergyTaken * 0.1;
        this.end.addSelf(this.direction.mulScalar(effectiveEnergyTaken));
        this.startToEndVector = this.end.sub(this.start);
        this.length = this.startToEndVector.length();
        if (this.length >= this.newBranchLength) {
            this.growPhase = false;
            // console.log('---------- ID', this.id, 'STOP grow', this.energy);
        }
    }

    addWidth(quantity) {
        this.width += quantity;
        this.cyclesWithoutEnergy = 0;

        if (this.parent === null) {
            return;
        }

        this.parent.addWidth(quantity);
    }

    createChild() {
        if (this.energy < this.energyNeededToGrow) {
            return;
        }

        if (this.growDirection.length === 0) {
            // this.leavesHealth = 1;
            // this.leavesSize = 1;
            return;
        }

        
        this.tree.removeTip(this);
        
        const childEnd = this.#computeAverageAttraction();
        const child = new Branch(this.tree, this, this.end, childEnd);
        this.childs.push(child);
        
        child.energy = this.energy;
        this.energy = 0;
        // console.log('++++ ID', this.id, 'CREATE CHILD', this.energy);
        
        this.killApex();
    }
    
    killApex() {
        // this.energyNeededToGrow *= 2;
        // this.growDirection.shift();
        this.growDirection.push(this.growDirection.shift());

        this.growNextDirection = this.growDirection[0];
    }

    #computeAverageAttraction() {
        const newBranchEnd = new Vector(0, 0);

        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const vectorToAttractor = attractor.position.sub(this.end);
            
            let normalizedAttractorForce = (this.maxLightDistance - vectorToAttractor.length()) / this.maxLightDistance;
            normalizedAttractorForce *= this.getAttractorLightPercent(attractor);

            const normalizedTranslation = vectorToAttractor.normalize().mulScalarSelf(normalizedAttractorForce);
            newBranchEnd.addSelf(normalizedTranslation);
        };

        newBranchEnd.addSelf(this.growNextDirection.mulScalar(this.directionConstrainFactor));
        newBranchEnd.normalizeSelf();
        newBranchEnd.mulScalarSelf(this.newBranchLength * 0.1);

        newBranchEnd.addSelf(this.end); 

        return newBranchEnd;
    }

    pruneIfNeeded() {
        if (this.cyclesWithoutEnergy > this.uselessBeforePrune && this.parent !== null) {
            this.remove();
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }
    }

    bend() {
        // if (this.age < 50) {
            const localFlexibility = this.preset.flexibility / this.width;
            const ground = new Vector(-1, 0);
            const bendFactor = this.end.sub(this.start).normalizeSelf().dot(ground);
            const bendAngle = (bendFactor * this.length * this.weight) * localFlexibility;
            const newEnd = this.end.sub(this.start);
            newEnd.rotateRadiansSelf(bendAngle);
            this.end = newEnd.add(this.start);
            this.startToEndVector = this.end.sub(this.start);
            this.direction = this.startToEndVector.normalize();

            for (let i = 0; i < this.childs.length; i ++) {
                this.childs[i].followParentBend(this.start, bendAngle);
            }
        // }
        
        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].bend();
        }
    }

    followParentBend(start, bendAngle) {
        this.start = this.start.sub(start).rotateRadiansSelf(bendAngle).addSelf(start);
        this.end = this.end.sub(start).rotateRadiansSelf(bendAngle).addSelf(start);
        this.startToEndVector = this.end.sub(this.start);
        this.direction = this.startToEndVector.normalize();

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(start, bendAngle);
        }
    }

    getAttractorLightPercent(attractor) {
        return ((this.end.sub(attractor.position).normalizeSelf().dot(attractor.orientation)) + 1) / 2;
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

    getWidth() {
        return Math.max(2, this.width * 0.2);
    }

    getLeaves() {
        const leavesPositions = [];
        const count = 3;
        // const leafLength = this.leavesSize * 20;
        const leafLength = this.leavesSize * 10;
        const angle = this.leavesSize * 30;
        
        for (let i = 0; i < count; i ++) {
            leavesPositions.push(this.end.add(this.direction.mulScalar(leafLength)));
            leavesPositions.push(this.end.add(this.direction.rotateDegrees(angle).mulScalarSelf(leafLength)));
            leavesPositions.push(this.end.add(this.direction.rotateDegrees(angle * -1).mulScalarSelf(leafLength)));
        }

        return leavesPositions;
    }

    getLeaveColor() {
        const hsl = randomElement(this.preset.leaveColors);
        return `hsl(${hsl.h + 60}, ${hsl.s}%, ${hsl.l + 10}%)`;
        const h = this.leavesHealth * 60;
        const l = this.leavesHealth * 10;
        return `hsl(${hsl.h + h}, ${hsl.s}%, ${hsl.l + l}%)`;
    }

    getleavesSize() {
        // return 2;
        return this.leavesSize * 1;
    }

    getLeavesObstruction() {
        return Math.max(1, this.leavesSize);
    }

    remove() {
        this.parent.childs = this.parent.childs.filter(branch => branch !== this);
        if (this.childs.length > 0) {
            return;
        }
        this.tree.removeTip(this);
        if (this.parent.childs.length === 0) {
            this.tree.addTip(this.parent);
        }

        this.childs = [];
    }
}