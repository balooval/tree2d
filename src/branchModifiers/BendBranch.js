import * as THREE from './../../vendor/three.module.js';

class BendBranchs {

    constructor(preset) {
        this.preset = preset;
    }

    apply(branchs) {
        
        for (let b = 0; b < branchs.length; b ++) {
            const branch = branchs[b];
            if (branch.childs.length === 0) {
                continue;
            }
            if (branch.childsNb < 10) {
                continue;
            }

            const horizontalDirection = new THREE.Vector2(branch.direction.x, branch.direction.z);
            const flatness = horizontalDirection.length();
            const force = branch.stepsFromRoot * (flatness / branch.childsNb) * (0.0005 * this.preset.gravity);
            const rotation = new THREE.Vector3(0, -force, 0);
            branch.rotate(rotation);
        }
        return branchs;
    }
}

export default BendBranchs;