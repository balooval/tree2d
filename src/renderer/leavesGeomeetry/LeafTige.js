import {
    BufferGeometry,
    BufferAttribute,
} from '../../../vendor/three.module.js';



export function createGeometry() {
    const vertPos = [];
    const normals = [];

    const angleStep = 0.3;
    const angles = [
        0.8,
        -0.8,
        0.8,
        -0.8,
        0.6,
        -0.6,
        0,
    ];

    let startY = 0;
    const midHeight = 0.5;
    const endHeight = midHeight + 0.4;

    for (let i = 0; i < angles.length; i ++) {
        const angle = angles[i] - angleStep;
        const nextAngle = angles[i] + angleStep;
        const midAngle = angles[i];

        vertPos.push(
            0, startY, 0,
            Math.sin(midAngle) * endHeight, startY + Math.cos(midAngle) * endHeight, 0,
            Math.sin(angle) * midHeight, startY + Math.cos(angle) * midHeight, 0,
            
            0, startY, 0,
            Math.sin(nextAngle) * midHeight, startY + Math.cos(nextAngle) * midHeight, 0,
            Math.sin(midAngle) * endHeight, startY + Math.cos(midAngle) * endHeight, 0,
        );

        startY += 0.2;

        normals.push(
            0, -1, 1,
            0, 1, 1,
            -1, 0, 1,

            0, -1, 1,
            1, 0, 1,
            0, 1, 1,
        );
    }

    vertPos.push(
        -0.05, 0, 0,
        0.05, 0, 0,
        0, startY, 0,
    );

    normals.push(
        -1, 0, 1,
        1, 0, 1,
        0, 1, 1,
    );

    const leafGeometry = new BufferGeometry();
    leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
    leafGeometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    leafGeometry.computeBoundingBox();
    leafGeometry.computeBoundingSphere();
    // leafGeometry.computeVertexNormals();
    return leafGeometry;
}