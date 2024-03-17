import Render from './Render.js'

class TreeRender {
    constructor(render) {
        this.render = render;
    }

    draw(tree) {
        tree.getBranchs().forEach(branch => this.#drawBranch(branch))
    }

    #drawBranch(branch) {
        Render.drawLine(branch.start, branch.end, branch.getWidth(), 'rgb(250, ' + branch.receivedLight + ', 50)');
    }
}

const treeRender = new TreeRender(Render);

export {treeRender as default};