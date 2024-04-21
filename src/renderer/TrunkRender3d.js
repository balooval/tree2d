import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { radians, randomize, hslToRgb } from "../Math.js";
import { worldToNormalizedX, worldToNormalizedY } from "./BaseRender.js";
import * as Render3D from './Render3d.js';
import {
	Mesh,
    BufferGeometry,
    BufferAttribute,
    ShaderMaterial,
    MeshBasicMaterial,
    DoubleSide,
    CanvasTexture,
    Vector2,
} from '../../vendor/three.module.js';
import VertexShader from '../shaders/TrunkVertex.js';
import FragmentShader from '../shaders/TrunkFragment.js';

const glOrigin = GlMatrix.fromValues(0, 0);

class TrunkRender3d {
    constructor(render, lightSource) {
        this.render = render;
        this.lightSource = lightSource;
        this.trunkPointA = GlMatrix.create();
        this.trunkPointB = GlMatrix.create();
        this.trunkPointC = GlMatrix.create();
        this.trunkPointD = GlMatrix.create();

        this.material = null;

        // this.material = new MeshBasicMaterial( {color: 0xffffff});
        this.meshes = new Map();
        this.treesCycles = new Map();
        this.vertices = [];
        this.vertexColors = [];
        this.vertexNormals = [];
    }

