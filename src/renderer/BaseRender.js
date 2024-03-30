import * as ImageLoader from '../ImageLoader.js';

let scale = 2000;
let worldScale = 1;

class BaseRender {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.sceneWidth = 0;
        this.sceneHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    init(canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.context = this.canvas.getContext('2d');
        this.sceneWidth = this.canvas.width;
        this.sceneHeight = this.canvas.height;
        worldScale = this.sceneHeight / scale;
        this.offsetX = this.sceneWidth / 2;
        this.offsetY = this.sceneHeight;

        this.clear();
    }

    changeScale(quantity) {
        scale += quantity;
        worldScale = this.sceneHeight / scale;
    }

    draw(context) {
        context.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, this.sceneWidth, this.sceneHeight,
        )
    }

    clear() {
        this.context.clearRect(0, 0, this.sceneWidth, this.sceneHeight);
    }

    drawImage(imageId, worldPosition, angle, imageScale) {
        const image = ImageLoader.get(imageId);
        const canvasPosition = this.worldToCanvasPosition(worldPosition);

        this.context.save(); 
        this.context.translate(canvasPosition[0], canvasPosition[1]);
        this.context.rotate(angle);
        this.context.drawImage(
            image,
            -(((image.width * imageScale) * worldScale) / 2), 0,
            (image.width * imageScale) * worldScale, (image.height * imageScale) * worldScale
        );
        this.context.restore(); 
    }

    drawPolygon(points, color) {
        const start = points.shift();
        const startPosition = this.worldToCanvasPosition(start);

        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(startPosition[0], startPosition[1]);
        for (let i = 0; i < points.length; i ++) {
            const position = this.worldToCanvasPosition(points[i]);
            this.context.lineTo(position[0], position[1]);
        }
        this.context.fill();
    }

    drawLine(worldStart, worldEnd, worldWidth, color) {
        const start = this.worldToCanvasPosition(worldStart);
        const end = this.worldToCanvasPosition(worldEnd);

        this.context.beginPath();
        this.context.lineCap = 'round';
        this.context.strokeStyle = color;
        this.context.lineWidth  = this.worldToCanvasWidth(worldWidth);
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    drawCircle(worldPosition, radius, color) {
        const position = this.worldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(position[0], position[1], radius * worldScale, 0, 6.28);
        this.context.fill();
    }

    drawEmptyCircle(worldPosition, radius, color) {
        const position = this.worldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth = 1;
        this.context.arc(position[0], position[1], radius * worldScale, 0, 6.28);
        this.context.stroke();
    }

    worldToCanvasWidth(worldWidth) {
        return worldScale * worldWidth;
    }

    worldToCanvasPosition(worldPosition) {
        return [
            this.worldToCanvasX(worldPosition.x),
            this.worldToCanvasY(worldPosition.y),
        ];
    }

    worldToCanvasX(worldX) {
        return (worldX * worldScale) + this.offsetX;
    }

    worldToCanvasY(worldY) {
        return this.offsetY - (worldY * worldScale);
    }

    canvasToWorldPosition(canvasPosition) {
        return [
            this.canvasToWorldX(canvasPosition.x),
            this.canvasToWorldY(canvasPosition.y),
        ];
    }

    canvasToWorldX(canvasX) {
        return (canvasX - this.offsetX) / worldScale;
    }

    canvasToWorldY(canvasY) {
        return (this.offsetY - canvasY) / worldScale;
    }
}

export {BaseRender as default};