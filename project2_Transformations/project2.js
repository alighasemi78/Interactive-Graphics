// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
  let rad = (rotation * Math.PI) / 180;
  let cos = Math.cos(rad);
  let sin = Math.sin(rad);

  // S = [scale   0   0]
  // 	 [0     scale 0]
  //     [0       0   1]

  // R = [cos -sin 0]
  // 	 [sin  cos 0]
  //     [0     0  1]

  // T = [1 0 positionX]
  //     [0 1 positionY]
  //     [0 0    1     ]

  // Matrix = T * R * S
  // Multiplying out manually (column-major order):
  return [
    scale * cos, // m00
    scale * sin, // m10
    0, // m20

    -scale * sin, // m01
    scale * cos, // m11
    0, // m21

    positionX, // m02
    positionY, // m12
    1, // m22
  ];
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
  let result = new Array(9).fill(0);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      for (let k = 0; k < 3; k++) {
        // result(row, col) += trans2(row, k) * trans1(k, col)
        result[col * 3 + row] += trans2[k * 3 + row] * trans1[col * 3 + k];
      }
    }
  }

  return result;
}
