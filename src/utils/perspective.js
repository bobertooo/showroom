export class Perspective {
    constructor(ctx, image) {
        this.ctx = ctx;
        this.image = image;
    }

    // Calculate the homography matrix to map source points to destination points
    // Source points are typically [0, 0], [w, 0], [w, h], [0, h] for the image
    // Destination points are the 4 user-draggable corners
    static getHomographyMatrix(src, dst) {
        let t = [];
        for (let i = 0; i < 4; i++) {
            let x = src[i].x, y = src[i].y;
            let u = dst[i].x, v = dst[i].y;
            t.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
            t.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
        }

        // Solve system of linear equations using Gaussian elimination
        const solve = (A, b) => {
            const n = A.length;
            for (let i = 0; i < n; i++) {
                let maxEl = Math.abs(A[i][i]), maxRow = i;
                for (let k = i + 1; k < n; k++) {
                    if (Math.abs(A[k][i]) > maxEl) {
                        maxEl = Math.abs(A[k][i]);
                        maxRow = k;
                    }
                }

                for (let k = i; k < n; k++) {
                    const tmp = A[maxRow][k];
                    A[maxRow][k] = A[i][k];
                    A[i][k] = tmp;
                }
                const tmp = b[maxRow];
                b[maxRow] = b[i];
                b[i] = tmp;

                for (let k = i + 1; k < n; k++) {
                    const c = -A[k][i] / A[i][i];
                    for (let j = i; j < n; j++) {
                        if (i === j) {
                            A[k][j] = 0;
                        } else {
                            A[k][j] += c * A[i][j];
                        }
                    }
                    b[k] += c * b[i];
                }
            }

            const x = new Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) {
                let sum = 0;
                for (let j = i + 1; j < n; j++) {
                    sum += A[i][j] * x[j];
                }
                x[i] = (b[i] - sum) / A[i][i];
            }
            return x;
        };

        const b = [];
        for (let i = 0; i < 4; i++) {
            b.push(dst[i].x);
            b.push(dst[i].y);
        }

        const h = solve(t, b);
        h.push(1);

        // Reshape to 3x3 matrix
        return [
            [h[0], h[1], h[2]],
            [h[3], h[4], h[5]],
            [h[6], h[7], h[8]]
        ];
    }

    // Draw the image warped to the destination points
    warp(dstPoints, blendMode = 'normal') {
        const { width, height } = this.image;

        const srcPoints = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height }
        ];

        const H = Perspective.getHomographyMatrix(srcPoints, dstPoints);
        const invH = this.inverseMatrix(H);
        if (!invH) return; // Degenerate matrix — nothing to draw

        // Get bounding box of destination, clamped to canvas bounds
        const canvasW = this.ctx.canvas.width;
        const canvasH = this.ctx.canvas.height;
        const minX = Math.max(0, Math.floor(Math.min(...dstPoints.map(p => p.x))));
        const maxX = Math.min(canvasW, Math.ceil(Math.max(...dstPoints.map(p => p.x))));
        const minY = Math.max(0, Math.floor(Math.min(...dstPoints.map(p => p.y))));
        const maxY = Math.min(canvasH, Math.ceil(Math.max(...dstPoints.map(p => p.y))));

        // Nothing visible — early exit
        if (maxX <= minX || maxY <= minY) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasW;
        tempCanvas.height = canvasH;
        const tempCtx = tempCanvas.getContext('2d');
        const imgData = tempCtx.createImageData(canvasW, canvasH);
        const data = imgData.data;

        // Get source pixel data
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = width;
        srcCanvas.height = height;
        const srcCtx = srcCanvas.getContext('2d');
        srcCtx.drawImage(this.image, 0, 0);
        const srcData = srcCtx.getImageData(0, 0, width, height).data;

        let dstData = null;
        if (blendMode === 'multiply') {
            dstData = this.ctx.getImageData(0, 0, canvasW, canvasH).data;
        }

        // Iterate over clamped destination bounding box only
        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                const u = invH[0][0] * x + invH[0][1] * y + invH[0][2];
                const v = invH[1][0] * x + invH[1][1] * y + invH[1][2];
                const w = invH[2][0] * x + invH[2][1] * y + invH[2][2];

                if (Math.abs(w) < 1e-10) continue; // Avoid division by zero

                const srcX = u / w;
                const srcY = v / w;

                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    const x0 = Math.floor(srcX);
                    const y0 = Math.floor(srcY);
                    const x1 = Math.min(x0 + 1, width - 1);
                    const y1 = Math.min(y0 + 1, height - 1);
                    const fx = srcX - x0;
                    const fy = srcY - y0;

                    const idx00 = (y0 * width + x0) * 4;
                    const idx10 = (y0 * width + x1) * 4;
                    const idx01 = (y1 * width + x0) * 4;
                    const idx11 = (y1 * width + x1) * 4;

                    const w00 = (1 - fx) * (1 - fy);
                    const w10 = fx * (1 - fy);
                    const w01 = (1 - fx) * fy;
                    const w11 = fx * fy;

                    const sr = srcData[idx00] * w00 + srcData[idx10] * w10 + srcData[idx01] * w01 + srcData[idx11] * w11;
                    const sg = srcData[idx00 + 1] * w00 + srcData[idx10 + 1] * w10 + srcData[idx01 + 1] * w01 + srcData[idx11 + 1] * w11;
                    const sb = srcData[idx00 + 2] * w00 + srcData[idx10 + 2] * w10 + srcData[idx01 + 2] * w01 + srcData[idx11 + 2] * w11;
                    const sa = srcData[idx00 + 3] * w00 + srcData[idx10 + 3] * w10 + srcData[idx01 + 3] * w01 + srcData[idx11 + 3] * w11;

                    const dstIdx = (y * canvasW + x) * 4;

                    if (blendMode === 'multiply' && dstData) {
                        const dr = dstData[dstIdx];
                        const dg = dstData[dstIdx + 1];
                        const db = dstData[dstIdx + 2];

                        // Blend: use multiply, but ensure shadows are always preserved.
                        // On dark mockup areas, the design should be darkened to match.
                        const mr = (sr * dr) / 255;
                        const mg = (sg * dg) / 255;
                        const mb = (sb * db) / 255;

                        // Luminance-adaptive: on mid/light surfaces use full multiply,
                        // on dark surfaces (shadows) lerp toward just darkening the design
                        // by the mockup brightness, so shadows stay dark but colors aren't crushed.
                        const lum = (dr * 0.299 + dg * 0.587 + db * 0.114) / 255;
                        const mix = Math.min(1, lum * lum * 4);

                        // "Shadow only" pass: darken the design by the mockup brightness
                        const shadowR = sr * lum;
                        const shadowG = sg * lum;
                        const shadowB = sb * lum;

                        data[dstIdx] = mr * mix + shadowR * (1 - mix);
                        data[dstIdx + 1] = mg * mix + shadowG * (1 - mix);
                        data[dstIdx + 2] = mb * mix + shadowB * (1 - mix);
                        data[dstIdx + 3] = sa;
                    } else {
                        data[dstIdx] = sr;
                        data[dstIdx + 1] = sg;
                        data[dstIdx + 2] = sb;
                        data[dstIdx + 3] = sa;
                    }
                }
            }
        }

        tempCtx.putImageData(imgData, 0, 0);
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    inverseMatrix(H) {
        const det = H[0][0] * (H[1][1] * H[2][2] - H[2][1] * H[1][2]) -
            H[0][1] * (H[1][0] * H[2][2] - H[1][2] * H[2][0]) +
            H[0][2] * (H[1][0] * H[2][1] - H[1][1] * H[2][0]);

        if (Math.abs(det) < 1e-10) return null;
        const invDet = 1 / det;

        return [
            [
                (H[1][1] * H[2][2] - H[2][1] * H[1][2]) * invDet,
                (H[0][2] * H[2][1] - H[0][1] * H[2][2]) * invDet,
                (H[0][1] * H[1][2] - H[0][2] * H[1][1]) * invDet
            ],
            [
                (H[1][2] * H[2][0] - H[1][0] * H[2][2]) * invDet,
                (H[0][0] * H[2][2] - H[0][2] * H[2][0]) * invDet,
                (H[1][0] * H[0][2] - H[0][0] * H[1][2]) * invDet
            ],
            [
                (H[1][0] * H[2][1] - H[2][0] * H[1][1]) * invDet,
                (H[2][0] * H[0][1] - H[0][0] * H[2][1]) * invDet,
                (H[0][0] * H[1][1] - H[1][0] * H[0][1]) * invDet
            ]
        ];
    }
}

export function isPointInPolygon(point, vs) {
    var x = point.x, y = point.y;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};
