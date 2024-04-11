import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { random, randomize } from "../Math.js";
import { glCanvasToWorldPosition } from "./BaseRender.js";
import * as Render3D from './Render3d.js';
import FragmentShader from '../shaders/LeavesFragment.js';
import VertexShader from '../shaders/LeavesVertex.js';
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
    ShaderMaterial,
    InstancedBufferAttribute,
    Vector2,
} from '../../vendor/three.module.js';
import * as UiMouse from '../UiMouse.js';


const glOrigin = GlMatrix.fromValues(0, 0);
const glGround = GlMatrix.fromValues(1, 0);

export const leavesPresets = {
    standard: {
        baseLife: 100,
        translationSpeed: 4,
        heliotropism: [0, -1],
        shape: 'round',
    },
    spike: {
        baseLife: 100,
        translationSpeed: 4,
        heliotropism: [0, 0.5],
        shape: 'quad',
    }
};

export class LeafDrawer3d {
    constructor(render, lightSource, treeLayer) {
        this.render = render;
        this.treeLayer = treeLayer;
        this.particlesCount = 72;
        this.particlesToDraw = this.particlesCount;
        this.particles = [];
        this.formRatio = 0;
        this.heliotropism = GlMatrix.create();
        this.lightSource = lightSource;
        this.hue = 80;
        this.saturation = 55;
        this.luminence = 45;
        this.tree = null;
        this.shadowOffset = 0;
        this.growIsRunning = false;
        this.shadowGlPosition = GlMatrix.create();
        this.particleGlTranslation = GlMatrix.create();
        this.particleGlOrientation = GlMatrix.create();

        this.preset = leavesPresets.standard;

        this.maxWhileLoop = 999999;

        this.leafPointA = GlMatrix.create();
        this.leafPointB = GlMatrix.create();
        this.leafPointC = GlMatrix.create();
        this.leafPointD = GlMatrix.create();

        for (let i = 0; i < this.particlesCount; i ++) {
            this.particles.push({
                glPosition: GlMatrix.fromValues(0, 0),
                orientation: GlMatrix.fromValues(0, 1),
                originalOrientation: GlMatrix.fromValues(0, 1),
                size: 1,
                life: 1,
                lightReceived: 1,
            });
        }

        this.time = 0;

        this.matrix = new Matrix4();
        this.leafCount = 500000;

        const globalColor = new Color(`hsl(${this.hue}, ${this.saturation}%, ${this.luminence}%)`);

        const uniforms = {
            time: {type: 'float', value: this.time},
            groundPosition: {type: 'float', value: 0},
            mousePosition: {value: new Vector2(0, 0)},
            lightDirection: {value: new Vector2(0, 0)},
            globalColor: {value: globalColor},
        }
        const leafMaterial = new ShaderMaterial({
            uniforms: uniforms,
            side: DoubleSide,
            fragmentShader: FragmentShader,
            vertexShader: VertexShader,
        })


        this.leafGeometry = this.#createPalmGeometry();
        // this.leafGeometry = this.#createStarGeometry();
        this.leafMesh = new InstancedMesh(this.leafGeometry, leafMaterial, this.leafCount);
        Render3D.addToScene(this.leafMesh);


        this.currentInstanceIndex = 0;
        const position = new Vector3();
        const scale = new Vector3();
        const quaternion = new Quaternion();
        this.leavesPositions = [];
        this.leavesOrientations = [];
        this.leavesDistance = [];
        this.leavesLightReceived = [];

        for (let i = 0; i < this.leafCount; i++) {
            const currentDepth = 0;

            position.x = 0;
            position.y = 0;
            position.z = currentDepth;

            this.leavesPositions.push(0, 0, currentDepth);
            this.leavesOrientations.push(1, 0);
            this.leavesDistance.push(1);
            this.leavesLightReceived.push(1);

            scale.x = scale.y = scale.z = 1;

            this.matrix.compose(position, quaternion, scale);


            this.leafMesh.setMatrixAt(i, this.matrix);
        }

        this.leafGeometry.setAttribute('instancePosition', new InstancedBufferAttribute(new Float32Array(this.leavesPositions), 3));
        this.leafGeometry.setAttribute('instanceOrientations', new InstancedBufferAttribute(new Float32Array(this.leavesOrientations), 2));
        this.leafGeometry.setAttribute('instanceDistance', new InstancedBufferAttribute(new Float32Array(this.leavesDistance), 1));
        this.leafGeometry.setAttribute('instanceLightReceived', new InstancedBufferAttribute(new Float32Array(this.leavesLightReceived), 1));

        this.leafMesh.instanceMatrix.needsUpdate = true;
        // this.leafMesh.instanceColor.needsUpdate = true;
    }

