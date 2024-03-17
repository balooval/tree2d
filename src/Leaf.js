import * as MATH from "./Math.js";
import BezierCurve from "./BezierCurve.js";

class Leaf {

    constructor(position, preset) {
        
        this.rootPos = position;
        const petioleSize = preset.height * preset.petiolePercent;
        const blaseHeight = preset.height - petioleSize; 
        this.startPos = [this.rootPos[0], this.rootPos[1] - petioleSize];
        this.endPos = [this.rootPos[0], this.startPos[1] - blaseHeight];
        
        this.midRib = new BezierCurve(this.rootPos, this.endPos, -90, 100, 90, 100);

        this.sideA = new BezierCurve(this.startPos, this.endPos, 90 + preset.startCtrlAngle, preset.startCtrlLength, 90 + preset.endCtrlAngle, preset.endCtrlLength);
        this.sideB = new BezierCurve(this.startPos, this.endPos, 90 - preset.startCtrlAngle, preset.startCtrlLength, 90 - preset.endCtrlAngle, preset.endCtrlLength);

        this.limbs = [];
        this.veins = [];
        const step = 1 / preset.limbCount;

        for (let i = 2; i < preset.limbCount; i ++) {
            const percent = step * i;
            const startPos = MATH.lerpPoint(this.startPos, this.endPos, step * (i - 2));

            let endPosA = this.sideA.getPointAt(percent);
            let endPosB = this.sideB.getPointAt(percent);

            endPosA = MATH.rotatePoint(startPos, preset.limbRotation, endPosA);
            endPosB = MATH.rotatePoint(startPos, preset.limbRotation * -1, endPosB);

            this.buildLimb(preset, startPos, endPosA, 1);
            this.buildLimb(preset, startPos, endPosB, -1);
        }

        const percent = 1;
        const startPos = MATH.lerpPoint(this.startPos, this.endPos, step * (preset.limbCount - 2));
        let endPos = this.sideA.getPointAt(percent);
        this.buildLimb(preset, startPos, endPos, 0);

    }

    buildLimb(preset, startPos, endPos, symetry) {
        const veinLength = MATH.distanceBetweenPoints(startPos, endPos);
        const veinAngle = MATH.pointsAngle(startPos, endPos);
        const veinAngleDegree = MATH.degrees(veinAngle);

        const startCtrlLength = veinLength * preset.limbStartCtrlLength;
        const endCtrlLength = veinLength * preset.limbEndCtrlLength;
        
        const limbStartAngleA = veinAngleDegree + preset.limbStartCtrlAngle;
        const limbEndAngleA = veinAngleDegree + preset.limbEndCtrlAngle;
        const limbA = new BezierCurve(startPos, endPos, limbStartAngleA, startCtrlLength, limbEndAngleA, endCtrlLength);
        this.limbs.push(limbA);
        
        const limbStartAngleB = veinAngleDegree - preset.limbStartCtrlAngle;
        const limbEndAngleB = veinAngleDegree - preset.limbEndCtrlAngle;
        const limbB = new BezierCurve(startPos, endPos, limbStartAngleB, startCtrlLength, limbEndAngleB, endCtrlLength);
        this.limbs.push(limbB);
        
        const veinCtrlLength = veinLength * preset.veinCtrlLength;
        const veinStartCtrlAngle = veinAngleDegree + preset.veinStartCtrlAngle * symetry;
        const veinEndCtrlAngle = veinAngleDegree + preset.veinEndCtrlAngle * symetry;
        const vein = new BezierCurve(startPos, endPos, veinStartCtrlAngle, veinCtrlLength, veinEndCtrlAngle, veinCtrlLength);
        this.veins.push(vein);
    }
}

export default Leaf;