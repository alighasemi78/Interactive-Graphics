// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(
    projectionMatrix,
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

    // Rotation around X axis
    let rotX = [1, 0, 0, 0, 0, cosX, sinX, 0, 0, -sinX, cosX, 0, 0, 0, 0, 1];

    // Rotation around Y axis
    let rotY = [cosY, 0, -sinY, 0, 0, 1, 0, 0, sinY, 0, cosY, 0, 0, 0, 0, 1];

    // Translation
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

    // Combine: projection * translation * rotationX * rotationY
    let mvp = MatrixMult(
        projectionMatrix,
        MatrixMult(trans, MatrixMult(rotX, rotY))
    );
    return mvp;
}

class MeshDrawer {
    // The constructor is a good place for taking care of the necessary initializations.
    constructor() {
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        const vertexSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 uMVP;
        uniform bool uSwap;
        varying vec2 vTexCoord;

        void main() {
            vec3 pos = aPosition;
            if (uSwap) {
                pos = vec3(pos.x, pos.z, pos.y);
            }
            gl_Position = uMVP * vec4(pos, 1.0);
            vTexCoord = aTexCoord;
        }`;

        const fragmentSource = `
        precision mediump float;
        uniform sampler2D tex;
        uniform bool uShowTex;
        varying vec2 vTexCoord;

        void main() {
            if (uShowTex) {
                gl_FragColor = texture2D(tex, vTexCoord);
            } else {
                gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
            }
        }`;

        this.prog = InitShaderProgram(vertexSource, fragmentSource);
        this.aPosition = gl.getAttribLocation(this.prog, "aPosition");
        this.aTexCoord = gl.getAttribLocation(this.prog, "aTexCoord");
        this.uMVP = gl.getUniformLocation(this.prog, "uMVP");
        this.uSwap = gl.getUniformLocation(this.prog, "uSwap");
        this.uShowTex = gl.getUniformLocation(this.prog, "uShowTex");

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // This method is called every time the user opens an OBJ file.
    // The arguments of this function is an array of 3D vertex positions
    // and an array of 2D texture coordinates.
    // Every item in these arrays is a floating point value, representing one
    // coordinate of the vertex position or texture coordinate.
    // Every three consecutive elements in the vertPos array forms one vertex
    // position and every three consecutive vertex positions form a triangle.
    // Similarly, every two consecutive elements in the texCoords array
    // form the texture coordinate of a vertex.
    // Note that this method can be called multiple times.
    setMesh(vertPos, texCoords) {
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
    }

    // This method is called when the user changes the state of the
    // "Swap Y-Z Axes" checkbox.
    // The argument is a boolean that indicates if the checkbox is checked.
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.uSwap, swap ? 1 : 0);
    }

    // This method is called to draw the triangular mesh.
    // The argument is the transformation matrix, the same matrix returned
    // by the GetModelViewProjection function above.
    draw(trans) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.uMVP, false, trans);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aTexCoord);

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
}