    #createPalmGeometry() {
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
                Math.cos(angle) * localInnerSize, Math.sin(angle) * localInnerSize, 0,
                Math.cos(nextAngle) * localInnerSize, Math.sin(nextAngle) * localInnerSize, 0,
                
                Math.cos(angle) * localInnerSize, Math.sin(angle) * localInnerSize, 0,
                Math.cos(midAngle) * size, Math.sin(midAngle) * localSize, 0,
                Math.cos(nextAngle) * localInnerSize, Math.sin(nextAngle) * localInnerSize, 0,
            );

            i
        }
        
        const leafGeometry = new BufferGeometry();
        leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
        leafGeometry.computeBoundingBox();
        leafGeometry.computeBoundingSphere();
        leafGeometry.computeVertexNormals();
        return leafGeometry;
    }

    #createStarGeometry() {
        const size = 1;
        const innerSize = size * 0.8;
        const vertPos = [];
        const circleEdges = 12;
        const fullAngle = Math.PI * 2;
        const angleStep = fullAngle / circleEdges;

        for (let i = 0; i < circleEdges; i ++) {
            const angle = angleStep * i;
            const nextAngle = angleStep * (i + 1);
            const midSize = size * 1.5;
            const midAngle = angleStep * (i + 0.5);

            vertPos.push(
                0, 0, 0,
                Math.cos(angle) * innerSize, size + Math.sin(angle) * innerSize, 0,
                Math.cos(nextAngle) * innerSize, size + Math.sin(nextAngle) * innerSize, 0,
                
                Math.cos(angle) * innerSize, size + Math.sin(angle) * innerSize, 0,
                Math.cos(midAngle) * size, size + Math.sin(midAngle) * size, 0,
                Math.cos(nextAngle) * innerSize, size + Math.sin(nextAngle) * innerSize, 0,
            );

            i
        }

        
        const leafGeometry = new BufferGeometry();
        leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
        leafGeometry.computeBoundingBox();
        leafGeometry.computeBoundingSphere();
        leafGeometry.computeVertexNormals();
        return leafGeometry;
    }

    setPreset(preset) {
        this.preset = preset;
    }

    setFullQuality() {
        this.particlesToDraw = this.particlesCount;
        this.maxWhileLoop = 999999;
        this.currentInstanceIndex = 0;
        this.leavesPositions = [];
        this.leavesOrientations = [];
        this.leavesDistance = [];
        this.leavesLightReceived = [];
    }
    
    setLowQuality() {
        this.particlesToDraw = 4;
        this.maxWhileLoop = 10;
        this.currentInstanceIndex = 0;
        this.leavesPositions = [];
        this.leavesOrientations = [];
        this.leavesDistance = [];
        this.leavesLightReceived = [];
    }

    setColor(hue) {
        this.hue = hue;

        const globalColor = new Color(`hsl(${this.hue}, ${this.saturation}%, ${this.luminence}%)`);
        this.leafMesh.material.uniforms.globalColor.value = globalColor;
    }

    update() {
        // console.log('this.lightSource.glDirection', this.lightSource.glDirection[0], this.lightSource.glDirection[1]);
        this.time ++;
        this.leafMesh.material.uniforms.lightDirection.value.x = this.lightSource.glDirection[0] * -1;
        this.leafMesh.material.uniforms.lightDirection.value.y = this.lightSource.glDirection[1] * -1;
        this.leafMesh.material.uniforms.time.value = this.time;
        this.leafMesh.material.uniforms.mousePosition.value = glCanvasToWorldPosition(UiMouse.mousePosition);
        if (this.tree) {
            this.leafMesh.material.uniforms.groundPosition.value = this.tree.position[1];
        }
    }

    endDraw() {
        this.leafMesh.count = this.currentInstanceIndex;
        this.leafGeometry.setAttribute('instancePosition', new InstancedBufferAttribute(new Float32Array(this.leavesPositions), 3));
        this.leafGeometry.setAttribute('instanceOrientations', new InstancedBufferAttribute(new Float32Array(this.leavesOrientations), 2));
        this.leafGeometry.setAttribute('instanceDistance', new InstancedBufferAttribute(new Float32Array(this.leavesDistance), 1));
        this.leafGeometry.setAttribute('instanceLightReceived', new InstancedBufferAttribute(new Float32Array(this.leavesLightReceived), 1));
    }

    draw(tree, position, size, lightQuantity, formRatio, heliotropism) {
        // TODO: pouvoir dessiner plusieurs feuillages en ayant une mesh par arbre
        this.tree = tree;
        this.formRatio = formRatio;
        this.heliotropism = heliotropism;
        
        const angle = Math.atan2(this.lightSource.glDirection[0], this.lightSource.glDirection[1]) * -1;
        this.shadowOffset = Math.tan(angle);

        this.#setupParticles(position, Math.min(4, size), lightQuantity);

        this.growIsRunning = true;
        let loopCounter = 0;

        while (this.growIsRunning === true) {
            this.#grow();
            this.#drawStep(loopCounter);

            loopCounter ++;
            if (loopCounter > this.maxWhileLoop) {
                this.growIsRunning = false;
            }
        }

        this.leafMesh.instanceMatrix.needsUpdate = true;
        // this.leafMesh.instanceColor.needsUpdate = true;
    }

    #setupParticles(position, size, lightQuantity) {

        const baseLife = this.preset.baseLife;

        for (let i = 0; i < this.particlesToDraw; i ++) {
            GlMatrix.rotate(this.particleGlOrientation, glGround, glOrigin, i * 5);
            GlMatrix.set(this.particles[i].originalOrientation, this.particleGlOrientation[0], this.particleGlOrientation[1]);

            GlMatrix.copy(this.particles[i].glPosition, position);
            GlMatrix.add(this.particles[i].orientation, this.particleGlOrientation, this.heliotropism);
            this.particles[i].size = (8 * size) + Math.random() * 1;
            this.particles[i].life = (baseLife * size) + Math.random() * (baseLife / 2);
            this.particles[i].lightReceived = lightQuantity * 0.1;
        }
    }

    #drawStep(loopCounter) {
        const position = new Vector3();
        const scale = new Vector3();
        const quaternion = new Quaternion();

        for (let i = 0; i < this.particlesToDraw; i++) {
            if (this.currentInstanceIndex > this.leafCount) {
                console.log('MORE LEAVES THAN', this.currentInstanceIndex);
                return;
            }
            
            if (Math.random() < 0.9) {
                continue;
            }

            const particle = this.particles[i];

            if (particle.life <= 0) {
                continue;
            }

            const currentDepth = 0;

            scale.x = scale.y = scale.z = particle.size;

            position.x = particle.glPosition[0];
            position.y = particle.glPosition[1];
            position.z = currentDepth;

            this.leavesPositions.push(
                position.x,
                position.y,
                position.z,
            );

            this.leavesOrientations.push(
                particle.originalOrientation[0],
                particle.originalOrientation[1],
            );

            this.leavesDistance.push(loopCounter);
            this.leavesLightReceived.push(particle.lightReceived,);

            const angle = randomize(0, 3.14);
            quaternion.setFromAxisAngle(new Vector3(0, 0, 1), angle);
            this.matrix.compose(position, quaternion, scale);
            this.leafMesh.setMatrixAt(this.currentInstanceIndex, this.matrix);

            this.currentInstanceIndex ++;
        }
    }

    #grow() {
        this.growIsRunning = false;
        const delta = 16;
        const translationSpeed = this.preset.translationSpeed;
        const translationVariation = translationSpeed / 10;

        for (let i = 0; i < this.particlesToDraw; i++) {
            const p = this.particles[i];
            if (p.life <= 0) {
                continue;
            }
            const translationX = p.orientation[0] * (translationSpeed + this.formRatio) + random(translationVariation * -1, translationVariation);
            const translationY = p.orientation[1] * (translationSpeed - this.formRatio) + random(translationVariation * -1, translationVariation);
            GlMatrix.set(this.particleGlTranslation, translationX, translationY)
            GlMatrix.add(p.glPosition, p.glPosition, this.particleGlTranslation);
            p.life -= delta;
            p.size -= delta / 35;
            
            if (p.size <= 0) {
                p.life = 0;
            }
            
            if (p.life <= 0) {
                continue;
            }
            this.growIsRunning = true;
        }
    }
}