import {
    BufferGeometry,
    BufferAttribute,
} from '../../../vendor/three.module.js';



export function createGeometry() {
    const vertPos = [];
    const normals = [];

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
        );

        normals.push(
            -1, -1, 1,
            1, 0, 1,
            -1, 0, 1,
            
            -1, 0, 1,
            1, 0, 1,
            1, 0, 1,
            
            -1, 0, 1,
            1, 0, 1,
            0, 1, 1,
        );
    }

    
    const leafGeometry = new BufferGeometry();
    leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
    leafGeometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    leafGeometry.computeBoundingBox();
    leafGeometry.computeBoundingSphere();
    // leafGeometry.computeVertexNormals();
    return leafGeometry;
}