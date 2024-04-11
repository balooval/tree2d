import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { leavesPresets } from "./LeavesDrawer3d.js";


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
        
        if (leaves.length === 0) {
            return;
        }

        const currentLeavesPreset = leavesPresets[tree.preset.leavesPreset];
        
        const formRatio = 1;
        // const formRatio = 2;
        const heliotropism = GlMatrix.fromValues(currentLeavesPreset.heliotropism[0], currentLeavesPreset.heliotropism[1]);

        const leavesSize = leaves.reduce((cum, leaf) => cum + leaf.energy, 0) * currentLeavesPreset.scale;

        const lightQuantity = Math.min(4, branch.budsLight);
        // const lightQuantity = branch.attractors.length;

        this.leafDrawer.draw(tree, branch.glEnd, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

export {TreeRender as default};