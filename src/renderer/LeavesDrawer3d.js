import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { random, randomize } from "../Math.js";
import { glCanvasToWorldPosition } from "./BaseRender.js";
import * as Render3D from './Render3d.js';
import FragmentShader from '../shaders/LeavesFragment.js';
import VertexShader from '../shaders/LeavesVertex.js';
import {
	Vector3,
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
        id: 'standard',
        baseLife: 100,
        translationSpeed: 4,
        heliotropism: [0, -1],
        shape: 'round',
        randomSkip: 0.9,
        geometryType: 'palm',
        hue: 80,
        saturation: 55,
        scale: 1,
        formRatio: 1.5,
    },
    tige: {
        id: 'tige',
        baseLife: 100,
        translationSpeed: 2,
        heliotropism: [0, 1],
        shape: 'round',
        randomSkip: 0.86,
        geometryType: 'tige',
        hue: 93,
        saturation: 32,
        scale: 1.3,
        formRatio: 2.6,
    },
    spike: {
        id: 'spike',
        baseLife: 100,
        translationSpeed: 4,
        heliotropism: [0, 0.5],
        shape: 'quad',
        randomSkip: 0.8,
        geometryType: 'star',
        hue: 137,
        saturation: 55,
        scale: 0.6,
        formRatio: 1,
    }
};

export class LeafDrawer3d {
    constructor(lightSource, preset) {
        this.particlesCount = 72;
        this.particlesToDraw = this.particlesCount;
        this.particles = [];
        this.heliotropism = GlMatrix.create();
        this.lightSource = lightSource;
        this.luminence = 45;
        this.tree = null;
        this.shadowOffset = 0;
        this.growIsRunning = false;
        this.shadowGlPosition = GlMatrix.create();
        this.particleGlTranslation = GlMatrix.create();
        this.particleGlOrientation = GlMatrix.create();

        this.preset = {id: 'none'};

        this.maxWhileLoop = 999999;

        this.drawInstancePosition = new Vector3();
        this.drawInstanceScale = new Vector3();
        this.drawInstanceQuaternion = new Quaternion();
        this.rotationVector = new Vector3(0, 0, 1);


        this.attributePosition = null;
        this.attributeOrientation = null;
        this.attributeDistance = null;
        this.attributeLightReceived = null;

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

        this.globalColor = new Color(`hsl(80, 55%, ${this.luminence}%)`);

        const uniforms = {
            time: {type: 'float', value: this.time},
            groundPosition: {type: 'float', value: 0},
            mousePosition: {value: new Vector2(0, 0)},
            lightDirection: {value: new Vector2(0, 0)},
            globalColor: {value: this.globalColor},
        }
        const leafMaterial = new ShaderMaterial({
            uniforms: uniforms,
            side: DoubleSide,
            fragmentShader: FragmentShader,
            vertexShader: VertexShader,
        })


        this.leafMesh = new InstancedMesh(null, leafMaterial, this.leafCount);
        this.setPreset(preset)

        // this.leafGeometry = this.#createTigeGeometry();
        // this.leafGeometry = this.#createPalmGeometry();
        // this.leafGeometry = this.#createStarGeometry();
        // this.leafMesh = new InstancedMesh(this.leafGeometry, leafMaterial, this.leafCount);
        Render3D.addToScene(this.leafMesh);


        this.currentInstanceIndex = 0;

        this.#initGeometry();
    }

    #initGeometry() {
        const position = new Vector3(0, 0, 0);
        const scale = new Vector3(1, 1, 1);
        const quaternion = new Quaternion();
        this.matrix.compose(position, quaternion, scale);
        const leavesPositions = [];
        const leavesOrientations = [];
        const leavesDistance = [];
        const leavesLightReceived = [];

        for (let i = 0; i < this.leafCount; i++) {
            leavesPositions.push(0, 0, 0);
            leavesOrientations.push(1, 0);
            leavesDistance.push(1);
            leavesLightReceived.push(1);
            this.leafMesh.setMatrixAt(i, this.matrix);
        }

