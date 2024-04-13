import {
    BufferGeometry,
    BufferAttribute,
} from '../../../vendor/three.module.js';



export function createGeometry() {
    const size = 2;
    const innerSize = size * 0.7;
    const vertPos = [];

    const angleStep = 0.4;
    const angles = [
        0,
        1,
        -1,
        2,
        -2
    ];
    const anglesScale = [
        1,
        0.8,
        0.8,
        0.5,
        0.5,
    ];

    for (let i = 0; i < angles.length; i ++) {
        const angle = angles[i] - (angleStep * anglesScale[i]);
        const nextAngle = angles[i] + (angleStep * anglesScale[i]);
        const midAngle = angles[i];
        const localSize = size * anglesScale[i];
        const localInnerSize = innerSize * anglesScale[i];

        vertPos.push(
            0, 0, 0,
            Math.sin(nextAngle) * localInnerSize, Math.cos(nextAngle) * localInnerSize, 0,
            Math.sin(angle) * localInnerSize, Math.cos(angle) * localInnerSize, 0,
            
            Math.sin(angle) * localInnerSize, Math.cos(angle) * localInnerSize, 0,
            Math.sin(nextAngle) * localInnerSize, Math.cos(nextAngle) * localInnerSize, 0,
            Math.sin(midAngle) * size, Math.cos(midAngle) * localSize, 0,
        );
    }
    
    const leafGeometry = new BufferGeometry();
    leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
    leafGeometry.computeBoundingBox();
    leafGeometry.computeBoundingSphere();
    leafGeometry.computeVertexNormals();
    return leafGeometry;
}