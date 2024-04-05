const eps = 0.0000001;

export function random(min, max) {
    const length = max - min;
    return min + (Math.random() * length);
}

export function randomize(value, radius) {
    const amplitude = radius * 2;
    return value + (Math.random() * amplitude) - radius;
}

export function randomizeListValues(values, radius) {
    const length = values.length;
    const newValues = Array(length);
    for (let i = 0; i < length; i ++) {
        newValues[i] = randomize(values[i], radius);
    }
    return newValues;
}

export function randomElement(list) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
}

export function randomizeArray(array) {
    let currentIndex = array.length;
  
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}
  

export function lerpPoint(pointA, pointB, percent) {
    return [
        lerpFloat(pointA[0], pointB[0], percent),
        lerpFloat(pointA[1], pointB[1], percent),
    ]
}

export function lerpFloat(valueA, valueB, percent) {
    const distance = valueB - valueA;
    const value = valueA + (distance * percent);
    return value;
}

export function radians(_degres){
    return Math.PI * _degres / 180;
}

export function degrees(radian) {
    return radian * 180 / Math.PI;
}

export function pointsAngle(pointA, pointB) {
    return Math.atan2(pointB[1] - pointA[1], pointB[0] - pointA[0]);
}

export function rotatePoint(root, angleDegree, point) {
    const angleRadian = radians(angleDegree);
    
    const distance = distanceBetweenPoints(root, point);
    const curAngle = Math.atan2(point[1] - root[1], point[0] - root[0])
    const finalAngle = curAngle + angleRadian;
    return [
        root[0] + Math.cos(finalAngle) * distance,
        root[1] + Math.sin(finalAngle) * distance,
    ];
}

export function translatePoint(point, offset) {
    return [
        point[0] + offset[0],
        point[1] + offset[1],
    ]
}

export function scalePoint(root, point, scale) {
    const distanceX = point[0] - root[0];
    const distanceY = point[1] - root[1];
    return [
        root[0] + distanceX * scale,
        root[1] + distanceY * scale,
    ];
}

export function distanceBetweenPoints(pointA, pointB) {
    return Math.sqrt(Math.pow(pointB[0] - pointA[0], 2) + Math.pow(pointB[1] - pointA[1], 2))
}

export function normalise(point) {
    const length = distanceBetweenPoints([0, 0], point);
    return [
        point[0] / length,
        point[1] / length,
    ]
}

export function sigmoid(t) {
    return 1 / (1 + Math.pow(Math.E, -t));
}

export function softPlus(value) {
    return Math.log(1 + Math.exp(value));
};

export function segmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    const y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    if (isNaN(x) || isNaN(y)) {
        // console.warn('segmentIntersection NaN :', x1, y1, x2, y2, x3, y3, x4, y4);
        return null;
    }
	if (x1 >= x2) {
		if (!between(x2, x, x1)) return null;
	} else {
		if (!between(x1, x, x2)) return null;
	}
	if (y1 >= y2) {
		if (!between(y2, y, y1)) return null;
	} else {
		if (!between(y1, y, y2)) return null;
	}
	if (x3 >= x4) {
		if (!between(x4, x, x3)) return null;
	} else {
		if (!between(x3, x, x4)) return null;
	}
	if (y3 >= y4) {
		if (!between(y4, y, y3)) return null;
	} else {
		if (!between(y3, y, y4)) return null;
	}
    return [x, y];
}

function between(a, b, c) {
    return a - eps <= b && b <= c + eps;
}