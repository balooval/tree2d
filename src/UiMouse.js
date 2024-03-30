

export const mousePosition = [0, 0];

export function init(elementId) {
    document.getElementById(elementId).addEventListener('mousemove', onMouseMove);
}

function onMouseMove(evt) {
    var rect = evt.target.getBoundingClientRect();
    mousePosition[0] = evt.clientX - rect.left;
    mousePosition[1] = evt.clientY - rect.top;
}