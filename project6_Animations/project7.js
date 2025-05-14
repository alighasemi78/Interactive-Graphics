// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(
    translationX,
    translationY,
    translationZ,
    rotationX,
    rotationY
) {
    let cosX = Math.cos(rotationX),
        sinX = Math.sin(rotationX);
    let cosY = Math.cos(rotationY),
        sinY = Math.sin(rotationY);

    let rotX = [1, 0, 0, 0, 0, cosX, sinX, 0, 0, -sinX, cosX, 0, 0, 0, 0, 1];

    let rotY = [cosY, 0, -sinY, 0, 0, 1, 0, 0, sinY, 0, cosY, 0, 0, 0, 0, 1];

    let trans = [
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        translationX,
        translationY,
        translationZ,
        1,
    ];

    return MatrixMult(trans, MatrixMult(rotX, rotY));
}

class MeshDrawer {
    // The constructor is a good place for taking care of the necessary initializations.
    constructor() {
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        const vertexSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;

        uniform mat4 uMVP;
        uniform mat4 uMV;
        uniform mat3 uNormal;
        uniform bool uSwap;

        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vec3 pos = aPosition;
            vec3 norm = aNormal;
            if (uSwap) {
                pos = vec3(pos.x, pos.z, pos.y);
                norm = vec3(norm.x, norm.z, norm.y);
            }
            vec4 mvPos = uMV * vec4(pos, 1.0);
            vPosition = mvPos.xyz;
            vNormal = normalize(uNormal * norm);
            vTexCoord = aTexCoord;
            gl_Position = uMVP * vec4(pos, 1.0);
        }`;

        const fragmentSource = `
        precision mediump float;

        uniform sampler2D tex;
        uniform bool uShowTex;
        uniform vec3 uLightDir;
        uniform float uShininess;

        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vec3 N = normalize(vNormal);
            vec3 L = normalize(uLightDir);
            vec3 V = normalize(-vPosition);
            vec3 H = normalize(L + V);

            float diff = max(dot(N, L), 0.0);
            float spec = pow(max(dot(N, H), 0.0), uShininess);

            vec3 Kd = uShowTex ? texture2D(tex, vTexCoord).rgb : vec3(1.0);
            vec3 Ks = vec3(1.0);

            vec3 color = Kd * diff + Ks * spec;
            gl_FragColor = vec4(color, 1.0);
        }`;

        this.prog = InitShaderProgram(vertexSource, fragmentSource);

        this.aPosition = gl.getAttribLocation(this.prog, "aPosition");
        this.aTexCoord = gl.getAttribLocation(this.prog, "aTexCoord");
        this.aNormal = gl.getAttribLocation(this.prog, "aNormal");

        this.uMVP = gl.getUniformLocation(this.prog, "uMVP");
        this.uMV = gl.getUniformLocation(this.prog, "uMV");
        this.uNormal = gl.getUniformLocation(this.prog, "uNormal");
        this.uSwap = gl.getUniformLocation(this.prog, "uSwap");
        this.uShowTex = gl.getUniformLocation(this.prog, "uShowTex");
        this.uLightDir = gl.getUniformLocation(this.prog, "uLightDir");
        this.uShininess = gl.getUniformLocation(this.prog, "uShininess");

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.lightDir = [0.0, 0.0, 1.0];
        this.shininess = 30.0;
    }

    // This method is called every time the user opens an OBJ file.
    // The arguments of this function is an array of 3D vertex positions,
    // an array of 2D texture coordinates, and an array of vertex normals.
    // Every item in these arrays is a floating point value, representing one
    // coordinate of the vertex position or texture coordinate.
    // Every three consecutive elements in the vertPos array forms one vertex
    // position and every three consecutive vertex positions form a triangle.
    // Similarly, every two consecutive elements in the texCoords array
    // form the texture coordinate of a vertex and every three consecutive
    // elements in the normals array form a vertex normal.
    // Note that this method can be called multiple times.
    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertPos),
            gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(texCoords),
            gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(normals),
            gl.STATIC_DRAW
        );
    }

    // This method is called when the user changes the state of the
    // "Swap Y-Z Axes" checkbox.
    // The argument is a boolean that indicates if the checkbox is checked.
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.uSwap, swap ? 1 : 0);
    }

    // This method is called to draw the triangular mesh.
    // The arguments are the model-view-projection transformation matrixMVP,
    // the model-view transformation matrixMV, the same matrix returned
    // by the GetModelViewProjection function above, and the normal
    // transformation matrix, which is the inverse-transpose of matrixMV.
    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.uMVP, false, matrixMVP);
        gl.uniformMatrix4fv(this.uMV, false, matrixMV);
        gl.uniformMatrix3fv(this.uNormal, false, matrixNormal);

        gl.uniform3fv(this.uLightDir, this.lightDir);
        gl.uniform1f(this.uShininess, this.shininess);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aTexCoord);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aNormal);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    // This method is called to set the texture of the mesh.
    // The argument is an HTML IMG element containing the texture data.
    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // You can set the texture image data using the following command.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        gl.generateMipmap(gl.TEXTURE_2D);
        this.showTexture(true);
    }

    // This method is called when the user changes the state of the
    // "Show Texture" checkbox.
    // The argument is a boolean that indicates if the checkbox is checked.
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.uShowTex, show ? 1 : 0);
    }

    // This method is called to set the incoming light direction
    setLightDir(x, y, z) {
        this.lightDir = [x, y, z];
    }

    // This method is called to set the shininess of the material
    setShininess(shininess) {
        this.shininess = shininess;
    }
}

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(
    dt,
    positions,
    velocities,
    springs,
    stiffness,
    damping,
    particleMass,
    gravity,
    restitution
) {
    const numParticles = positions.length;
    const forces = Array(numParticles);

    // 1. Initialize forces with gravity
    for (let i = 0; i < numParticles; i++) {
        forces[i] = gravity.mul(particleMass);
    }

    // 2. Apply spring forces and damping
    for (let spring of springs) {
        const i = spring.p0;
        const j = spring.p1;

        const pi = positions[i];
        const pj = positions[j];
        const vi = velocities[i];
        const vj = velocities[j];

        const d = pj.sub(pi);
        const L = d.len();
        const dir = d.unit();

        // Hooke's law
        const fs = dir.mul(stiffness * (L - spring.rest));

        // Damping
        const vRel = vj.sub(vi);
        const fd = dir.mul(damping * vRel.dot(dir));

        const f = fs.add(fd); // total spring + damping

        forces[i].inc(f); // Apply to p0
        forces[j].dec(f); // Newton's third law
    }

    // 3. Update velocities and positions (semi-implicit Euler)
    for (let i = 0; i < numParticles; i++) {
        const acc = forces[i].div(particleMass);
        velocities[i].inc(acc.mul(dt));
        positions[i].inc(velocities[i].mul(dt));
    }

    // 4. Handle collisions with bounding box
    for (let i = 0; i < numParticles; i++) {
        for (let dim of ["x", "y", "z"]) {
            if (positions[i][dim] < -1) {
                positions[i][dim] = -1;
                if (velocities[i][dim] < 0) {
                    velocities[i][dim] = -velocities[i][dim] * restitution;
                }
            }
            if (positions[i][dim] > 1) {
                positions[i][dim] = 1;
                if (velocities[i][dim] > 0) {
                    velocities[i][dim] = -velocities[i][dim] * restitution;
                }
            }
        }
    }
}
