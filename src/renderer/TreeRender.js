import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { LeafDrawer, leavesPresets } from "./LeavesDrawer.js";
import { radians } from "../Math.js";
import TrunkRender from "./TrunkRender.js";

const glOrigin = GlMatrix.fromValues(0, 0);

class TreeRender {
    constructor(render, lightSource) {
        this.render = render;
        this.lightSource = lightSource;
        this.viewLeaves = true;
        this.leafDrawer = new LeafDrawer(this.render, this.lightSource);
        this.trunkRender = new TrunkRender(this.render, this.lightSource);

        this.trunkPointA = GlMatrix.create();
        this.trunkPointB = GlMatrix.create();
        this.trunkPointC = GlMatrix.create();
        this.trunkPointD = GlMatrix.create();
    }

    setViewLeaves(state) {
        this.viewLeaves = state;
    }

    draw(tree) {
        this.leafDrawer.setLowQuality();
        this.trunkRender.draw(tree);
        tree.getBranchs().forEach(branch => {
            // this.#drawBranch(branch);
            this.#drawLeaves(tree, branch);
        });

    }

    drawHighQualityLeaves(tree) {
        this.leafDrawer.setFullQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(tree, branch);
        });
    }

    #drawBranch(branch) {
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), branch.trunkColor);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, ${branch.energy > 0 ? 255 : 0}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, 10, `rgb(150, ${(branch.energy / branch.energyNeededToGrow) * 255}, 150)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, ${branch.auxinQuantity * 25}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, ${branch.energyTransferedByCycle * 10}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, 10, `rgb(0, ${(branch.length / branch.preset.newBranchLength) * 50}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, 0, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, 10, `rgb(0, ${branch.mainStrenght * 250}, 0)`);
        // return;

        const width = branch.getWidth();
        const parentWidth = branch.parent.getWidth();

        GlMatrix.add(
            this.trunkPointA,
            branch.glEnd,
            GlMatrix.scale(
                this.trunkPointA,
                GlMatrix.rotate(
                    this.trunkPointA,
                    branch.glDirection,
                    glOrigin,
                    radians(90)
                ),
                width
            )
        );

        GlMatrix.add(
            this.trunkPointB,
            branch.glEnd,
            GlMatrix.scale(
                this.trunkPointB,
                GlMatrix.rotate(
                    this.trunkPointB,
                    branch.glDirection,
                    glOrigin,
                    radians(-90)
                ),
                width
            )
        );

        GlMatrix.add(
            this.trunkPointC,
            branch.parent.glEnd,
            GlMatrix.scale(
                this.trunkPointC,
                GlMatrix.rotate(
                    this.trunkPointC,
                    branch.parent.glDirection,
                    glOrigin,
                    radians(-90)
                ),
                parentWidth
            )
        );

        GlMatrix.add(
            this.trunkPointD,
            branch.parent.glEnd,
            GlMatrix.scale(
                this.trunkPointD,
                GlMatrix.rotate(
                    this.trunkPointD,
                    branch.parent.glDirection,
                    glOrigin,
                    radians(90)
                ),
                parentWidth
            )
        );

        const glPoints = [
            this.trunkPointA,
            this.trunkPointB,
            this.trunkPointC,
            this.trunkPointD,
        ];
        
        this.render.glDrawPolygon(glPoints, branch.trunkColor);

        // if (branch.scar === true) {
        //     this.render.glDrawCircle(branch.glEnd, width, branch.parent.trunkColor);
        // }
    }

    #drawLeaves(tree, branch) {

        if (this.viewLeaves === false) {
            return;
        }

        const leaves = branch.getLeaves();
        const count = leaves.length;
        
        if (count === 0) {
            return;
        }

        const currentLeavesPreset = leavesPresets[tree.preset.leavesPreset];

        this.leafDrawer.setPreset(currentLeavesPreset);
        this.leafDrawer.setColor(tree.preset.leafHue);
        
        const formRatio = 1;
        const heliotropism = GlMatrix.fromValues(currentLeavesPreset.heliotropism[0], currentLeavesPreset.heliotropism[1]);

        const leavesSize = leaves.reduce((cum, leaf) => cum + leaf.energy, 0) * branch.preset.leafScale;

        const lightQuantity = branch.budsLight;
        // const lightQuantity = branch.attractors.length;

        this.leafDrawer.draw(tree, branch.glEnd, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

export {TreeRender as default};