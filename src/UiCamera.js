import { mousePosition } from './UiMouse.js';

class UiCamera {
    constructor() {
        this.callback = null;
        this.active = false;
        this.lastPosition = [0, 0];
        this.translation = [0, 0];
        this.rightButton = 2;
    }
    
    init(canvasId, callback) {
        this.callback = callback;
        const targetElement = document.getElementById(canvasId);
        targetElement.addEventListener('mousedown', (evt) => this.#onMouseDown(evt));
        targetElement.addEventListener('mouseup', (evt) => this.#onMouseUp(evt));
        targetElement.addEventListener('mousemove', () => this.#onMouseMove());
        targetElement.addEventListener("contextmenu", e => e.preventDefault());
    }

    #onMouseDown(evt) {
        if (evt.button !== this.rightButton) {
            return;
        }

        this.active = true;
    }
    
    #onMouseMove() {
        this.translation[0] = mousePosition[0] - this.lastPosition[0];
        this.translation[1] = mousePosition[1] - this.lastPosition[1];
        this.lastPosition = [...mousePosition];
        if (this.active === false) {
            return;
        }
        
        this.callback(this.translation[0], this.translation[1]);
    }
    
    #onMouseUp(evt) {
        if (evt.button !== this.rightButton) {
            return;
        }

        this.active = false;
    }
}

export default new UiCamera();