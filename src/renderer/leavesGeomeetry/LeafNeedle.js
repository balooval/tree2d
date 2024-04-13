import {
    BufferGeometry,
    BufferAttribute,
} from '../../../vendor/three.module.js';



export function createGeometry() {
    const vertPos = [];
    /*
    const size = 1;
    const innerSize = size * 0.2;
    const circleEdges = 5;
    const fullAngle = 2;
    const angleStep = fullAngle / circleEdges;
    const halfPi = Math.PI / 2;

    for (let i = 0; i < circleEdges; i ++) {
        const angle = angleStep * i;
        const nextAngle = angleStep * (i + 1);
        const midAngle = angleStep * (i + 0.5);

        vertPos.push(
            Math.cos(angle - halfPi) * innerSize, Math.sin(angle - halfPi) * innerSize, 0,
            Math.cos(angle) * size, Math.sin(angle) * size, 0,
            Math.cos(angle + halfPi) * innerSize, Math.sin(angle + halfPi) * innerSize, 0,
        );
    }
    */


    const size = 2;
    const width = 0.1;
    const offsetsStart = [
        -0.1,
        0,
        0.1,
    ];

    const offsetsMid = [
        -0.3,
        0,
        0.3,
    ];

    const offsetsEnd = [
        -0.2,
        0.1,
        0.25,
    ];

    const sizesMid = [
        size * 0.3,
        size * 0.5,
        size * 0.4,
    ];

    const sizesEnd = [
        size * 1,
        size * 1.3,
        size * 1.2,
    ];

    const angleStep = 0.1;
    const xStep = 0.4;

    for (let i = 0; i < offsetsStart.length; i ++) {
        const offsetStart = offsetsStart[i];
        const offsetMid = offsetsMid[i];
        const offsetEnd = offsetsEnd[i];

        vertPos.push(

            offsetStart, 0, 0,
            offsetStart + width, 0, 0,
            offsetMid, sizesMid[i], 0,

            offsetMid, sizesMid[i], 0,
            offsetStart + width, 0, 0,
            offsetMid + width, sizesMid[i], 0,

            offsetMid, sizesMid[i], 0,
            offsetMid + width, sizesMid[i], 0,
            offsetEnd + width / 2, sizesEnd[i], 0,

            // offsetX - Math.cos(angle) * width + Math.sin(angle) * size, offsetX - Math.sin(angle) * width + Math.cos(angle) * size, 0,
            // offsetX + Math.cos(angle) * width + Math.sin(angle) * size, offsetX + Math.sin(angle) * width + Math.cos(angle) * size, 0,
            // offsetX - Math.cos(angle) * width + Math.sin(angle) * size, offsetX - Math.cos(angle) * width + Math.sin(angle) * size, 0,


            // offsetX - Math.cos(angle) * width, offsetX - Math.sin(angle) * width, 0,
            // offsetX + Math.cos(angle) * width, offsetX + Math.sin(angle) * width, 0,
            // offsetX + Math.sin(angle) * size, Math.cos(angle) * size, 0,

            // offsetX, size * 2, 0,
            // offsetX + Math.cos(nextAngle) * width, Math.sin(nextAngle) * width, 0,
            // offsetX + Math.sin(angle) * size, Math.cos(angle) * size, 0,
        );
    }

    
    const leafGeometry = new BufferGeometry();
    leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
    leafGeometry.computeBoundingBox();
    leafGeometry.computeBoundingSphere();
    leafGeometry.computeVertexNormals();
    return leafGeometry;
}