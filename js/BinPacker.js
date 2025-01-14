class BinPacker {
    constructor(plates) {
        this.plateSizes = plates.filter(([w, h]) => w <= 50000 && h <= 4160);
        if (this.plateSizes.length === 0) {
            throw new Error("No valid plate sizes provided (max: 50000x4160)");
        }
        this.reset();
    }

    reset() {
        this.plates = [];
        this.placementsByPlate = new Map();
    }

    findBestPlateSize(width, height) {
        const suitablePlates = this.plateSizes.filter(([w, h]) => w >= width && h >= height);
        if (suitablePlates.length === 0) return null;
        return suitablePlates.reduce((a, b) => (a[0] * a[1] < b[0] * b[1] ? a : b));
    }

    canPlaceAt(plateIdx, x, y, width, height) {
        const placements = this.placementsByPlate.get(plateIdx);
        if (!placements || placements.length === 0) return true;

        const [plateWidth, plateHeight] = this.plates[plateIdx];
        if (x + width > plateWidth || y + height > plateHeight) return false;

        return !placements.some(rect => 
            x < rect.x + rect.width && x + width > rect.x &&
            y < rect.y + rect.height && y + height > rect.y
        );
    }

    findNextPosition(plateIdx, width, height) {
        const [plateWidth, plateHeight] = this.plates[plateIdx];
        const placements = this.placementsByPlate.get(plateIdx) || [];
        
        if (placements.length === 0) return [0, 0];

        const xPositions = [...new Set([0, ...placements.map(r => r.x + r.width)])].sort((a, b) => a - b);
        
        let bestPos = null;
        let minWaste = Infinity;

        for (const x of xPositions) {
            if (x + width > plateWidth) continue;

            let y = 0;
            for (const rect of placements) {
                if (rect.x < x + width && rect.x + rect.width > x) {
                    y = Math.max(y, rect.y + rect.height);
                }
            }

            if (y + height <= plateHeight && this.canPlaceAt(plateIdx, x, y, width, height)) {
                const waste = this.calculateLocalWaste(plateIdx, x, y, width, height);
                if (waste < minWaste) {
                    minWaste = waste;
                    bestPos = [x, y];
                }
            }
        }

        return bestPos;
    }

    calculateLocalWaste(plateIdx, x, y, width, height) {
        const placements = this.placementsByPlate.get(plateIdx) || [];
        if (placements.length === 0) return 0;

        const belowPlacements = placements.filter(r => r.y < y);
        if (belowPlacements.length === 0) return 0;

        const maxX = Math.max(...belowPlacements.map(r => r.x + r.width));
        if (maxX <= x) return 0;

        const leftPlacements = belowPlacements.filter(r => r.x < x);
        if (leftPlacements.length === 0) return 0;

        const maxY = Math.max(...leftPlacements.map(r => r.y + r.height));
        return (maxX - x) * (y - maxY);
    }

    pack(rectangles) {
        try {
            console.log('开始打包矩形:', rectangles);
            const contracts = new Map();
            for (const rect of rectangles) {
                const key = `${rect.width},${rect.height}`;
                contracts.set(key, (contracts.get(key) || 0) + 1);
            }

            const contractList = Array.from(contracts.entries()).map(([key, count]) => {
                const [width, height] = key.split(',').map(Number);
                return [[width, height], count];
            });

            console.log('合约列表:', contractList);
            const [placements, totalPlates] = this.cut(contractList);
            console.log('放置结果:', placements);
            
            if (!placements || placements.size === 0) {
                throw new Error('没有找到可行的放置方案');
            }

            const result = Array.from(placements.entries()).map(([plateIdx, cuts]) => ({
                width: this.plates[plateIdx][0],
                height: this.plates[plateIdx][1],
                rectangles: cuts.map(rect => {
                    const r = rect.clone();
                    return r;
                })
            }));

            console.log('最终结果:', result);
            return result;
        } catch (error) {
            console.error('打包过程中出错:', error);
            alert('打包失败: ' + error.message);
            return [];
        }
    }

    cut(contracts, timeLimit = 5000) {
        const startTime = Date.now();
        let bestSolution = null;
        let bestScore = Infinity;

        const rectangles = contracts.flatMap(([[w, h], count], contractIndex) => 
            Array(count).fill().map((_, i) => {
                const rect = new Rectangle(w, h);
                rect.id = `R${contractIndex+1}-${i+1}`;
                return rect;
            })
        );

        const tryPacking = (rects) => {
            this.reset();
            const placements = new Map();
            
            for (const rect of rects) {
                let placed = false;
                let bestPlacement = null;
                let bestWaste = Infinity;

                // Try existing plates
                for (let plateIdx = 0; plateIdx < this.plates.length; plateIdx++) {
                    const pos = this.findNextPosition(plateIdx, rect.width, rect.height);
                    if (pos) {
                        const [x, y] = pos;
                        const waste = this.calculateLocalWaste(plateIdx, x, y, rect.width, rect.height);
                        if (waste < bestWaste) {
                            bestWaste = waste;
                            bestPlacement = { plateIdx, x, y, rect: rect.clone() };
                            placed = true;
                        }
                    }
                }

                // Try new plate if needed
                if (!placed) {
                    const plateSize = this.findBestPlateSize(rect.width, rect.height);
                    if (!plateSize) {
                        throw new Error(`Cannot place rectangle ${rect.width}x${rect.height}`);
                    }
                    
                    const plateIdx = this.plates.length;
                    this.plates.push(plateSize);
                    this.placementsByPlate.set(plateIdx, []);
                    bestPlacement = { 
                        plateIdx, 
                        x: 0, 
                        y: 0, 
                        rect: rect.clone() 
                    };
                }

                // Apply placement
                const { plateIdx, x, y, rect: placedRect } = bestPlacement;
                placedRect.x = x;
                placedRect.y = y;
                if (!placements.has(plateIdx)) {
                    placements.set(plateIdx, []);
                }
                placements.get(plateIdx).push(placedRect);
                this.placementsByPlate.get(plateIdx).push(placedRect);
            }

            return [placements, this.plates.length];
        };

        // Initial solution
        const baseRects = [...rectangles].sort((a, b) => b.height - a.height || b.width - a.width);
        try {
            const [placements, plateCount] = tryPacking(baseRects);
            bestSolution = placements;
            bestScore = plateCount;
        } catch (e) {
            console.error("Initial packing failed:", e);
            return [new Map(), 0];
        }

        // Monte Carlo optimization
        while (Date.now() - startTime < timeLimit) {
            const shuffled = [...rectangles].sort(() => Math.random() - 0.5);
            
            try {
                const [placements, plateCount] = tryPacking(shuffled);
                if (plateCount < bestScore) {
                    bestSolution = placements;
                    bestScore = plateCount;
                }
            } catch (e) {
                continue;
            }
        }

        return [bestSolution, bestScore];
    }
} 
