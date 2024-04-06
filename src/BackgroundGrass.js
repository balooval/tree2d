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
        const width = 4;
        const height = 3;

        this.seedCount = 1000;
        const seedGeometry = new BufferGeometry();
        const seedVertices = new Float32Array([
            0, height * 12, 0,
            width * -1, height * 14, 0,
            width * 1, height * 14, 0,

            0, height * 14, 0,
            width * -1, height * 17, 0,
            width * 1, height * 17, 0,
        ]);
        seedGeometry.setAttribute('position', new BufferAttribute(seedVertices, 3));
        this.seedMesh = new InstancedMesh(seedGeometry, material, this.seedCount);

        const grassGeometry = new BufferGeometry();
        const grassVertices = new Float32Array([
            width * -1, 0, 0,
            width * 1, 0, 0,
            width * -0.5, height * 12, 0,
            
            width * -0.5, height * 12, 0,
            width * 1, 0, 0,
            width * 0.5, height * 12, 0,
            
            width * 0.5, height * 12, 0,
            width * -0.5, height * 12, 0,
            0, height * 15, 0,
        ]);

        grassGeometry.setAttribute('position', new BufferAttribute(grassVertices, 3));
        
        this.grassCount = 10000;
        this.matrix = new Matrix4();
        this.grassMesh = new InstancedMesh(grassGeometry, material, this.grassCount);
        const color = new Color(`hsl(80, 50%, 50%)`);
        const quaternion = new Quaternion();

        noise.seed(Math.random());
        // noise.seed(26);

        let currentPoGroup = 0;
        let currentPosX = randomize(0, 700);
        let currentDepth = randomize(0, 35);
        
        for (let i = 0; i < this.grassCount; i ++) {
            // randomizeMatrix(this.matrix, groundPosition * 0.8);

            

            const position = new Vector3();
            const scale = new Vector3();

            // const depth = randomize(0, 35);

            currentPoGroup ++;
            if (currentPoGroup % 10 === 0) {
                currentPosX = randomize(0, 700);
                currentDepth = randomize(0, 70);
            }

            position.x = currentPosX + randomize(0, 10);
            position.y = groundPosition + randomize(0, 5) - (currentDepth * 1);
            position.z = currentDepth;
            // const scaleRatio = 1 - Math.abs(0 - position.x) * 0.001;
            const scaleRatio = 1;
            scale.x = scale.y = scale.z = randomize(1, 0.5) * scaleRatio;

            if (Math.random() > 0.95) {
                scale.y *= 2;
            }
            this.matrix.compose(position, quaternion, scale);

            this.grassMesh.setMatrixAt(i, this.matrix);
            
            // color.setHSL(0.22, 0.5, randomize(0.3, 0.15));
            // const hue = 0.2 + (((Math.abs(position.x) % 400) / 400) * 0.2);
            // const light = 0.2 + (((Math.abs(position.x) % 400) / 400) * 0.2);

            const noiseValueA = noise.perlin2(position.x * 0.007, currentDepth * 0.01);
            const noiseValueB = noise.perlin2(position.x * 0.07, currentDepth * 0.1);
            const noiseValue = noiseValueA + (noiseValueB * 0.3);

            const hue = 0.18 + (noiseValue + 1) * 0.05;
            const sat = 0.4 + (noiseValue * 0.1);
            const light = 0.4 + (noiseValue * 0.1);
            
            color.setHSL(0.22, sat, light);
            this.grassMesh.setColorAt(i, color);


            let angle = randomize(0, 0.5);
            angle += noise.perlin2(position.x * 0.005, currentDepth * 0.001) * 0.6;
            quaternion.setFromAxisAngle(new Vector3(0, 0, 1), angle);

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
        return;
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