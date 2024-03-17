import { randomize, randomElement } from "../Math.js";
import {presets} from '../Tree.js';

class TreeRender {
    constructor(render) {
        this.render = render;
    }

    draw(tree) {
        tree.getBranchs().forEach(branch => {
            this.#drawBranch(branch);
            this.#drawLeaves(branch);
        });
    }

    #drawBranch(branch) {
        this.render.drawLine(branch.start, branch.end, branch.getWidth(), branch.trunkColor);
    }

    #drawLeaves(branch) {
        const count = branch.attractors.length * branch.preset.leaveCountMultiplier;

        for (let i = 0; i < count; i ++) {
            const leavePosition = branch.end.clone();
            leavePosition.x = randomize(leavePosition.x, 20);
            leavePosition.y = randomize(leavePosition.y, 20);
            this.render.drawCircle(leavePosition, presets[branch.presetType].leaveSize, randomElement(branch.preset.leaveColors))
        }
    }
}

export {TreeRender as default};