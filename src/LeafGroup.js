import BezierCurve from "./BezierCurve.js";
import * as MATH from "./Math.js";

class LeafGroup {

    constructor(branch, preset) {
        this.branch = branch;
        this.leafs = [];
        this.placeLeafs(preset);
    }

    placeLeafs(preset) {
        const step = 1 / preset.leafCount;

        const totalRotation = MATH.radians(preset.totalRotation);
        const rotationStep = totalRotation / preset.leafCount;
        const localRotation = MATH.radians(preset.localRotation);
        
        for (let i = 0; i < preset.leafCount; i ++) {
            const percent = step * i;
            
            const percentDistribution = (1 - percent * preset.branchDistribution) - 0.1;
            const percentLeaf = percentDistribution + 0.1;

            let scale = preset.sizeCurve.getPointAt(percent);
            scale = scale[1] * 10;
            
            let branchPosition = this.branch.getPointAt(percentDistribution);
            branchPosition = MATH.scalePoint([0, 0], branchPosition, 400);
            branchPosition = MATH.translatePoint(branchPosition, [100, 400]);
            let leafPosition = this.branch.getPointAt(percentLeaf);
            leafPosition = MATH.scalePoint([0, 0], leafPosition, 400);
            leafPosition = MATH.translatePoint(leafPosition, [100, 400]);
            
            const leafRotation = rotationStep * i - (totalRotation / 2);
            const rotation = leafRotation + localRotation;
            const position = MATH.rotatePoint(branchPosition, rotation, leafPosition);

            this.leafs.push({
                position,
                rotation,
                scale,
            });
        }
    }
}

export default LeafGroup;