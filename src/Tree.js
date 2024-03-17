import Render from './renderer/Render.js'
import {sigmoid} from './Math.js'

class Tree {

    constructor(position) {
        this.position = position;
        this.root = new Branch(position, new Vector(position.x + 20, position.y + 100), 5);
        this.root.receivedLight = 10;
        this.branchs = [this.root];
    }

    addAge() {
        this.getBranchs().forEach(branch => branch.addAge());
    }

    prune() {
        this.root.pruneIfNeeded();
        // this.branchs = this.branchs.filter(branch => branch.isStillAlive());
    }

    addBranchs(branchs) {
        this.branchs.push(...branchs);
    }

    getBranchs() {
        return this.root.addToList([]);
        // return this.branchs;
    }
}

let ID = 0;

class Branch {
    constructor(start, end, width) {
        this.id = ID;
        ID ++;
        this.start = start;
        this.end = end;
        this.width = width;
        this.maxLightDistance = 200;
        this.newBranchLength = 100;
        this.attractors = [];
        this.childs = [];
        this.parent = null;
        this.totalChildsCount = 0;
        this.age = 0;
        this.receivedLight = 3;
        this.hasCreatedChild = false;
    }

    addToList(branchs) {
        branchs.push(this);
        for (let i = 0; i < this.childs.length; i ++) {
            branchs = this.childs[i].addToList(branchs);
        }
        return branchs;
    }

    addAge() {
        this.age ++;
        
        this.receivedLight -= 1;
        this.receivedLight = Math.max(0, this.receivedLight);


        if (this.hasCreatedChild === true) {
        // if (this.attractors.length > 1) {
            Render.drawLine(this.start, this.end, 5, 'rgb(0, 255, 0)');
            // Render.drawCircle(this.end, 50, 'rgb(0, 0, 255)');
            this.giveLigthToParent();
        }

        this.hasCreatedChild = false;
    }

    giveLigthToParent() {
        Render.drawLine(this.start, this.end, 5, 'rgb(0, 255, 0)');
        if (this.parent === null) {
            return;
        }
        this.parent.receivedLight ++;
        this.parent.giveLigthToParent();
    }

    pruneIfNeeded() {
        if (this.receivedLight <= 0) {
            this.childs = [];
            // Render.drawCircle(this.end, 20, 'rgb(0, 0, 255)');
            // this.parent.childs = this.parent.childs.filter(branch => branch !== this);
            return;
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }

    }

    getWidth() {
        return Math.max(3, sigmoid((this.receivedLight * 0.1) - 6) * 80);
        return Math.max(3, sigmoid((this.totalChildsCount * 0.1) - 6) * 80);
    }

    createChild() {
        if (this.attractors.length === 0) {
            return;
        }

        // Render.drawEmptyCircle(this.end, this.maxLightDistance, 'rgb(0, 0, 255)')

        const childEnd = this.computeAverageAttraction();
        const child = new Branch(this.end, childEnd, this.width);
        child.parent = this;
        child.newBranchLength = this.newBranchLength * 0.98;
        this.childs.push(child);
        this.addChildCount(1);
        this.hasCreatedChild = true;
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

        newBranchEnd.normalizeSelf();
        newBranchEnd.mulScalarSelf(this.newBranchLength);
        newBranchEnd.addSelf(this.end); 

        return newBranchEnd;
    }
}

export default Tree;