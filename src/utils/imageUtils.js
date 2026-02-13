import { Perspective } from './perspective'

// Image loading and compositing utilities

export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

// Compute the 4 destination points for the design on the mockup
// transform: { scale: number, offsetX: number (% of mockup width), offsetY: number (% of mockup height) }
function computeDesignPoints(placement, designAspect, mockupW, mockupH, transform = {}) {
    const { scale = 1, offsetX = 0, offsetY = 0, fillMode = 'fit' } = transform;
    const ox = (offsetX / 100) * mockupW;
    const oy = (offsetY / 100) * mockupH;
    let dstPoints = [];

    if (placement && placement.tl) {
        // Perspective placement (4 corners)
        const rawPoints = [
            { x: (placement.tl.x / 100) * mockupW, y: (placement.tl.y / 100) * mockupH },
            { x: (placement.tr.x / 100) * mockupW, y: (placement.tr.y / 100) * mockupH },
            { x: (placement.br.x / 100) * mockupW, y: (placement.br.y / 100) * mockupH },
            { x: (placement.bl.x / 100) * mockupW, y: (placement.bl.y / 100) * mockupH }
        ];

        // Aspect-fit: shrink the quad inward so the design isn't stretched
        // Estimate the quad's width (average of top and bottom edges)
        const topW = Math.sqrt((rawPoints[1].x - rawPoints[0].x) ** 2 + (rawPoints[1].y - rawPoints[0].y) ** 2);
        const botW = Math.sqrt((rawPoints[2].x - rawPoints[3].x) ** 2 + (rawPoints[2].y - rawPoints[3].y) ** 2);
        const leftH = Math.sqrt((rawPoints[3].x - rawPoints[0].x) ** 2 + (rawPoints[3].y - rawPoints[0].y) ** 2);
        const rightH = Math.sqrt((rawPoints[2].x - rawPoints[1].x) ** 2 + (rawPoints[2].y - rawPoints[1].y) ** 2);

        const quadW = (topW + botW) / 2;
        const quadH = (leftH + rightH) / 2;
        const quadAspect = quadW / quadH;

        // Aspect-fit or fill: skip fitting when fillMode is 'fill'
        let fitted = rawPoints;
        if (fillMode !== 'fill') {
            if (designAspect > quadAspect) {
                // Design is wider than quad → shrink vertically (move top/bottom edges inward)
                const fitH = quadW / designAspect;
                const t = (quadH > 0) ? fitH / quadH : 1;
                const midTop = { x: (rawPoints[0].x + rawPoints[1].x) / 2, y: (rawPoints[0].y + rawPoints[1].y) / 2 };
                const midBot = { x: (rawPoints[3].x + rawPoints[2].x) / 2, y: (rawPoints[3].y + rawPoints[2].y) / 2 };
                const midY = { x: (midTop.x + midBot.x) / 2, y: (midTop.y + midBot.y) / 2 };
                fitted = rawPoints.map((p, i) => {
                    const isTop = i <= 1;
                    const anchor = isTop ? midTop : midBot;
                    return {
                        x: p.x + (midY.x - anchor.x) * (1 - t),
                        y: p.y + (midY.y - anchor.y) * (1 - t)
                    };
                });
            } else if (designAspect < quadAspect) {
                // Design is taller than quad → shrink horizontally (move left/right edges inward)
                const fitW = quadH * designAspect;
                const t = (quadW > 0) ? fitW / quadW : 1;
                const midLeft = { x: (rawPoints[0].x + rawPoints[3].x) / 2, y: (rawPoints[0].y + rawPoints[3].y) / 2 };
                const midRight = { x: (rawPoints[1].x + rawPoints[2].x) / 2, y: (rawPoints[1].y + rawPoints[2].y) / 2 };
                const midX = { x: (midLeft.x + midRight.x) / 2, y: (midLeft.y + midRight.y) / 2 };
                fitted = rawPoints.map((p, i) => {
                    const isLeft = i === 0 || i === 3;
                    const anchor = isLeft ? midLeft : midRight;
                    return {
                        x: p.x + (midX.x - anchor.x) * (1 - t),
                        y: p.y + (midX.y - anchor.y) * (1 - t)
                    };
                });
            }
        }

        const cx = fitted.reduce((s, p) => s + p.x, 0) / 4;
        const cy = fitted.reduce((s, p) => s + p.y, 0) / 4;
        dstPoints = fitted.map(p => ({
            x: cx + (p.x - cx) * scale + ox,
            y: cy + (p.y - cy) * scale + oy
        }));
    } else {
        // Legacy rectangular placement → aspect-fit inside zone
        const origW = (placement.width / 100) * mockupW;
        const origH = (placement.height / 100) * mockupH;
        const origX = (placement.x / 100) * mockupW;
        const origY = (placement.y / 100) * mockupH;

        const zoneW = origW * scale;
        const zoneH = origH * scale;
        const zoneX = origX + (origW - zoneW) / 2;
        const zoneY = origY + (origH - zoneH) / 2;

        let drawW, drawH, drawX, drawY;

        if (fillMode === 'fill') {
            // Stretch to fill the entire zone
            drawW = zoneW;
            drawH = zoneH;
            drawX = zoneX;
            drawY = zoneY;
        } else {
            const zoneAspect = zoneW / zoneH;
            if (designAspect > zoneAspect) {
                drawW = zoneW;
                drawH = zoneW / designAspect;
                drawX = zoneX;
                drawY = zoneY + (zoneH - drawH) / 2;
            } else {
                drawH = zoneH;
                drawW = zoneH * designAspect;
                drawX = zoneX + (zoneW - drawW) / 2;
                drawY = zoneY;
            }
        }

        dstPoints = [
            { x: drawX + ox, y: drawY + oy },
            { x: drawX + drawW + ox, y: drawY + oy },
            { x: drawX + drawW + ox, y: drawY + drawH + oy },
            { x: drawX + ox, y: drawY + drawH + oy }
        ];
    }

    return dstPoints;
}
// Export for use by quickComposite
export { computeDesignPoints }

