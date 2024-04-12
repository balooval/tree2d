import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { LeafDrawer3d, leavesPresets } from "./LeavesDrawer3d.js";


class TreeRender {
    constructor(render, lightSource, trunkRender, backgroundGrass) {
        this.render = render;
        this.backgroundGrass = backgroundGrass;
        this.lightSource = lightSource;
        this.viewLeaves = true;
        this.trunkRender = trunkRender;
        this.leafDrawers = new Map();
    }

    setViewLeaves(state) {
        this.viewLeaves = state;
    }

    update(tree) {
        this.backgroundGrass.update();

        const leafDrawer = this.leafDrawers.get(tree);
        if (!leafDrawer) {
            return;
        }
        leafDrawer.update();
    }

    draw(tree) {
        this.trunkRender.draw(tree);

        if (this.leafDrawers.has(tree) === false) {
            const leafDrawer = new LeafDrawer3d(this.lightSource, leavesPresets[tree.preset.leavesPreset]);
            this.leafDrawers.set(tree, leafDrawer);
        }

        const leafDrawer = this.leafDrawers.get(tree);
        
        leafDrawer.setLowQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(leafDrawer, tree, branch);
        });
        leafDrawer.endDraw();
    }

    drawHighQualityLeaves(tree) {
        const leafDrawer = this.leafDrawers.get(tree);

        leafDrawer.setFullQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(leafDrawer, tree, branch);
        });
        leafDrawer.endDraw();
    }

    #drawLeaves(leafDrawer, tree, branch) {

        if (this.viewLeaves === false) {
            return;
        }

        const leaves = branch.getLeaves();
        
        if (leaves.length === 0) {
            return;
        }

        const currentLeavesPreset = leavesPresets[tree.preset.leavesPreset];

        leafDrawer.setPreset(currentLeavesPreset);
        
        const formRatio = 1;
        // const formRatio = 2;
        const heliotropism = GlMatrix.fromValues(currentLeavesPreset.heliotropism[0], currentLeavesPreset.heliotropism[1]);

        const leavesSize = leaves.reduce((cum, leaf) => cum + leaf.energy, 0) * currentLeavesPreset.scale;

        const lightQuantity = Math.min(4, branch.budsLight);
        // const lightQuantity = branch.attractors.length;

        leafDrawer.draw(tree, branch.glEnd, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

export {TreeRender as default};