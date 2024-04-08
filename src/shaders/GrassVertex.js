import PerlinNoise from './PerlinNoise.js';

export default `
uniform float time;
uniform vec2 mousePosition;
varying vec3 vUv;
varying vec3 vInstanceColor;
varying float distanceFromGround;
attribute vec3 instancePosition; 

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

${PerlinNoise}

void main() {
    vUv = position; 
    vInstanceColor = instanceColor; 
    distanceFromGround = position.y;

    vec4 mvPosition = vec4(position, 1.0);

    float noiseAngle = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.005, instancePosition.y * 0.05));

    vec4 instancePosition = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float distanceLimite = 200.0;
    vec2 toto = vec2(instancePosition.xy - mousePosition);
    float distanceFromMouse = distance(mousePosition, vec2(instancePosition.xy));
    float mouseForce = (distanceLimite - clamp(distanceFromMouse, 0.0, distanceLimite)) / distanceLimite;
    float angleWithMouse = atan(toto.x, toto.y) * -1.0;
    angleWithMouse *= mouseForce;
    float finalAngle = noiseAngle + angleWithMouse;

    mvPosition.xy = rotate(mvPosition.xy, finalAngle, vec2(0.0, 0.0));

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(mvPosition.xyz, 1.0);
}


`;