// Returns the raw placement polygon in pixel space (no transform applied)
function getPlacementPolygon(placement, mockupW, mockupH) {
    if (placement && placement.tl) {
        return [
            { x: (placement.tl.x / 100) * mockupW, y: (placement.tl.y / 100) * mockupH },
            { x: (placement.tr.x / 100) * mockupW, y: (placement.tr.y / 100) * mockupH },
            { x: (placement.br.x / 100) * mockupW, y: (placement.br.y / 100) * mockupH },
            { x: (placement.bl.x / 100) * mockupW, y: (placement.bl.y / 100) * mockupH }
        ]
    } else {
        const x = (placement.x / 100) * mockupW
        const y = (placement.y / 100) * mockupH
        const w = (placement.width / 100) * mockupW
        const h = (placement.height / 100) * mockupH
        return [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h }
        ]
    }
}

// Apply a clip path from a polygon to a canvas context
function applyClipPath(ctx, polygon) {
    ctx.beginPath()
    ctx.moveTo(polygon[0].x, polygon[0].y)
    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y)
    }
    ctx.closePath()
    ctx.clip()
}

// Image cache to avoid reloading during drag
const imageCache = new Map()

export async function preloadImages(mockupSrc, designSrc) {
    const key = `${mockupSrc}|${designSrc}`
    if (imageCache.has(key)) return imageCache.get(key)

    const [mockupImg, designImg] = await Promise.all([
        loadImage(mockupSrc),
        loadImage(designSrc)
    ])
    const result = { mockupImg, designImg }
    imageCache.set(key, result)
    return result
}

export async function compositeImages(canvas, mockupSrc, designSrc, placement, transform = {}, clipToPlacement = true) {
    const { mockupImg, designImg } = await preloadImages(mockupSrc, designSrc)

    // Enforce a minimum render resolution to prevent pixelation on low-res mockups
    // (e.g. if mockup is 600px, but design is HQ, we want to render at HQ)
    const minRes = 2400
    const scale = Math.max(1, minRes / Math.max(mockupImg.width, mockupImg.height))

    canvas.width = Math.round(mockupImg.width * scale)
    canvas.height = Math.round(mockupImg.height * scale)

    const ctx = canvas.getContext('2d')
    ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height)

    const designAspect = designImg.width / designImg.height;
    const dstPoints = computeDesignPoints(placement, designAspect, canvas.width, canvas.height, transform);

    // Clip the design to the placement zone (optional)
    if (clipToPlacement) {
        const clipPoly = getPlacementPolygon(placement, canvas.width, canvas.height)
        ctx.save()
        applyClipPath(ctx, clipPoly)
    }

    const p = new Perspective(ctx, designImg);
    p.warp(dstPoints, 'multiply');

    if (clipToPlacement) {
        ctx.restore()
    }

    return canvas
}