        this.attributePosition = new InstancedBufferAttribute(new Float32Array(leavesPositions), 3);
        this.attributeOrientation = new InstancedBufferAttribute(new Float32Array(leavesOrientations), 2);
        this.attributeDistance = new InstancedBufferAttribute(new Float32Array(leavesDistance), 1);
        this.attributeLightReceived = new InstancedBufferAttribute(new Float32Array(leavesLightReceived), 1);

        this.leafGeometry.setAttribute('instancePosition', this.attributePosition);
        this.leafGeometry.setAttribute('instanceOrientations', this.attributeOrientation);
        this.leafGeometry.setAttribute('instanceDistance', this.attributeDistance);
        this.leafGeometry.setAttribute('instanceLightReceived', this.attributeLightReceived);

        this.leafMesh.instanceMatrix.needsUpdate = true;
    }

    #createTigeGeometry() {
        const vertPos = [];

        const angleStep = 0.2;
        const angles = [
            0.6,
            -0.6,
            0.6,
            -0.5,
            0.4,
            -0.3,
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
                Math.sin(angle) * midHeight, startY + Math.cos(angle) * midHeight, 0,
                Math.sin(nextAngle) * midHeight, startY + Math.cos(nextAngle) * midHeight, 0,
                
                Math.sin(angle) * midHeight, startY + Math.cos(angle) * midHeight, 0,
                Math.sin(midAngle) * endHeight, startY + Math.cos(midAngle) * endHeight, 0,
                Math.sin(nextAngle) * midHeight, startY + Math.cos(nextAngle) * midHeight, 0,
                
            );

            startY += 0.3;
        }
        
        const leafGeometry = new BufferGeometry();
        leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
        leafGeometry.computeBoundingBox();
        leafGeometry.computeBoundingSphere();
        leafGeometry.computeVertexNormals();
        return leafGeometry;
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
                Math.sin(angle) * localInnerSize, Math.cos(angle) * localInnerSize, 0,
                Math.sin(nextAngle) * localInnerSize, Math.cos(nextAngle) * localInnerSize, 0,
                
                Math.sin(angle) * localInnerSize, Math.cos(angle) * localInnerSize, 0,
                Math.sin(midAngle) * size, Math.cos(midAngle) * localSize, 0,
                Math.sin(nextAngle) * localInnerSize, Math.cos(nextAngle) * localInnerSize, 0,
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
        const innerSize = size * 0.2;
        const vertPos = [];
        const circleEdges = 5;
        const fullAngle = 2;
        const angleStep = fullAngle / circleEdges;
        const halfPi = Math.PI / 2;

        for (let i = 0; i < circleEdges; i ++) {
            const angle = angleStep * i;
            const nextAngle = angleStep * (i + 1);
            const midAngle = angleStep * (i + 0.5);

            vertPos.push(
                // 0, 0, 0,
                // Math.cos(angle) * innerSize, size + Math.sin(angle) * innerSize, 0,
                // Math.cos(nextAngle) * innerSize, size + Math.sin(nextAngle) * innerSize, 0,
                
                Math.cos(angle - halfPi) * innerSize, Math.sin(angle - halfPi) * innerSize, 0,
                Math.cos(angle) * size, Math.sin(angle) * size, 0,
                Math.cos(angle + halfPi) * innerSize, Math.sin(angle + halfPi) * innerSize, 0,

                // Math.cos(angle) * innerSize, Math.sin(angle) * innerSize, 0,
                // Math.cos(midAngle) * size, Math.sin(midAngle) * size, 0,
                // Math.cos(nextAngle) * innerSize, Math.sin(nextAngle) * innerSize, 0,
            );
        }

        
        const leafGeometry = new BufferGeometry();
        leafGeometry.setAttribute('position', new BufferAttribute(new Float32Array(vertPos), 3));
        leafGeometry.computeBoundingBox();
        leafGeometry.computeBoundingSphere();
        leafGeometry.computeVertexNormals();
        return leafGeometry;
    }

    setPreset(preset) {
        if (this.preset.id === preset.id) {
            return;
        }
        this.preset = preset;

        if (this.preset.geometryType === 'palm') {
            this.leafGeometry = this.#createPalmGeometry();
        } else if (this.preset.geometryType === 'tige') {
            this.leafGeometry = this.#createTigeGeometry();
        } else {
            this.leafGeometry = this.#createStarGeometry();
        }
        
        this.#initGeometry();
        this.leafMesh.geometry = this.leafGeometry;
    }

    setFullQuality() {
        this.particlesToDraw = this.particlesCount;
        this.maxWhileLoop = 999999;
        this.currentInstanceIndex = 0;
    }
    
    setLowQuality() {
        this.particlesToDraw = 4;
        this.maxWhileLoop = 10;
        this.currentInstanceIndex = 0;
    }

    update() {
        this.time ++;

        this.globalColor.setStyle(`hsl(${this.preset.hue}, ${this.preset.saturation}%, ${this.luminence}%)`);
        this.leafMesh.material.uniforms.globalColor.value = this.globalColor;

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
        this.attributePosition.needsUpdate = true;
        this.attributeDistance.needsUpdate = true;
        this.attributeOrientation.needsUpdate = true;
        this.attributeLightReceived.needsUpdate = true;
    }

    draw(tree, position, size, lightQuantity, heliotropism) {
        this.tree = tree;
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
        const currentDepth = 0;

        for (let i = 0; i < this.particlesToDraw; i++) {
            if (this.currentInstanceIndex > this.leafCount) {
                console.log('MORE LEAVES THAN', this.currentInstanceIndex);
                return;
            }

            if (Math.random() < this.preset.randomSkip) {
                continue;
            }

            const particle = this.particles[i];

            if (particle.life <= 0) {
                continue;
            }

            this.drawInstanceScale.x = this.drawInstanceScale.y = this.drawInstanceScale.z = particle.size;

            this.drawInstancePosition.x = particle.glPosition[0];
            this.drawInstancePosition.y = particle.glPosition[1];
            this.drawInstancePosition.z = currentDepth;

            this.attributePosition.setXY(this.currentInstanceIndex, particle.glPosition[0], particle.glPosition[1]);
            this.attributeDistance.setX(this.currentInstanceIndex, loopCounter);
            this.attributeOrientation.setXY(this.currentInstanceIndex, particle.originalOrientation[0], particle.originalOrientation[1]);
            this.attributeLightReceived.setX(this.currentInstanceIndex, particle.lightReceived);

            // const angle = randomize(0, 3.14);
            let angle = Math.atan2(particle.originalOrientation[0] * -1, particle.originalOrientation[1]);
            angle = randomize(angle, 1.5);
            this.drawInstanceQuaternion.setFromAxisAngle(this.rotationVector, angle);
            this.matrix.compose(this.drawInstancePosition, this.drawInstanceQuaternion, this.drawInstanceScale);
            this.leafMesh.setMatrixAt(this.currentInstanceIndex, this.matrix);

            this.currentInstanceIndex ++;
        }
    }

    #grow() {
        this.growIsRunning = false;
        const delta = 16;
        const formRatio = this.preset.formRatio;
        const translationSpeed = this.preset.translationSpeed;
        const translationVariation = translationSpeed / 10;

        for (let i = 0; i < this.particlesToDraw; i++) {
            const p = this.particles[i];
            if (p.life <= 0) {
                continue;
            }
            const translationX = p.orientation[0] * (translationSpeed * formRatio) + random(translationVariation * -1, translationVariation);
            const translationY = p.orientation[1] * (translationSpeed / formRatio) + random(translationVariation * -1, translationVariation);
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