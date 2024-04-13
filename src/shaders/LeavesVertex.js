import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
uniform float time;
uniform float groundPosition;
uniform vec2 mousePosition;
uniform vec2 lightDirection;
uniform vec3 globalColor;
varying vec3 vFinalColor;
attribute vec3 instancePosition; 
attribute vec2 instanceOrientations; 
attribute float instanceDistance; 
attribute float instanceLightReceived; 

${PerlinNoise}

${Colors}

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

void main() {
    vec3 transformedNormal = normal;
    mat3 m = mat3(instanceMatrix);
    transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
    transformedNormal = m * transformedNormal;

    vec3 normalOrientation = normalize(transformedNormal);
    // vFinalColor = normalize(transformedNormal);
    // vFinalColor = normal;


    float instanceLightShade = (dot(lightDirection, vec2(normalOrientation.xy)) + 1.3) * 0.4;
    float originalLightShade = (dot(lightDirection, instanceOrientations) + 1.3) * 0.6;
    instanceLightShade *= originalLightShade;
    // float instanceLightShade = (dot(lightDirection, instanceOrientations) + 1.3) * 0.4;
    instanceLightShade += instanceDistance * (instanceLightReceived * 0.1);

    vec3 hsl = rgb2hsl(globalColor);
    hsl.z *= instanceLightShade;

    vec3 finalRgb = hsl2rgb(hsl);

    vFinalColor = finalRgb;
    
    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
    float noiseA = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.005, instancePosition.y * 0.05));
    float noiseB = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.05, instancePosition.y * 0.5));
    float noise = noiseA + (noiseB * 0.1);

    float noiseFactor = (instancePosition.y - groundPosition) * 0.001;
    worldPosition.x += (noise * noiseFactor) * 20.0;

    vec4 instancePosition = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 toto = vec2(instancePosition.xy - mousePosition);
    float angleWithMouse = atan(toto.y, toto.x);
    float mouseForce = 150.0 - clamp(distance(mousePosition, vec2(instancePosition.xy)), 1.0, 150.0);
    float mouseTranslationX = cos(angleWithMouse) * (mouseForce * 0.11);
    float mouseTranslationY = sin(angleWithMouse) * (mouseForce * 0.11);

    worldPosition.x += mouseTranslationX;
    worldPosition.y += mouseTranslationY;
    

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(worldPosition.xyz, 1.0);
}


`;
