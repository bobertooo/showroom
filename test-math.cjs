const fs = require('fs')
const mockups = JSON.parse(fs.readFileSync('./data/mockups.json', 'utf8'))
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
        return quadW / quadH;
    }
    return 1;
}
mockups.forEach((m, idx) => {
    console.log(`[${idx}] ${m.id} - ${m.name}`);
    console.log(`Dimensions: ${m.mockupWidth}x${m.mockupHeight}`);
    if (m.placement && m.placement.tl) {
        console.log(`TL: ${m.placement.tl.x.toFixed(1)}, ${m.placement.tl.y.toFixed(1)}`);
        console.log(`TR: ${m.placement.tr.x.toFixed(1)}, ${m.placement.tr.y.toFixed(1)}`);
        console.log(`BL: ${m.placement.bl.x.toFixed(1)}, ${m.placement.bl.y.toFixed(1)}`);
        console.log(`BR: ${m.placement.br.x.toFixed(1)}, ${m.placement.br.y.toFixed(1)}`);
    }
    console.log(`Aspect: ${calculatePlacementAspect(m).toFixed(3)}\n`);
});
