
export default `
vec2 rand2d(vec2 uv) {
    return fract(sin(vec2(dot(uv, vec2(12.34, 45.67)),
        dot(uv, vec2(78.9, 3.14)))) * 12345.67) * 2.0 - 1.0;
}

float perlin(vec2 uv) {
    vec2 u = floor(uv);
    vec2 f = fract(uv);
    vec2 s = smoothstep(0.0, 1.0, f);
	
    vec2 a = rand2d(u);
    vec2 b = rand2d(u + vec2(1.0, 0.0));
    vec2 c = rand2d(u + vec2(0.0, 1.0));
    vec2 d = rand2d(u + vec2(1.0, 1.0));
	
    return mix(mix(dot(a, -f), dot(b, vec2(1.0, 0.0) - f), s.x),
        mix(dot(c, vec2(0.0, 1.0) - f), dot(d, vec2(1.0, 1.0) - f), s.x), s.y);
}

float perlinNormalized(vec2 uv) {
    return (perlin(uv) + 1.0) / 2.0;
}
`;
