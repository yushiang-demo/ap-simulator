// setup numeric.min.js
// reference: https://ccc-js.github.io/numeric2/documentation.html

export const solveTriangleLocalization = (pivots, distances) => {
  const A = [];
  const b = [];
  for (let i = 1; i < pivots.length; i++) {
    A.push([
      2 * pivots[0][0] - 2 * pivots[i][0],
      2 * pivots[0][1] - 2 * pivots[i][1],
      2 * pivots[0][2] - 2 * pivots[i][2],
    ]);
    b.push([
      distances[i] ** 2 -
        distances[0] ** 2 +
        pivots[0][0] ** 2 -
        pivots[i][0] ** 2 +
        pivots[0][1] ** 2 -
        pivots[i][1] ** 2 +
        pivots[0][2] ** 2 -
        pivots[i][2] ** 2,
    ]);
  }

  const pinv = (A) => {
    return numeric.dot(
      numeric.inv(numeric.dot(numeric.transpose(A), A)),
      numeric.transpose(A)
    );
  };
  const p = numeric.dot(pinv(A), b);
  return p.flatMap((v) => v);
};
