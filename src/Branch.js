import { randomElement, randomizeArray } from "./Math.js";

let ID = 0;
export class Branch {
    constructor(tree, parent, start, end, mainStrenght) {
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
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.attractors = [];
        this.childs = [];
        this.parent = parent;
        this.weight = 1;
        
        this.age = 1;
        this.width = 1;
        this.cyclesWithoutEnergy = 0;

        this.tree.addTip(this);

        this.leavesHealth = 1;
        this.leavesSize = 0;

        this.mainStrenght = mainStrenght;
        this.budsLight = 0;
        this.buds = this.createBuds();
        this.scar = false;
    }

    createBuds() {
        const angle = this.preset.angle;
        const lateralStrenght = Math.min(1, this.tree.age / 50);
        return [
            {
                active: true,
                light: 0,
                energy: 0,
                relativeAngle: 0,
                orientation: this.direction.clone(),
                strenght: this.mainStrenght,
            },
            {
                active: true,
                light: 0,
                energy: 0,
                relativeAngle: angle,
                orientation: this.direction.rotateDegrees(angle),
                strenght: this.mainStrenght * lateralStrenght,
            },
            {
                active: true,
                light: 0,
                energy: 0,
                relativeAngle: angle * -1,
                orientation: this.direction.rotateDegrees(angle * -1),
                strenght: this.mainStrenght * lateralStrenght,
            },
        ];
    }

    startCycle() {
        this.cyclesWithoutEnergy ++;
    }

    endCycle() {
        this.age ++;

    }

    takeLight() {
        if (this.buds.length === 0) {
            return;
        }

        this.budsLight = 0;

        for (let i = 0; i < this.buds.length; i ++) {
            this.buds[i].light = this.#computeBudLight(this.buds[i]);
            this.budsLight += this.buds[i].light;
        }

        this.tree.askEnergy(this, this.budsLight);
    }

    addEnergy(quantity) {
        this.diffuseEnergy(quantity);
        this.addWidth(quantity * 0.02);
    }
    
    diffuseEnergy(quantity) {
        for (let i = 0; i < this.buds.length; i ++) {
            const percent = this.buds[i].light / this.budsLight;
            const budEnergy = percent * quantity;
            this.buds[i].energy += budEnergy;
            
            if (this.buds[i].energy >= this.preset.energyNeededToGrow) {
                this.buds[i].active = false;
                this.#createChild(this.buds[i]);
            }
        }

        this.buds = this.buds.filter(bud => bud.active);
    }

