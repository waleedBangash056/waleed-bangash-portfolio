type Vec3 = readonly [number, number, number];
type Mesh = { position: WebGLBuffer; normal: WebGLBuffer; index: WebGLBuffer; count: number };

export type SceneController = {
  setProgress(progress: number): void;
  setPaused(paused: boolean): void;
  dispose(): void;
};

type SculpturalPart = {
  mesh: Mesh;
  local: Float32Array;
  color: Vec3;
  alpha: number;
  scale: Vec3;
  rotation: Vec3;
  position: Vec3;
};

const vertexSource = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uMvp;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vPosition;
void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = normalize(mat3(uModel) * aNormal);
  gl_Position = uMvp * vec4(aPosition, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vPosition;
uniform vec3 uColor;
uniform float uAlpha;
uniform float uTime;
out vec4 outColor;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vec3(0.15, 0.12, 5.0) - vPosition);
  vec3 keyLight = normalize(vec3(-0.65, 0.8, 1.0));
  vec3 rimLight = normalize(vec3(0.9, -0.4, 0.6));
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.25);
  float diffuse = max(dot(normal, keyLight), 0.0);
  float specular = pow(max(dot(reflect(-keyLight, normal), viewDir), 0.0), 42.0);
  float rim = pow(max(dot(normal, rimLight), 0.0), 3.0);
  float sweep = 0.5 + 0.5 * sin(uTime * 1.6 + vPosition.y * 2.4 + vPosition.x * 1.8);
  vec3 color = uColor * (0.24 + diffuse * 0.7);
  color += vec3(0.76, 0.9, 1.0) * (fresnel * 0.86 + specular * 0.85);
  color += vec3(0.9, 0.95, 0.62) * rim * (0.13 + sweep * 0.22);
  float alpha = clamp(uAlpha * (0.58 + fresnel * 0.66 + specular * 0.28), 0.0, 0.96);
  outColor = vec4(color, alpha);
}`;

function identity(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] = a[row] * b[column * 4]
        + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2]
        + a[12 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

function translation(x: number, y: number, z: number): Float32Array {
  const out = identity();
  out[12] = x; out[13] = y; out[14] = z;
  return out;
}

function scaling(x: number, y: number, z: number): Float32Array {
  const out = identity();
  out[0] = x; out[5] = y; out[10] = z;
  return out;
}

function rotationX(angle: number): Float32Array {
  const c = Math.cos(angle); const s = Math.sin(angle);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotationY(angle: number): Float32Array {
  const c = Math.cos(angle); const s = Math.sin(angle);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function rotationZ(angle: number): Float32Array {
  const c = Math.cos(angle); const s = Math.sin(angle);
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function modelMatrix(position: Vec3, rotation: Vec3, scale: Vec3): Float32Array {
  let matrix = translation(position[0], position[1], position[2]);
  matrix = multiply(matrix, rotationY(rotation[1]));
  matrix = multiply(matrix, rotationX(rotation[0]));
  matrix = multiply(matrix, rotationZ(rotation[2]));
  return multiply(matrix, scaling(scale[0], scale[1], scale[2]));
}

function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fov / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function colorFromHex(hex: string): Vec3 {
  const cleaned = hex.replace('#', '');
  return [0, 2, 4].map((start) => srgbChannelToLinear(parseInt(cleaned.slice(start, start + 2), 16))) as unknown as Vec3;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL could not allocate a shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const reason = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error';
    gl.deleteShader(shader);
    throw new Error(reason);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('WebGL could not allocate a program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const reason = gl.getProgramInfoLog(program) ?? 'Unknown shader link error';
    gl.deleteProgram(program);
    throw new Error(reason);
  }
  return program;
}

function makeTwistedRibbon(gl: WebGL2RenderingContext, turns = 1.32, width = 0.5, phase = 0, segments = 132, across = 14): Mesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = phase + t * Math.PI * 2 * turns + Math.sin(t * Math.PI * 2) * 0.11;
    const radius = 0.48 + 0.12 * Math.sin(t * Math.PI * 2 + phase);
    const y = -1.35 + t * 2.7;
    const dAngle = Math.PI * 2 * turns + Math.cos(t * Math.PI * 2) * 0.22;
    const dy = 2.7;
    const normalLength = Math.hypot(dy * Math.sin(angle), radius * dAngle, -dy * Math.cos(angle)) || 1;
    const nx = (dy * Math.sin(angle)) / normalLength;
    const ny = (radius * dAngle) / normalLength;
    const nz = (-dy * Math.cos(angle)) / normalLength;
    for (let j = 0; j <= across; j += 1) {
      const u = j / across - 0.5;
      const r = radius + u * width;
      const edgeLift = Math.sin(u * Math.PI) * 0.065;
      positions.push(r * Math.cos(angle), y + edgeLift, r * Math.sin(angle));
      normals.push(nx, ny, nz);
      if (i < segments && j < across) {
        const a = i * (across + 1) + j;
        const b = a + across + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return uploadMesh(gl, positions, normals, indices);
}

function makeFacetedCrystal(gl: WebGL2RenderingContext, segments = 10): Mesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const levels: Array<[number, number]> = [
    [-1.45, 0.015], [-1.08, 0.31], [-0.48, 0.43], [0.28, 0.38], [0.93, 0.25], [1.35, 0.08], [1.48, 0.008],
  ];
  for (let row = 0; row < levels.length; row += 1) {
    const [y, radius] = levels[row];
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2 + 0.18;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const slope = row === 0 ? 0.55 : row === levels.length - 1 ? -0.65 : 0.10 * Math.sin(angle * 3);
      const nLength = Math.hypot(Math.cos(angle), slope, Math.sin(angle)) || 1;
      positions.push(x, y, z);
      normals.push(Math.cos(angle) / nLength, slope / nLength, Math.sin(angle) / nLength);
      if (row < levels.length - 1 && i < segments) {
        const a = row * (segments + 1) + i;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return uploadMesh(gl, positions, normals, indices);
}

function uploadMesh(gl: WebGL2RenderingContext, positions: number[], normals: number[], indices: number[]): Mesh {
  const position = gl.createBuffer(); const normal = gl.createBuffer(); const index = gl.createBuffer();
  if (!position || !normal || !index) throw new Error('WebGL could not allocate sculpture geometry.');
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return { position, normal, index, count: indices.length };
}

function createPart(gl: WebGL2RenderingContext, mesh: Mesh, color: string, alpha: number, scale: Vec3, rotation: Vec3, position: Vec3 = [0, 0, 0]): SculpturalPart {
  return { mesh, local: identity(), color: colorFromHex(color), alpha, scale, rotation, position };
}

function smoothstep(a: number, b: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function createScene(canvas: HTMLCanvasElement): SceneController {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, depth: true, premultipliedAlpha: false, powerPreference: 'low-power' });
  const stage = document.getElementById('scene-stage');
  if (!gl || !stage) throw new Error('WebGL 2 is unavailable; using the CSS sculpture.');

  let program: WebGLProgram;
  const resources: Mesh[] = [];
  try {
    program = createProgram(gl);
    resources.push(makeTwistedRibbon(gl, 1.30, 0.48, -0.15), makeFacetedCrystal(gl), makeTwistedRibbon(gl, 0.94, 0.20, 1.8, 112, 10));
  } catch (error) {
    stage.dataset.live = 'false';
    throw error;
  }

  const parts: SculpturalPart[] = [
    createPart(gl, resources[0], '#3a9da5', 0.78, [1.0, 1.0, 0.92], [0.16, -0.22, -0.10]),
    createPart(gl, resources[1], '#d9e9e4', 0.98, [0.82, 0.94, 0.82], [0.07, 0.16, 0.0], [0.0, 0.02, 0.02]),
    createPart(gl, resources[2], '#e5a36f', 0.58, [1.12, 0.94, 0.9], [-0.11, 0.2, 0.48], [0.04, 0.02, -0.06]),
  ];

  const locations = {
    position: gl.getAttribLocation(program, 'aPosition'),
    normal: gl.getAttribLocation(program, 'aNormal'),
    mvp: gl.getUniformLocation(program, 'uMvp'),
    model: gl.getUniformLocation(program, 'uModel'),
    color: gl.getUniformLocation(program, 'uColor'),
    alpha: gl.getUniformLocation(program, 'uAlpha'),
    time: gl.getUniformLocation(program, 'uTime'),
  };
  let pageProgress = 0;
  let paused = false;
  let rafId = 0;
  let introStart = performance.now();
  let disposed = false;
  let live = false;
  let resizeObserver: ResizeObserver | null = null;
  const startTime = performance.now();

  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.55)));
    const height = Math.max(1, Math.round(canvas.clientHeight * Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.55)));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    requestRender();
  };

  const draw = (now: number) => {
    if (disposed || gl.isContextLost()) return;
    const elapsed = (now - startTime) / 1000;
    const introRaw = paused ? 1 : Math.min(1, Math.max(0, (now - introStart) / 1150));
    const intro = smoothstep(0, 1, introRaw);
    const p = pageProgress;
    const stops = [
      { at: 0, x: 1.02, y: 0.08, z: 0, s: 1.0 },
      { at: 0.18, x: 1.17, y: 0.03, z: -0.18, s: 0.89 },
      { at: 0.35, x: -1.05, y: -0.18, z: -0.65, s: 0.66 },
      { at: 0.53, x: 0.63, y: 0.13, z: -0.72, s: 0.57 },
      { at: 0.71, x: 0.98, y: -0.09, z: -0.42, s: 0.64 },
      { at: 0.88, x: -1.16, y: 0.06, z: -0.65, s: 0.53 },
      { at: 1, x: -0.43, y: -0.08, z: -0.2, s: 0.58 },
    ];
    let left = stops[0]; let right = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i += 1) {
      if (p >= stops[i].at && p <= stops[i + 1].at) { left = stops[i]; right = stops[i + 1]; break; }
    }
    const stopProgress = (p - left.at) / Math.max(0.001, right.at - left.at);
    const x = left.x + (right.x - left.x) * stopProgress;
    const y = left.y + (right.y - left.y) * stopProgress;
    const z = left.z + (right.z - left.z) * stopProgress;
    const scale = (left.s + (right.s - left.s) * stopProgress) * (0.34 + intro * 0.66);
    const scrollSpin = p * Math.PI * 0.72;
    const tilt = Math.sin(p * Math.PI * 2) * 0.085;
    const cameraX = Math.sin(p * Math.PI * 2.0) * 0.12;
    const view = translation(-cameraX, 0, -5.05);
    const fov = window.innerWidth < 700 ? Math.PI / 3.25 : Math.PI / 4.05;
    const projection = perspective(fov, canvas.width / Math.max(1, canvas.height), 0.1, 30);
    const rootMatrix = multiply(translation(x, y, z), rotationY(scrollSpin + tilt));
    const worldScale = scaling(scale, scale, scale);
    const world = multiply(rootMatrix, worldScale);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(program);
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      const local = modelMatrix(part.position, [part.rotation[0] + elapsed * 0.035, part.rotation[1] - scrollSpin * 0.24, part.rotation[2] + p * (index % 2 ? -0.11 : 0.08)], part.scale);
      const model = multiply(world, local);
      const mvp = multiply(projection, multiply(view, model));
      gl.bindBuffer(gl.ARRAY_BUFFER, part.mesh.position);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, part.mesh.normal);
      gl.enableVertexAttribArray(locations.normal);
      gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.mesh.index);
      gl.uniformMatrix4fv(locations.mvp, false, mvp);
      gl.uniformMatrix4fv(locations.model, false, model);
      gl.uniform3fv(locations.color, part.color);
      gl.uniform1f(locations.alpha, part.alpha * (0.68 + 0.32 * intro));
      gl.uniform1f(locations.time, elapsed + p * 2.0);
      gl.drawElements(gl.TRIANGLES, part.mesh.count, gl.UNSIGNED_SHORT, 0);
    }
    gl.depthMask(true);
    if (!live) { stage.dataset.live = 'true'; live = true; }
  };

  function frame(now: number) {
    rafId = 0;
    if (disposed || document.hidden) return;
    draw(now);
    if (!paused && now - introStart < 1160) rafId = requestAnimationFrame(frame);
  }

  function requestRender() {
    if (disposed || document.hidden || rafId) return;
    rafId = requestAnimationFrame(frame);
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    stage.dataset.live = 'false';
    live = false;
  };
  const onVisibility = () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    } else requestRender();
  };
  canvas.addEventListener('webglcontextlost', onContextLost, false);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', resize, { passive: true });
  if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas); }
  resize();
  requestRender();

  return {
    setProgress(progress: number) {
      pageProgress = Math.max(0, Math.min(1, progress));
      requestRender();
    },
    setPaused(value: boolean) {
      paused = value;
      if (paused && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      else if (!paused) introStart = performance.now();
      requestRender();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      for (const mesh of resources) {
        gl.deleteBuffer(mesh.position); gl.deleteBuffer(mesh.normal); gl.deleteBuffer(mesh.index);
      }
      gl.deleteProgram(program);
      stage.dataset.live = 'false';
    },
  };
}
