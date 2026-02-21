const fs = require('fs');
const mockups = JSON.parse(fs.readFileSync('./data/mockups.json', 'utf8'));

function calculatePlacementAspect(mockup) {
    if (!mockup.mockupWidth || !mockup.mockupHeight) return 1

    if (mockup.placement && mockup.placement.tl) {
        const toPx = (p) => ({
            x: (p.x / 100) * mockup.mockupWidth,
            y: (p.y / 100) * mockup.mockupHeight
        });

        const pTl = toPx(mockup.placement.tl);
        const pTr = toPx(mockup.placement.tr);
        const pBr = toPx(mockup.placement.br);
        const pBl = toPx(mockup.placement.bl);

        const w1 = Math.sqrt(Math.pow(pTr.x - pTl.x, 2) + Math.pow(pTr.y - pTl.y, 2));
        const w2 = Math.sqrt(Math.pow(pBr.x - pBl.x, 2) + Math.pow(pBr.y - pBl.y, 2));
        const h1 = Math.sqrt(Math.pow(pBl.x - pTl.x, 2) + Math.pow(pBl.y - pTl.y, 2));
        const h2 = Math.sqrt(Math.pow(pBr.x - pTr.x, 2) + Math.pow(pBr.y - pTr.y, 2));

        const quadW = (w1 + w2) / 2;
        const quadH = (h1 + h2) / 2;
        console.log(`w1=${w1.toFixed(1)}, w2=${w2.toFixed(1)}, h1=${h1.toFixed(1)}, h2=${h2.toFixed(1)}`);
        return { w1, w2, h1, h2, quadW, quadH, aspect: quadW / quadH };
    }
}

console.log(mockups[0].name);
console.log(mockups[0].placement);
console.log(mockups[0].mockupWidth, mockups[0].mockupHeight);
console.log(calculatePlacementAspect(mockups[0]));
