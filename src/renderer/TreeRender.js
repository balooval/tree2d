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

        // this.render.drawCircle(tree.root.start, tree.root.energy, 'rgba(0, 255, 0, 0.2)');
    }

    #drawBranch(branch) {
        this.render.drawLine(branch.start, branch.end, branch.getWidth(), branch.trunkColor);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energy > 0 ? 255 : 0}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energy * 100}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.auxinQuantity * 25}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energyTransferedByCycle * 10}, 0)`);
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(0, ${(branch.length / presets[branch.presetType].newBranchLength) * 50}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, 0, 0)`);
    }

    #drawLeaves(branch) {

        if (branch.leavesHealth === 0) {
            return;
        }

        // const count = branch.attractors.length * branch.preset.leaveCountMultiplier;
        const count = 4;

        const preset = presets[branch.presetType];

        for (let i = 0; i < count; i ++) {
            const leavePosition = branch.end.clone();
            leavePosition.x = randomize(leavePosition.x, preset.leaveDispersion);
            leavePosition.y = randomize(leavePosition.y, preset.leaveDispersion);
            this.render.drawCircle(leavePosition, preset.leaveSize, branch.getLeaveColor())
        }
    }
}

export {TreeRender as default};