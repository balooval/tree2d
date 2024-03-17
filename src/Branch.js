import * as THREE from './../vendor/three.module.js';

class Branch {

    #age = 0;

    constructor(parent, direction) {
        this.start = parent.end;
        this.branchLength = Math.max(parent.branchLength * 0.995, 0.2);
        this.end = new THREE.Vector3(
            parent.end.x + (direction.x * this.branchLength),
            parent.end.y + (direction.y * this.branchLength),
            parent.end.z + (direction.z * this.branchLength),
        );
        this.direction = direction;
        this.attractors = [];
        this.childs = [];
        this.childsNb = 0;
        this.parent = null;
        if (parent instanceof Branch) {
            this.parent = parent;
        }
        this.time = parent.time + 1;
        this.stepsFromRoot = parent.stepsFromRoot + 1;
        this.myMinDistance = parent.myMinDistance * 0.992;
        this.mySearchRadius = parent.mySearchRadius * 0.992;
    }

    updateAge(time) {
        this.#age = 1 + (time - this.time);
        this.mySearchRadius *= 0.99;
    }

    getSearchRadius() {
        return this.mySearchRadius;
    }

    getGrowDistance() {
        return this.myMinDistance;
    }

    rotate(rotation) {
        if (this.parent !== null) {
            this.start = this.parent.end;

            const myRotation = rotation.clone();
            myRotation.add(this.direction);

            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(this.direction, myRotation);
            this.direction.applyQuaternion(quaternion);

            this.end = new THREE.Vector3(
                this.parent.end.x + (this.direction.x * this.branchLength),
                this.parent.end.y + (this.direction.y * this.branchLength),
                this.parent.end.z + (this.direction.z * this.branchLength),
            );
        }
        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].rotate(rotation);
        }
    }

    buildSegment(list) {
        if (this.childs.length < 2) {
            list.push(this);
        }
        if (this.childs.length === 1) {
            list = this.childs[0].buildSegment();
        }
        return list;
    }
    
    addChild(direction) {
        const childBranch = new Branch(this, direction);
        this.childs.push(childBranch);
        this.#addChildCount();
        return childBranch;
    }

    removeChild(childBranch) {
        this.childs = this.childs.filter(child => childBranch !== child);
        this.#removeChildCount();
    }
    
    #addChildCount() {
        this.childsNb ++;
        if (this.parent !== null) {
            this.parent.#addChildCount();
        }
    }

    #removeChildCount() {
        this.childsNb --;
        if (this.parent !== null) {
            this.parent.#removeChildCount();
        }
    }

    #getAllChilrens() {
        const childrens = [];
        childrens.push(...this.childs);
        this.childs.forEach(child => childrens.push(...child.#getAllChilrens()));
        return childrens;
    }
}

export default Branch;