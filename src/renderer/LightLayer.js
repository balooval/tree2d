import Render from './Render.js'

class LightLayer {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.sceneWidth = 0;
        this.sceneHeight = 0;
        this.worldScale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    init(canvasId) {
        const scale = 0.2;
        const canvas = document.getElementById(canvasId);
        this.canvas = document.createElement('canvas');
        this.canvas.width = Math.round(canvas.width * scale);
        this.canvas.height = Math.round(canvas.height * scale);
        this.context = this.canvas.getContext('2d');

        this.sceneWidth = this.canvas.width;
        this.sceneHeight = this.canvas.height;
        this.worldScale = this.sceneHeight / 2000;
        this.offsetX = this.sceneWidth / 2;
        this.offsetY = this.sceneHeight;
        this.clear();
    }

    draw() {
        Render.context.globalCompositeOperation = "lighter";
        Render.context.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, Render.sceneWidth, Render.sceneHeight,
        )
        Render.context.globalCompositeOperation = "source-over";
    }

    drawRay(light, ray) {
        this.drawLine(ray.start, ray.end, light.width, `rgb(255, 255, 255, ${ray.factor * 0.3})`);
    }

    clear() {
        this.context.clearRect(0, 0, this.sceneWidth, this.sceneHeight);
    }

    drawLine(worldStart, worldEnd, worldWidth, color) {
        const start = this.worldToCanvasPosition(worldStart);
        const end = this.worldToCanvasPosition(worldEnd);

        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth  = this.worldToCanvasWidth(worldWidth);
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    worldToCanvasWidth(worldWidth) {
        return this.worldScale * worldWidth;
    }

    worldToCanvasPosition(worldPosition) {
        return [
            this.worldToCanvasX(worldPosition.x),
            this.worldToCanvasY(worldPosition.y),
        ];
    }

    worldToCanvasX(worldX) {
        return (worldX * this.worldScale) + this.offsetX;
    }

    worldToCanvasY(worldY) {
        return this.offsetY - (worldY * this.worldScale);
    }
}

const lightLayer = new LightLayer();

export {lightLayer as default};