// GPU-accelerated quick composite for drag previews — no pixel-by-pixel warp
export function quickComposite(canvas, mockupImg, designImg, placement, transform = {}, clipToPlacement = true) {
    // Use the canvas's existing dimensions — don't resize (avoids shrink + buffer reallocation)
    const w = canvas.width
    const h = canvas.height

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(mockupImg, 0, 0, w, h)

    const designAspect = designImg.width / designImg.height
    const pts = computeDesignPoints(placement, designAspect, w, h, transform)

    // Compute axis-aligned bounding box for the design
    const xs = pts.map(p => p.x)
    const ys = pts.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    // Clip to placement zone (optional), then draw with native multiply blend
    if (clipToPlacement) {
        const clipPoly = getPlacementPolygon(placement, w, h)
        ctx.save()
        applyClipPath(ctx, clipPoly)
    }

    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(designImg, minX, minY, maxX - minX, maxY - minY)
    ctx.globalCompositeOperation = 'source-over'

    if (clipToPlacement) {
        ctx.restore()
    }

    return canvas
}

// Returns the axis-aligned bounding box of the design in mockup pixel space
// Result: { x, y, width, height, mockupWidth, mockupHeight }
export async function getDesignBounds(mockupSrc, designSrc, placement, transform = {}) {
    const [mockupImg, designImg] = await Promise.all([
        loadImage(mockupSrc),
        loadImage(designSrc)
    ]);

    const designAspect = designImg.width / designImg.height;
    const pts = computeDesignPoints(placement, designAspect, mockupImg.width, mockupImg.height, transform);

    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
        mockupWidth: mockupImg.width,
        mockupHeight: mockupImg.height
    };
}

export function downloadCanvas(canvas, filename) {
    const link = document.createElement('a')
    link.download = filename
    // Detect format from filename, default to png if not specified or png
    const format = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    const quality = format === 'image/jpeg' ? 0.85 : 1.0;
    link.href = canvas.toDataURL(format, quality)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export async function detectPlacement(imageSrc, clickX, clickY, rect) {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Scale click to natural size
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const pixelX = Math.floor(clickX * scaleX);
    const pixelY = Math.floor(clickY * scaleY);

    const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;
    const targetColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    const threshold = 40;
    let found = false;

    // Flood Fill (BFS) to find connected component
    const visited = new Uint8Array(canvas.width * canvas.height);
    const stack = [pixelX, pixelY];
    const w = canvas.width;
    const h = canvas.height;

    while (stack.length > 0) {
        const y = stack.pop();
        const x = stack.pop();

        const idx = y * w + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const i = idx * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const diff = Math.abs(r - targetColor.r) + Math.abs(g - targetColor.g) + Math.abs(b - targetColor.b);

        if (diff < threshold) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (x > 0 && !visited[y * w + (x - 1)]) { stack.push(x - 1); stack.push(y); }
            if (x < w - 1 && !visited[y * w + (x + 1)]) { stack.push(x + 1); stack.push(y); }
            if (y > 0 && !visited[(y - 1) * w + x]) { stack.push(x); stack.push(y - 1); }
            if (y < h - 1 && !visited[(y + 1) * w + x]) { stack.push(x); stack.push(y + 1); }
        }
    }

    if (found) {
        return {
            tl: { x: (minX / canvas.width) * 100, y: (minY / canvas.height) * 100 },
            tr: { x: (maxX / canvas.width) * 100, y: (minY / canvas.height) * 100 },
            br: { x: (maxX / canvas.width) * 100, y: (maxY / canvas.height) * 100 },
            bl: { x: (minX / canvas.width) * 100, y: (maxY / canvas.height) * 100 }
        };
    }
    return null;
}
