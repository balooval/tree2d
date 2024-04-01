import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { radians, randomize, lerpPoint } from "../Math.js";

const glOrigin = GlMatrix.fromValues(0, 0);

class TrunkRender {
    constructor(render, lightSource) {
        this.render = render;
        this.lightSource = lightSource;
        this.trunkPointA = GlMatrix.create();
        this.trunkPointB = GlMatrix.create();
        this.trunkPointC = GlMatrix.create();
        this.trunkPointD = GlMatrix.create();
    }

    draw(tree) {
        tree.getBranchs().forEach(branch => {
            this.#drawBranch(branch);
        });

    }

    #drawBranch(branch) {
        const widthScale = 1;
        const width = branch.getWidth() * widthScale;
        const parentWidth = branch.parent.getWidth() * widthScale;

        this.#updateCornerPoint(this.trunkPointA, branch, width, 90);
        this.#updateCornerPoint(this.trunkPointB, branch, width, -90);
        this.#updateCornerPoint(this.trunkPointC, branch.parent, parentWidth, -90);
        this.#updateCornerPoint(this.trunkPointD, branch.parent, parentWidth, 90);

        const glPoints = [
            this.trunkPointA,
            this.trunkPointB,
            this.trunkPointC,
            this.trunkPointD,
        ];
        
        
        this.render.glDrawPolygon(glPoints, `hsl(${branch.trunkHSL.h}, ${branch.trunkHSL.s}%, ${branch.trunkHSL.l}%)`);
        // this.render.glDrawPolygon(glPoints, 'rgb(255, 0, 0)');
        this.#drawCracks(branch);
    }

    #drawCracks(branch) {
        const distance = Math.max(
            GlMatrix.dist(this.trunkPointA, this.trunkPointB),
            GlMatrix.dist(this.trunkPointC, this.trunkPointD),
        );

        const passWidth = 8;
        const depthPass = Math.round(distance / passWidth);


        for (let i = 0; i < depthPass; i ++) {
            const count = Math.round(distance / passWidth)
            
            for (let j = 0; j <= count; j ++) {
                const width = passWidth - (i * 2);
                const heightVariation = ((depthPass - i) / depthPass) * 0.3;
                // console.log('width', width);
                // const lerpPercent = ((j + 0.5) / count) * 1;
                const lerpPercent = (j / count);
                // console.log('lerpPercent', j, lerpPercent);
                const start = lerpPoint(this.trunkPointD, this.trunkPointC, lerpPercent);
                const end = lerpPoint(this.trunkPointA, this.trunkPointB, lerpPercent);
                const startB = lerpPoint(start, end, randomize(0, heightVariation));
                const endB = lerpPoint(start, end, randomize(1, heightVariation));
                const darkness = Math.max(10, (depthPass - i) * 5);
                const color = `hsl(${branch.trunkHSL.h}, ${branch.trunkHSL.s}%, ${branch.trunkHSL.l - darkness}%)`;
                this.render.glDrawLine(startB, endB, width, color);
            }
        };



        /*
        const crackSpace = 12;
        const passes = [
            {
                baseWidth: 8,
                darkness: 20,
                heightVariation: 0.2,
            },
            {
                baseWidth: 6,
                darkness: 10,
                heightVariation: 0.1,
            },
            {
                baseWidth: 4,
                darkness: 0,
                heightVariation: 0,
            },
        ];

        passes.forEach(pass => {
            const variation = pass.baseWidth * 0.2;

            const count = Math.round(distance / crackSpace)
            
            for (let i = 0; i <= count; i ++) {
                const width = pass.baseWidth;
                // console.log('width', width);
                const lerpPercent = Math.min(1, randomize(i / count, (i / count) * 0.2));
                const start = lerpPoint(this.trunkPointD, this.trunkPointC, lerpPercent);
                const end = lerpPoint(this.trunkPointA, this.trunkPointB, lerpPercent);
                const startB = lerpPoint(start, end, randomize(0, pass.heightVariation));
                const endB = lerpPoint(start, end, randomize(1, pass.heightVariation));
                const color = `hsl(${branch.trunkHSL.h}, ${branch.trunkHSL.s}%, ${branch.trunkHSL.l - pass.darkness}%)`;
                this.render.glDrawLine(startB, endB, width, color);
            }
        });
        */
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

export {TrunkRender as default};