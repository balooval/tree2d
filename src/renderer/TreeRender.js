import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { leavesPresets } from "./LeavesDrawer.js";
import { radians } from "../Math.js";

const glOrigin = GlMatrix.fromValues(0, 0);

class TreeRender {
    constructor(render, lightSource, trunkRender, leafDrawer, grassDrawer) {
        this.render = render;
        this.lightSource = lightSource;
        this.viewLeaves = true;
        this.leafDrawer = leafDrawer;
        this.grassDrawer = grassDrawer;
        this.trunkRender = trunkRender;

        this.trunkPointA = GlMatrix.create();
        this.trunkPointB = GlMatrix.create();
        this.trunkPointC = GlMatrix.create();
        this.trunkPointD = GlMatrix.create();
    }

    setViewLeaves(state) {
        this.viewLeaves = state;
    }

    draw(tree) {
        this.trunkRender.draw(tree); // TODO: Si plusieurs arbres, alors le trunkRender est écrasé à chaque arbre
        
        this.leafDrawer.setLowQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(tree, branch);
        });
        this.leafDrawer.endDraw();
    }

    drawHighQualityLeaves(tree) {
        this.leafDrawer.setFullQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(tree, branch);
        });
        this.leafDrawer.endDraw();
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

        const lightQuantity = Math.min(4, branch.budsLight);
        // const lightQuantity = branch.attractors.length;

        this.leafDrawer.draw(tree, branch.glEnd, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

export {TreeRender as default};