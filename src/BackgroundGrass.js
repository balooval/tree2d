import * as GlMatrix from "../vendor/gl-matrix/vec2.js";
import * as Render3D from './renderer/Render3d.js';
import { randomize } from './Math.js';
import {
	Vector3,
	MeshBasicMaterial,
	InstancedMesh,
    Quaternion,
    DoubleSide,
    BufferGeometry,
    BufferAttribute,
    Matrix4,
    Color,
    Object3D,
} from '../vendor/three.module.js';

const gravity = GlMatrix.fromValues(0, -0.2);

export class BackgroundGrass {
    constructor(groundPosition) {
        const material = new MeshBasicMaterial( {color: 0xffffff, side: DoubleSide});

        this.time = 0;
        const size = 2;

        this.seedCount = 100;
        const seedGeometry = new BufferGeometry();
        const seedVertices = new Float32Array([
            0, size * 20, 0,
            size * -1, size * 22, 0,
            size * 1, size * 22, 0,

            0, size * 22, 0,
            size * -1, size * 25, 0,
            size * 1, size * 25, 0,
        ]);
        seedGeometry.setAttribute('position', new BufferAttribute(seedVertices, 3));
        this.seedMesh = new InstancedMesh(seedGeometry, material, this.seedCount);

        const grassGeometry = new BufferGeometry();
        const grassVertices = new Float32Array([
            size * -1, 0, 0,
            size * 1, 0, 0,
            size * -1, size * 10, 0,
            
            size * -1, size * 10, 0,
            size * 1, 0, 0,
            size * 1, size * 10, 0,
            
            size * 1, size * 10, 0,
            size * -1, size * 10, 0,
            0, size * 20, 0,
        ]);

        grassGeometry.setAttribute('position', new BufferAttribute(grassVertices, 3));
        
        this.grassCount = 1000;
        this.matrix = new Matrix4();
        this.grassMesh = new InstancedMesh(grassGeometry, material, this.grassCount);
        const color = new Color(`hsl(80, 50%, 50%)`);
        
        for (let i = 0; i < this.grassCount; i ++) {
            randomizeMatrix(this.matrix, groundPosition * 0.8);
            this.grassMesh.setMatrixAt(i, this.matrix);
            
            color.setHSL(0.22, 0.5, randomize(0.3, 0.15));
            this.grassMesh.setColorAt(i, color);

            if (i < this.seedCount) {
                this.seedMesh.setMatrixAt(i, this.matrix);
                this.seedMesh.setColorAt(i, color);
            }
        }

        Render3D.scene.add(this.grassMesh);
        Render3D.scene.add(this.seedMesh);

        this.updatePosition = new Vector3();
        this.updateQuaternion = new Quaternion();
        this.updateScale = new Vector3();

        this.dummy = new Object3D();
    }

    update() {
        // return;
        this.time ++;

        for (let i = 0; i < this.grassCount; i ++) {
            this.grassMesh.getMatrixAt(i, this.matrix);
            
            this.matrix.decompose(this.updatePosition, this.updateQuaternion, this.updateScale);
            const angle = (Math.cos((this.time * 0.01) + (i * 0.003)) * 0.2)
            this.updateQuaternion.setFromAxisAngle(new Vector3(0, 0, 1), angle);
            this.matrix.compose(this.updatePosition, this.updateQuaternion, this.updateScale);

            this.grassMesh.setMatrixAt(i, this.matrix);

            if (i < this.seedCount) {
                this.seedMesh.setMatrixAt(i, this.matrix);
            }
        }

        this.grassMesh.instanceMatrix.needsUpdate = true;
        this.seedMesh.instanceMatrix.needsUpdate = true;
    }
}

function randomizeMatrix(matrix, groundPosition) {

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();

    position.x = randomize(0, 700);
    position.y = groundPosition + randomize(15, 3);
    position.z = 0//Math.random() * 100;
    const scaleRatio = 1 - Math.abs(0 - position.x) * 0.001;
    scale.x = scale.y = scale.z = randomize(1, 0.5) * scaleRatio;

    // quaternion.setFromAxisAngle(new Vector3(1, 0, 0), 1);

    if (Math.random() > 0.95) {
        scale.y *= 2;
    }
    matrix.compose(position, quaternion, scale);
};