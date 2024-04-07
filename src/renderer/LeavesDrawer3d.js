import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { random, randomize } from "../Math.js";
import { glWorldToCanvasPosition } from "./BaseRender.js";
import * as Render3D from './Render3d.js';
import FragmentShader from '../shaders/fragment.js';
import VertexShader from '../shaders/vertex.js';
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
} from '../../vendor/three.module.js';

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
    // spike: {
    //     baseLife: 400,
    //     translationSpeed: 2,
    //     heliotropism: [0, 0],
    // },
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
                size: 1,
                life: 1,
                shadeValue: 0,
                shadeGradient: GlMatrix.fromValues(0, 1),
            });
        }

        this.time = 0;

        this.matrix = new Matrix4();
        this.leafCount = 500000;
        const leafMaterial = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide});

        const uniforms = {
            time: {type: 'float', value: this.time}
        }
        const leafMaterialA = new ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: FragmentShader,
            vertexShader: VertexShader,
        })


        this.leafGeometry = this.#createGeometry();
        this.leafMesh = new InstancedMesh(this.leafGeometry, leafMaterial, this.leafCount);
        Render3D.addToScene(this.leafMesh);


        this.currentInstanceIndex = 0;
        const position = new Vector3();
        const scale = new Vector3();
        const quaternion = new Quaternion();
        const color = new Color(`hsl(80, 50%, 50%)`);

        for (let i = 0; i < this.leafCount; i++) {
            const currentDepth = 0;

            position.x = 0;
            position.y = 0;
            position.z = currentDepth;

            scale.x = scale.y = scale.z = 1;

            this.matrix.compose(position, quaternion, scale);

            color.setHSL(0.1, 0.3, 0.4);

            this.leafMesh.setMatrixAt(i, this.matrix);
            this.leafMesh.setColorAt(i, color);
        }
        this.leafMesh.instanceMatrix.needsUpdate = true;
        this.leafMesh.instanceColor.needsUpdate = true;
    }

    #createGeometry() {
        const width = 1;
        const height = 1;

        const leafGeometry = new BufferGeometry();
        const leafVertices = new Float32Array([
            width * -0.5, 0, 0,
            width * 0.5, 0, 0,
            0, height * 0.5, 0,
            
            0, height * 0.5, 0,
            width * -0.5, height * 1, 0,
            width * 0.5, height * 1, 0,
        ]);

        leafGeometry.setAttribute('position', new BufferAttribute(leafVertices, 3));
        return leafGeometry;
    }

    setPreset(preset) {
        this.preset = preset;
    }

    setFullQuality() {
        this.particlesToDraw = this.particlesCount;
        this.maxWhileLoop = 999999;
        this.currentInstanceIndex = 0;
    }

    setLowQuality() {
        this.particlesToDraw = 4;
        this.maxWhileLoop = 10;
    }

    setColor(hue) {
        this.hue = hue;
    }

    update() {
        this.time ++;
        // this.leafMesh.material.uniforms.time.value = this.time;
    }

    endDraw() {
        this.leafMesh.count = this.currentInstanceIndex;
    }

    draw(tree, position, size, lightQuantity, formRatio, heliotropism) {
        
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
        this.leafMesh.instanceColor.needsUpdate = true;
    }

    #setupParticles(position, size, lightQuantity) {
        const shadeValue = Math.round(lightQuantity * 10);

        const baseLife = this.preset.baseLife;

        for (let i = 0; i < this.particlesToDraw; i ++) {
            GlMatrix.rotate(this.particleGlOrientation, glGround, glOrigin, i * 5);

            const shadeGradient = GlMatrix.dot(this.lightSource.glDirection, this.particleGlOrientation) * -1;

            GlMatrix.copy(this.particles[i].glPosition, position);
            GlMatrix.add(this.particles[i].orientation, this.particleGlOrientation, this.heliotropism);
            this.particles[i].size = (8 * size) + Math.random() * 1;
            this.particles[i].life = (baseLife * size) + Math.random() * (baseLife / 2);
            this.particles[i].shadeValue = shadeValue;
            this.particles[i].shadeGradient = shadeGradient;
        }
    }

    #drawStep(loopCounter) {
        const position = new Vector3();
        const scale = new Vector3();
        const quaternion = new Quaternion();
        const color = new Color(`hsl(80, 50%, 50%)`);

        for (let i = 0; i < this.particlesToDraw; i++) {
            // const instanceIndex = i + (this.particlesCount * loopCounter);
            if (this.currentInstanceIndex > this.leafCount) {
                return;
            }
            

            // if (Math.random() < 0.8) {
            //     continue;
            // }

            const particle = this.particles[i];

            if (particle.life <= 0) {
                continue;
            }

            color.setHSL(this.hue / 360, 0.65, particle.shadeValue / 100);
            // color.setHSL(0.22, 0.3, 0.2);

            const currentDepth = 0;

            position.x = particle.glPosition[0];
            position.y = particle.glPosition[1];
            position.z = currentDepth;

            scale.x = scale.y = scale.z = particle.size;

            const angle = randomize(0, 2);
            quaternion.setFromAxisAngle(new Vector3(0, 0, 1), angle);

            this.matrix.compose(position, quaternion, scale);

            this.leafMesh.setMatrixAt(this.currentInstanceIndex, this.matrix);
            this.leafMesh.setColorAt(this.currentInstanceIndex, color);

            this.currentInstanceIndex ++;
        }
    }

    #grow() {
        this.growIsRunning = false;
        const delta = 16;
        const translationSpeed = this.preset.translationSpeed;
        const translationVariation = translationSpeed / 2;

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
            p.shadeValue = Math.min(90, Math.max(13, p.shadeValue + p.shadeGradient));
            
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