    #computeBudLight(bud) {
        let lightQuantity = 0;

        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const vectorToAttractor = attractor.position.sub(this.end);
            let normalizedAttractorForce = (this.maxLightDistance - vectorToAttractor.length()) / this.maxLightDistance;
            let lightPercentByOrientation = (bud.orientation.invert().dot(attractor.orientation) + 1) / 2;
            let lightPercentByPosition = (bud.orientation.dot(attractor.position.sub(this.end).normalizeSelf()) + 1) / 2;
            normalizedAttractorForce *= lightPercentByOrientation;
            normalizedAttractorForce *= lightPercentByPosition;
            lightQuantity += normalizedAttractorForce;
        };

        return lightQuantity * bud.strenght;
    }

    addWidth(quantity) {
        this.width += quantity;
        this.cyclesWithoutEnergy = 0;
        this.flexToSky();
        this.parent.addWidth(quantity);
    }

    flexToSky() {
        if (this.width > 20) {
            return;
        }
        const localFlexibility = this.preset.gravitropism / this.width;
        if (localFlexibility < 0.0001) {
            return;
        }
        const ground = new Vector(1, 0);
        const bendFactor = this.end.sub(this.start).normalizeSelf().dot(ground);
        const bendAngle = bendFactor * localFlexibility;
        const newEnd = this.end.sub(this.start);
        newEnd.rotateRadiansSelf(bendAngle);
        this.end = newEnd.add(this.start);
        this.startToEndVector = this.end.sub(this.start);
        this.direction = this.startToEndVector.normalize();

        this.width += Math.abs(bendAngle) * 50;

        for (let i = 0; i < this.buds.length; i ++) {
            this.buds[i].orientation = this.direction.rotateDegrees(this.buds[i].relativeAngle);
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(this.start, bendAngle);
        }
    }

    #createChild(bud) {        
        this.tree.removeTip(this);
        
        const childEnd = this.#computeAverageAttraction(bud.orientation);
        const child = new Branch(this.tree, this, this.end, childEnd, bud.strenght);
        this.childs.push(child);
    }

    #computeAverageAttraction(orientation) {
        const lightAttraction = new Vector(0, 0);
        
        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const vectorToAttractor = attractor.position.sub(this.end);
            
            let normalizedAttractorForce = (this.maxLightDistance - vectorToAttractor.length()) / this.maxLightDistance;
            normalizedAttractorForce *= this.getAttractorLightPercent(attractor);
            
            const normalizedTranslation = vectorToAttractor.normalize().mulScalarSelf(normalizedAttractorForce);
            lightAttraction.addSelf(normalizedTranslation);
        };
        
        lightAttraction.normalizeSelf();
        const newBranchEnd = 
        lightAttraction.mulScalar(1 - this.directionConstrainFactor)
        .addSelf(orientation.mulScalar(this.directionConstrainFactor))
        .normalizeSelf();

        newBranchEnd.mulScalarSelf(this.newBranchLength);
        newBranchEnd.addSelf(this.end); 

        return newBranchEnd;
    }

    pruneIfNeeded() {
        if (this.cyclesWithoutEnergy > this.preset.uselessBeforePrune && this.parent !== null) {
            this.remove();
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }
    }

    bend() {
        const localFlexibility = this.preset.flexibility / this.width;
        const ground = new Vector(-1, 0);
        const bendFactor = this.end.sub(this.start).normalizeSelf().dot(ground);
        const bendAngle = (bendFactor * this.length * this.weight) * localFlexibility;
        const newEnd = this.end.sub(this.start);
        newEnd.rotateRadiansSelf(bendAngle);
        this.end = newEnd.add(this.start);
        this.startToEndVector = this.end.sub(this.start);
        this.direction = this.startToEndVector.normalize();

        for (let i = 0; i < this.buds.length; i ++) {
            this.buds[i].orientation = this.direction.rotateDegrees(this.buds[i].relativeAngle);
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(this.start, bendAngle);
        }
        
        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].bend();
        }
    }

    followParentBend(start, bendAngle) {
        this.start = this.start.sub(start).rotateRadiansSelf(bendAngle).addSelf(start);
        const newEnd = this.end.sub(start).rotateRadiansSelf(bendAngle).addSelf(start);
        this.end = newEnd;
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
        return Math.max(2, this.width * 0.4);
    }

    getLeaves() {
        return this.buds.filter(bud => bud.light > 0.5);
    }

    getLeaveColor() {
        const hsl = randomElement(this.preset.leaveColors);
        return `hsl(${hsl.h + 60}, ${hsl.s}%, ${hsl.l + 10}%)`;
    }

    getLeavesObstruction() {
        return this.childs.length + this.buds.length;
    }

    remove() {
        this.parent.removeChild(this);
        
        if (this.childs.length > 0) {
            return;
        }
        this.tree.removeTip(this);
        if (this.parent.childs.length === 0) {
            this.tree.addTip(this.parent);
        }

        this.childs = [];
    }

    removeChild(childBranch) {
        this.childs = this.childs.filter(branch => branch !== childBranch);
        this.buds.push(...this.createBuds());
        this.scar = true;
    }
}

export class Seed {
    constructor (tree, position) {
        this.tree = tree;
        this.end = position
        this.start = this.end.add(new Vector(0, -1));
        this.startToEndVector = this.end.sub(this.start);
        this.length = this.startToEndVector.length();
        this.direction = this.startToEndVector.normalize();
        this.childs = [];
        this.preset = this.tree.preset;
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.width = 10;
    }

    getWidth() {
        return Math.max(2, this.width * 2);
    }

    addWidth(quantity) {
        this.width += quantity;
    }

    remove() {

    }

    removeChild() {

    }
}