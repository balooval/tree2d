import * as ImageLoader from '../ImageLoader.js';

let viewWidth = 2000;
let viewScale = 1;
let outputCanvas = null;
let sceneWidth = 100;
let sceneHeight = 100;
let offsetX = 0;
let offsetY = 0;
const cameraOffset = [0, 0];

export function setOutputCanvas(canvas) {
    outputCanvas = canvas;
    sceneWidth = outputCanvas.width;
    sceneHeight = outputCanvas.height;
    viewScale = sceneWidth / viewWidth;
    offsetX = sceneWidth / 2;
    offsetY = sceneHeight;
}

export function getViewScale() {
    return viewScale;
}

export function getWorldWidth() {
    return viewWidth;
}

export function addOffset(x, y) {
    cameraOffset[0] += x;
	cameraOffset[1] += y;

    offsetX = sceneWidth / 2 + (cameraOffset[0]);
    offsetY = sceneHeight + (cameraOffset[1]);
}

export function changeScale(quantity) {
    viewWidth += quantity;
    viewScale = sceneWidth / viewWidth;
}

export function canvasToWorldPosition(canvasPosition) {
    return [
        canvasToWorldX(canvasPosition.x),
        canvasToWorldY(canvasPosition.y),
    ];
}

export function glCanvasToWorldPosition(canvasPosition) {
    return [
        canvasToWorldX(canvasPosition[0]),
        canvasToWorldY(canvasPosition[1]),
    ];
}

export function intCanvasToWorldPosition(canvasPositionX, canvasPositionY) {
    return [
        canvasToWorldX(canvasPositionX),
        canvasToWorldY(canvasPositionY),
    ];
}

function worldToCanvasWidth(worldWidth) {
    return viewScale * worldWidth;
}

function worldToCanvasPosition(worldPosition) {
    return [
        worldToCanvasX(worldPosition.x),
        worldToCanvasY(worldPosition.y),
    ];
}

export function glWorldToCanvasPosition(worldPosition) {
    return [
        worldToCanvasX(worldPosition[0]),
        worldToCanvasY(worldPosition[1]),
    ];
}

function worldToCanvasX(worldX) {
    return (worldX * viewScale) + offsetX;
}

function worldToCanvasY(worldY) {
    return offsetY - (worldY * viewScale);
}

function canvasToWorldX(canvasX) {
    return (canvasX - offsetX) / viewScale;
}

function canvasToWorldY(canvasY) {
    return (offsetY - canvasY) / viewScale;
}

export class BaseRender {
    constructor() {
        this.canvas = null;
        this.context = null;
    }
    
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = outputCanvas.width;
        this.canvas.height = outputCanvas.height;
        this.context = this.canvas.getContext('2d');

        this.clear();
    }

    drawIntoContext(context) {
        context.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, sceneWidth, sceneHeight,
        )
    }

    clear() {
        this.context.clearRect(0, 0, sceneWidth, sceneHeight);
    }

    drawImage(imageId, worldPosition, angle, imageScale) {
        const image = ImageLoader.get(imageId);
        const canvasPosition = worldToCanvasPosition(worldPosition);

        this.context.save(); 
        this.context.translate(canvasPosition[0], canvasPosition[1]);
        this.context.rotate(angle);
        this.context.drawImage(
            image,
            -(((image.width * imageScale) * viewScale) / 2), 0,
            (image.width * imageScale) * viewScale, (image.height * imageScale) * viewScale
        );
        this.context.restore(); 
    }

    glDrawPolygon(points, color) {
        const start = points.shift();
        const startPosition = glWorldToCanvasPosition(start);

        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(startPosition[0], startPosition[1]);
        for (let i = 0; i < points.length; i ++) {
            const position = glWorldToCanvasPosition(points[i]);
            this.context.lineTo(position[0], position[1]);
        }
        this.context.fill();
    }

    glDrawLine(worldStart, worldEnd, worldWidth, color) {
        const start = glWorldToCanvasPosition(worldStart);
        const end = glWorldToCanvasPosition(worldEnd);

        this.context.beginPath();
        // this.context.lineCap = 'round';
        this.context.lineCap = 'butt';
        this.context.strokeStyle = color;
        this.context.lineWidth  = worldToCanvasWidth(worldWidth);
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    glDrawCircle(worldPosition, radius, color) {
        const position = glWorldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(position[0], position[1], radius * viewScale, 0, 6.28);
        this.context.fill();
    }

    glDrawEmptyCircle(worldPosition, radius, color) {
        const position = glWorldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth = 1;
        this.context.arc(position[0], position[1], radius * viewScale, 0, 6.28);
        this.context.stroke();
    }
}