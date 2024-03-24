import Render from './renderer/Render.js'
import * as UiMouse from './UiMouse.js';
import RBushKnn from '../vendor/rbush-knn.js';
import BaseRender from './renderer/BaseRender.js';

class UiCut {
    constructor() {
        this.render = new BaseRender();
        this.canvasId = null;
        this.active = false;
        this.rbushBranchs = null;
        this.maxSearchDistance = 50;
        this.targetBranch = null;
        this.cutCallback = null;
    }
    
    init(canvas, cutCallback) {
        this.render.init(canvas);
        this.cutCallback = cutCallback;
        this.mainContext = canvas.getContext('2d');
        this.canvasId = canvas.id;
        this.rbushBranchs = null;
        document.getElementById(this.canvasId).addEventListener('mousemove', () => this.onMouseMove());
        document.getElementById(this.canvasId).addEventListener('click', () => this.onClick());
    }

    start() {
        this.active = true;
        this.onFrame();
    }
    
    stop() {
        this.active = false;
        this.targetBranch = null;
    }

    onClick() {
        if (this.targetBranch !== null) {
            this.targetBranch.remove();
            this.cutCallback();
            this.targetBranch = null;
        }
    }

    onMouseMove() {
        if (this.active === false) {
            return;
        }
        const worldPosition = Render.canvasToWorldPosition({x:UiMouse.mousePosition[0], y:UiMouse.mousePosition[1]});
        const nearBranch = RBushKnn(this.rbushBranchs, worldPosition[0], worldPosition[1], 1, undefined, this.maxSearchDistance);

        if (nearBranch.length === 0) {
            this.targetBranch = null;
            return;
        }

        this.targetBranch = nearBranch.pop().branch;
    }
    
    draw() {
        if (this.targetBranch !== null) {
            this.render.drawLine(this.targetBranch.start, this.targetBranch.end, this.targetBranch.getWidth(), `rgb(255, 0, 0)`);
        }

        this.render.draw(this.mainContext);
        this.render.clear();
    }

    setBranches(rbushBranchs) {
        this.rbushBranchs = rbushBranchs;
    }

    onFrame() {
        if (this.active === false) {
            return;
        }
        this.draw();
        requestAnimationFrame(() => this.onFrame());

    }
}

export default new UiCut();