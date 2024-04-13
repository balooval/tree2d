import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { radians, randomize, hslToRgb } from "../Math.js";
import * as Render3D from './Render3d.js';
import {
	Mesh,
    BufferGeometry,
    BufferAttribute,
    ShaderMaterial,
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

        this.material = new ShaderMaterial({
            fragmentShader: FragmentShader,
            vertexShader: VertexShader,
        })
        this.meshes = new Map();
        this.vertices = [];
        this.vertexColors = [];
    }

    deleteTree(tree) {
        const treeMesh = this.meshes.get(tree);
        treeMesh.geometry.dispose();
        Render3D.scene.remove(treeMesh);
        this.meshes.delete(tree);
    }

    draw(tree) {
        if (this.meshes.has(tree) === false) {
            const treeMesh = new Mesh(new BufferGeometry(), this.material);
            Render3D.addToScene(treeMesh);
            this.meshes.set(tree, treeMesh);
        }

        const geometry = this.meshes.get(tree).geometry;

        this.vertices = [];
        this.vertexColors = [];
        this.vertexUvs = [];
        this.vertexNoiseUvs = [];

        tree.getBranchs().forEach(branch => {
            this.#drawBranch(branch);
        });

        geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.vertices), 3));
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.vertexColors), 3));
        geometry.setAttribute('uvs', new BufferAttribute(new Float32Array(this.vertexUvs), 2));
        geometry.setAttribute('noiseuvs', new BufferAttribute(new Float32Array(this.vertexNoiseUvs), 2));
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