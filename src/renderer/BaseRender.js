import * as ImageLoader from '../ImageLoader.js';

let scale = 2000;
let worldScale = 1;
let outputCanvas = null;
let sceneWidth = 100;
let sceneHeight = 100;
let offsetX = 0;
let offsetY = 0;

export function setOutputCanvas(canvas) {
    outputCanvas = canvas;
    worldScale = outputCanvas.height / scale;
    sceneWidth = outputCanvas.width;
    sceneHeight = outputCanvas.height;
    offsetX = sceneWidth / 2;
    offsetY = sceneHeight;
}

export function changeScale(quantity) {
    scale += quantity;
    worldScale = outputCanvas.height / scale;
}

export function canvasToWorldPosition(canvasPosition) {
    return [
        canvasToWorldX(canvasPosition.x),
        canvasToWorldY(canvasPosition.y),
    ];
}

export function intCanvasToWorldPosition(canvasPositionX, canvasPositionY) {
    return [
        canvasToWorldX(canvasPositionX),
        canvasToWorldY(canvasPositionY),
    ];
}

function worldToCanvasWidth(worldWidth) {
    return worldScale * worldWidth;
}

function worldToCanvasPosition(worldPosition) {
    return [
        worldToCanvasX(worldPosition.x),
        worldToCanvasY(worldPosition.y),
    ];
}

function glWorldToCanvasPosition(worldPosition) {
    return [
        worldToCanvasX(worldPosition[0]),
        worldToCanvasY(worldPosition[1]),
    ];
}

function worldToCanvasX(worldX) {
    return (worldX * worldScale) + offsetX;
}

function worldToCanvasY(worldY) {
    return offsetY - (worldY * worldScale);
}

function canvasToWorldX(canvasX) {
    return (canvasX - offsetX) / worldScale;
}

function canvasToWorldY(canvasY) {
    return (offsetY - canvasY) / worldScale;
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
            -(((image.width * imageScale) * worldScale) / 2), 0,
            (image.width * imageScale) * worldScale, (image.height * imageScale) * worldScale
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

    drawPolygon(points, color) {
        const start = points.shift();
        const startPosition = worldToCanvasPosition(start);

        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(startPosition[0], startPosition[1]);
        for (let i = 0; i < points.length; i ++) {
            const position = worldToCanvasPosition(points[i]);
            this.context.lineTo(position[0], position[1]);
        }
        this.context.fill();
    }

    drawLine(worldStart, worldEnd, worldWidth, color) {
        const start = worldToCanvasPosition(worldStart);
        const end = worldToCanvasPosition(worldEnd);

        this.context.beginPath();
        this.context.lineCap = 'round';
        this.context.strokeStyle = color;
        this.context.lineWidth  = worldToCanvasWidth(worldWidth);
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    glDrawLine(worldStart, worldEnd, worldWidth, color) {
        const start = glWorldToCanvasPosition(worldStart);
        const end = glWorldToCanvasPosition(worldEnd);

        this.context.beginPath();
        this.context.lineCap = 'round';
        this.context.strokeStyle = color;
        this.context.lineWidth  = worldToCanvasWidth(worldWidth);
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    drawCircle(worldPosition, radius, color) {
        const position = worldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(position[0], position[1], radius * worldScale, 0, 6.28);
        this.context.fill();
    }

    glDrawCircle(worldPosition, radius, color) {
        const position = glWorldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(position[0], position[1], radius * worldScale, 0, 6.28);
        this.context.fill();
    }

    drawEmptyCircle(worldPosition, radius, color) {
        const position = worldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth = 1;
        this.context.arc(position[0], position[1], radius * worldScale, 0, 6.28);
        this.context.stroke();
    }

    glDrawEmptyCircle(worldPosition, radius, color) {
        const position = glWorldToCanvasPosition(worldPosition);
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth = 1;
        this.context.arc(position[0], position[1], radius * worldScale, 0, 6.28);
        this.context.stroke();
    }
}