    init(shadowLayer) {
        // console.log('shadowLayer', shadowLayer.canvas);

        const shadowTexture = new CanvasTexture(shadowLayer.canvas);

        const uniforms = {
            trunkNoiseSmall: {type: 'float', value: 0.01},
            trunkNoiseMid: {type: 'float', value: 0.07},
            trunkNoiseBig: {type: 'float', value: 0.1},
            shadowTexture: {value: shadowTexture},
            lightDirection: {value: new Vector2(0, 0, 1)},
        }

        this.material = new ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: FragmentShader,
            vertexShader: VertexShader,
        });
    }

    deleteTree(tree) {
        const treeMesh = this.meshes.get(tree);
        treeMesh.geometry.dispose();
        Render3D.scene.remove(treeMesh);
        this.meshes.delete(tree);
    }

    update() {
        this.material.uniforms.lightDirection.value.x = this.lightSource.glDirection[0] * -1;
        this.material.uniforms.lightDirection.value.y = this.lightSource.glDirection[1] * -1;
        this.material.uniforms.lightDirection.value.z = 1;
    }

    draw(tree) {
        if (this.meshes.has(tree) === false) {
            const treeMesh = new Mesh(new BufferGeometry(), this.material);
            
            Render3D.addToScene(treeMesh);
            this.meshes.set(tree, treeMesh);
            this.treesCycles.set(tree, -1);
        }
        
        this.material.uniforms.shadowTexture.value.needsUpdate = true;


        const geometry = this.meshes.get(tree).geometry;
        const lastCycle = this.treesCycles.get(tree);

        if (lastCycle === tree.cycle) {
            return;
        }

        this.vertices = [];
        this.vertexColors = [];
        this.vertexNormals = [];
        this.vertexUvs = [];
        this.vertexNoiseUvs = [];

        const treeBranchs = tree.getBranchs()
        treeBranchs.forEach(branch => {
            // this.#drawBranch(branch);
            this.#drawBranchRound(branch);
        });

        geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.vertices), 3));
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.vertexColors), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(this.vertexNormals), 3));
        geometry.setAttribute('uvs', new BufferAttribute(new Float32Array(this.vertexUvs), 2));
        geometry.setAttribute('noiseuvs', new BufferAttribute(new Float32Array(this.vertexNoiseUvs), 2));

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        // geometry.computeVertexNormals();
    }

    #drawBranchRound(branch) {
        const width = branch.getWidth();
        const parentWidth = branch.parent.getWidth();

        const quadsCount = 8;
        const totalAngle = Math.PI;
        const angleStep = totalAngle / quadsCount;
        const angleStart = 0 - (Math.PI / 1);

        const branchAngle = Math.atan2(branch.glDirection[0], branch.glDirection[1]);
        const branchparentAngle = Math.atan2(branch.parent.glDirection[0], branch.parent.glDirection[1]);

        const colors = [
            branch.parent.trunkHSL,
            branch.parent.trunkHSL,
            branch.trunkHSL,
            branch.trunkHSL,
            branch.parent.trunkHSL,
            branch.trunkHSL,
        ];
        const widths = [
            parentWidth,
            parentWidth,
            width,
            width,
            parentWidth,
            width,
        ];
        const positions = [
            branch.parent.glEnd,
            branch.parent.glEnd,
            branch.glEnd,
            branch.glEnd,
            branch.parent.glEnd,
            branch.glEnd,
        ];
        const horizontalAngles = [
            branchparentAngle,
            branchparentAngle,
            branchAngle,
            branchAngle,
            branchparentAngle,
            branchAngle,
        ];
        const stepAngleOffsets = [
            0,
            1,
            0,
            0,
            1,
            1,
        ];

        for (let i = 0; i < quadsCount; i ++) {
            /**
             * BL
             * BR
             * TL
             * TL
             * BR
             * TL
             */
            for (let j = 0; j < stepAngleOffsets.length; j ++) {
                this.#buildBranchVertex(
                    (angleStep * (i + stepAngleOffsets[j])) + angleStart,
                    horizontalAngles[j],
                    positions[j],
                    widths[j],
                    colors[j],
                );
            }

            this.vertexNoiseUvs.push(
                branch.uvs[0] + (width / quadsCount) * (i + 0), branch.uvs[1],
                branch.uvs[0] + (width / quadsCount) * (i + 1), branch.uvs[1],
                branch.uvs[0] + (width / quadsCount) * (i + 0), branch.uvs[3],
                branch.uvs[0] + (width / quadsCount) * (i + 0), branch.uvs[3],
                branch.uvs[0] + (width / quadsCount) * (i + 1), branch.uvs[1],
                branch.uvs[0] + (width / quadsCount) * (i + 1), branch.uvs[3],
            );
        }
    }

    #buildBranchVertex(stepAngle, horizontalAngle, position, width, trunkHSL) {
        const trigoX = Math.cos(stepAngle) * Math.cos(horizontalAngle);
        const trigoY = Math.cos(stepAngle) * Math.sin(horizontalAngle);
        const trigoZ = Math.sin(stepAngle);

        const posX = position[0] + trigoX * width;
        const posY = position[1] - trigoY * width;
        const posZ = trigoZ * width;

        this.vertices.push(posX, posY, posZ);

        this.vertexNormals.push(
            trigoX,
            0 - trigoY,
            0 - trigoZ,
        );

        this.vertexUvs.push(
            worldToNormalizedX(posX),
            worldToNormalizedY(posY),
        );

        this.vertexColors.push(
            trunkHSL.h / 360, trunkHSL.s / 100, trunkHSL.l / 100,
        );
    }

    #drawBranch(branch) {
        const widthScale = 1;
        const width = branch.getWidth() * widthScale;
        const parentWidth = branch.parent.getWidth() * widthScale;

        this.#updateCornerPoint(this.trunkPointA, branch, width, 90);
        this.#updateCornerPoint(this.trunkPointB, branch, width, -90);
        this.#updateCornerPoint(this.trunkPointC, branch.parent, parentWidth, -90);
        this.#updateCornerPoint(this.trunkPointD, branch.parent, parentWidth, 90);

        this.vertices.push(
            this.trunkPointA[0], this.trunkPointA[1], 0,
            this.trunkPointC[0], this.trunkPointC[1], 0,
            this.trunkPointB[0], this.trunkPointB[1], 0,
            
            this.trunkPointC[0], this.trunkPointC[1], 0,
            this.trunkPointA[0], this.trunkPointA[1], 0,
            this.trunkPointD[0], this.trunkPointD[1], 0,
        );

        const branchRgb = hslToRgb(branch.trunkHSL.h / 360, branch.trunkHSL.s / 100, branch.trunkHSL.l / 100);
        const parentRgb = hslToRgb(branch.parent.trunkHSL.h / 360, branch.parent.trunkHSL.s / 100, branch.parent.trunkHSL.l / 100);
        this.vertexColors.push(
            branchRgb[0], branchRgb[1], branchRgb[2],
            branchRgb[0], branchRgb[1], branchRgb[2],
            parentRgb[0], parentRgb[1], parentRgb[2],
            parentRgb[0], parentRgb[1], parentRgb[2],
            parentRgb[0], parentRgb[1], parentRgb[2],
            branchRgb[0], branchRgb[1], branchRgb[2],
        );

        this.vertexUvs.push(
            0, 0,
            1, 1,
            1, 0,
            1, 1,
            0, 0,
            0, 1,
        );

        const xOffset = width * 20;
        this.vertexNoiseUvs.push(
            this.trunkPointA[0], this.trunkPointA[1],
            this.trunkPointA[0] + xOffset, this.trunkPointA[1],
            this.trunkPointD[0] + xOffset, this.trunkPointD[1],

            this.trunkPointD[0] + xOffset, this.trunkPointD[1],
            this.trunkPointD[0], this.trunkPointD[1],
            this.trunkPointA[0], this.trunkPointA[1],
        );
    }

    #updateCornerPoint(destPoint, branch, width, angle) {
        GlMatrix.rotate(
            destPoint,
            branch.glDirection,
            glOrigin,
            radians(angle)
        );
        GlMatrix.scale(
            destPoint,
            destPoint,
            width
        );
        GlMatrix.add(
            destPoint,
            branch.glEnd,
            destPoint
        );
    }
}

export {TrunkRender3d as default};