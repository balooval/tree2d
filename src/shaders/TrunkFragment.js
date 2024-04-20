import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
uniform float trunkNoiseSmall;
uniform float trunkNoiseMid;
uniform float trunkNoiseBig;
uniform sampler2D shadowTexture;
varying vec4 vPos;
varying vec2 noiseUv;
varying vec2 vUv;
varying vec3 vColor;
varying vec3 vNormal;
varying float lightValue;

${PerlinNoise}

${Colors}

float getNoiseValue(vec2 uv) {
    vec2 noiseUvFrag = vec2(uv.x, uv.y);
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
    // vec3 norms = vec3((vNormal.x + 1.0) / 2.0, (vNormal.y + 1.0) / 2.0, (vNormal.z + 1.0) / 2.0);
    // gl_FragColor = vec4(norms, 1.0);
    // gl_FragColor = vec4((lightValue + 1.0) / 2.0, (lightValue + 1.0) / 2.0, (lightValue + 1.0) / 2.0, 1.0);

    vec3 hsl = rgb2hsl(vColor);

    float noise = getNoiseValue(noiseUv);
    hsl.z *= noise;
    
    float shadow = getShadowValue(vPos.xy);
    hsl.z *= (lightValue + 0.3);
    hsl.z *= shadow;

    vec3 rgb = hsl2rgb(hsl);

    rgb.z += (1.0 - shadow) * 0.1;

    gl_FragColor = vec4(rgb.xyz, 1.0);
}`;
