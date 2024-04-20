import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
uniform vec3 lightDirection;
uniform float trunkNoiseSmall;
uniform float trunkNoiseMid;
uniform float trunkNoiseBig;
uniform sampler2D shadowTexture;
varying vec4 vPos;
varying vec2 noiseUv;
varying vec2 vUv;
varying vec3 vColor;
varying vec3 vNormal;
// varying float vLightValue;

${PerlinNoise}

${Colors}

float getNoiseNormal(vec2 uv) {
    vec2 noiseUvFrag = vec2(uv.x * 10.0, uv.y * 0.2);
    // vec2 noiseUvFrag = vec2(uv.x, uv.y);

    float noiseA = perlin(noiseUvFrag * trunkNoiseSmall);
    float noiseB = smoothstep(0.4, 0.5, perlin(noiseUvFrag * trunkNoiseMid));
    float noiseC = perlin(noiseUvFrag * trunkNoiseBig);

    float noise = noiseA;
    noise *= noiseB;
    noise += noiseC;

    return noise;
}

float getNoiseValue(vec2 uv) {
    vec2 noiseUvFrag = vec2(uv.x * 1.0, uv.y * 1.0);
    // vec2 noiseUvFrag = vec2(uv.x, uv.y);

    float noiseA = perlinNormalized(noiseUvFrag * trunkNoiseSmall);
    float noiseB = smoothstep(0.4, 0.5, perlinNormalized(noiseUvFrag * trunkNoiseMid));
    float noiseC = perlinNormalized(noiseUvFrag * trunkNoiseBig);

    float noise = noiseA;
    noise *= noiseB;
    noise += noiseC;

    return noise;
}

float getShadowValue(vec2 pos) {
    vec4 shadowColor = texture2D(shadowTexture, vUv);
    return shadowColor.z;
}

void main() {
    vec3 hsl = vec3(vColor.x, vColor.y, vColor.z);

    float noiseNormal = getNoiseNormal(noiseUv);
    vec3 localNormal = normalize(vec3(vNormal.x + noiseNormal, vNormal.y, 1.0));
    float lightValue = dot(lightDirection, localNormal);
    hsl.z *= (lightValue + 0.0);
    
    float shadow = getShadowValue(vPos.xy);
    hsl.z *= shadow;

    float noiseColor = getNoiseValue(noiseUv);
    hsl.z *= (noiseColor + 0.2);

    vec3 rgb = hsl2rgb(hsl);

    gl_FragColor = vec4(rgb, 1.0);
}`;
