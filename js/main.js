let rectangles = [];
let binPacker = null;
let currentContainers = [];
let activeTabIndex = 0;

function initializeBinPacker() {
    const maxLength = parseInt(document.getElementById('maxLength').value);
    const maxWidth = parseInt(document.getElementById('maxWidth').value);
    binPacker = new BinPacker([[maxLength, maxWidth]]);
}

function addRectangle() {
    const length = parseInt(document.getElementById('rectLength').value);
    const width = parseInt(document.getElementById('rectWidth').value);
    const count = parseInt(document.getElementById('rectCount').value);

    if (isNaN(length) || isNaN(width) || isNaN(count) || length <= 0 || width <= 0 || count <= 0) {
        alert('请输入有效的尺寸和数量！');
        return;
    }

    for (let i = 0; i < count; i++) {
        rectangles.push(new Rectangle(length, width));
    }
    updateRectangleList();
    clearInputs();
}

function clearInputs() {
    document.getElementById('rectLength').value = '';
    document.getElementById('rectWidth').value = '';
    document.getElementById('rectCount').value = '1';
}

function updateRectangleList() {
    const list = document.getElementById('rectangleList');
    list.innerHTML = '';

    const grouped = groupRectangles(rectangles);
    grouped.forEach(([size, count]) => {
        const item = document.createElement('div');
        item.className = 'rectangle-item';
        
        // 添加编辑和删除按钮
        item.innerHTML = `
            <span>${size}</span>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span>${count}个</span>
                <button class="edit-btn" style="padding: 2px 8px;">编辑</button>
                <button class="delete-btn" style="padding: 2px 8px;">删除</button>
            </div>
        `;

        // 绑定编辑按钮事件
        item.querySelector('.edit-btn').onclick = (e) => {
            e.stopPropagation();
            editRectangle(size, count);
        };

        // 绑定删除按钮事件
        item.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            const [width, height] = size.split('×').map(Number);
            rectangles = rectangles.filter(r => !(r.width === width && r.height === height));
            updateRectangleList();
        };

        list.appendChild(item);
    });
}

function groupRectangles(rects) {
    const groups = new Map();
    rects.forEach(rect => {
        const key = `${rect.width}×${rect.height}`;
        groups.set(key, (groups.get(key) || 0) + 1);
    });
    return Array.from(groups.entries());
}

function editRectangle(size, count) {
    // 创建编辑对话框
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 300px;
    `;

    const [oldWidth, oldHeight] = size.split('×').map(Number);

    dialog.innerHTML = `
        <h3 style="margin-top: 0;">编辑小板</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">长度:</label>
            <input type="number" id="editWidth" value="${oldWidth}" style="width: 100%; padding: 5px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">宽度:</label>
            <input type="number" id="editHeight" value="${oldHeight}" style="width: 100%; padding: 5px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">数量:</label>
            <input type="number" id="editCount" value="${count}" style="width: 100%; padding: 5px;">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancelEdit" style="padding: 8px 15px;">取消</button>
            <button id="confirmEdit" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px;">确认</button>
        </div>
    `;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    // 绑定事件
    document.getElementById('cancelEdit').onclick = () => {
        document.body.removeChild(dialog);
        document.body.removeChild(overlay);
    };

    document.getElementById('confirmEdit').onclick = () => {
        const newWidth = parseInt(document.getElementById('editWidth').value);
        const newHeight = parseInt(document.getElementById('editHeight').value);
        const newCount = parseInt(document.getElementById('editCount').value);

        if (isNaN(newWidth) || isNaN(newHeight) || isNaN(newCount) || 
            newWidth <= 0 || newHeight <= 0 || newCount < 0) {
            alert('请输入有效的尺寸和数量！');
            return;
        }

        // 移除旧的矩形
        rectangles = rectangles.filter(r => !(r.width === oldWidth && r.height === oldHeight));

        // 添加新的矩形
        for (let i = 0; i < newCount; i++) {
            rectangles.push(new Rectangle(newWidth, newHeight));
        }

        updateRectangleList();
        document.body.removeChild(dialog);
        document.body.removeChild(overlay);
    };
}

function clearRectangles() {
    rectangles = [];
    updateRectangleList();
}

function runPacking() {
    console.log('开始运行装箱算法');
    if (rectangles.length === 0) {
        alert('请先添加矩形！');
        return;
    }

    console.log('矩形列表:', rectangles);
    initializeBinPacker();
    currentContainers = binPacker.pack(rectangles);
    console.log('装箱结果:', currentContainers);
    
    createTabs();
    drawActiveContainer();
    updateStatusBar();
}

function createTabs() {
    const tabButtons = document.getElementById('tabButtons');
    tabButtons.innerHTML = '';
    
    currentContainers.forEach((container, index) => {
        const button = document.createElement('button');
        button.className = `tab-button ${index === activeTabIndex ? 'active' : ''}`;
        button.textContent = `大板 ${index + 1}`;
        button.onclick = () => {
            activeTabIndex = index;
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            drawActiveContainer();
        };
        tabButtons.appendChild(button);
    });
}

function drawActiveContainer() {
    console.log('开始绘制容器');
    const canvas = document.getElementById('displayCanvas');
    const ctx = canvas.getContext('2d');
    const container = currentContainers[activeTabIndex];
    
    if (!container) {
        console.log('没有找到容器数据');
        return;
    }

    console.log('容器数据:', container);

    // Calculate scale to fit the canvas
    const margin = 50;
    const maxWidth = document.querySelector('.display-panel').clientWidth - margin * 2;
    const maxHeight = window.innerHeight - 400; // 减少最大高度以留出图例空间
    
    const scale = Math.min(
        maxWidth / container.width,
        maxHeight / container.height
    );

    // 计算图例所需的空间
    const legendItemHeight = 30;
    const legendPadding = 10;
    const itemsPerRow = 3;
    const legendRows = Math.ceil(new Set(container.rectangles.map(r => `${r.width}×${r.height}`)).size / itemsPerRow);
    const legendHeight = legendRows * legendItemHeight + legendPadding * 2 + 30; // 30是标题空间

    // 设置画布尺寸（包含图例空间）
    canvas.width = container.width * scale + margin * 2;
    canvas.height = container.height * scale + margin * 2 + legendHeight;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw container outline
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, container.width * scale, container.height * scale);

    // 创建尺寸到颜色的映射
    const sizeColorMap = new Map();
    container.rectangles.forEach(rect => {
        const sizeKey = `${rect.width}×${rect.height}`;
        if (!sizeColorMap.has(sizeKey)) {
            const hue = sizeColorMap.size * 137.508;
            sizeColorMap.set(sizeKey, `hsl(${hue % 360}, 70%, 70%)`);
        }
    });

    // 对尺寸进行排序
    const sortedSizes = Array.from(sizeColorMap.entries()).sort((a, b) => {
        const [w1, h1] = a[0].split('×').map(Number);
        const [w2, h2] = b[0].split('×').map(Number);
        return w2 * h2 - w1 * h1; // 按面积降序排列
    });

    // 计算外接矩形
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    container.rectangles.forEach(rect => {
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);
    });

    // Draw rectangles
    container.rectangles.forEach((rect, index) => {
        const sizeKey = `${rect.width}×${rect.height}`;
        ctx.fillStyle = sizeColorMap.get(sizeKey);
        ctx.fillRect(
            margin + rect.x * scale,
            margin + rect.y * scale,
            rect.width * scale,
            rect.height * scale
        );
        
        ctx.strokeStyle = 'black';
        ctx.strokeRect(
            margin + rect.x * scale,
            margin + rect.y * scale,
            rect.width * scale,
            rect.height * scale
        );

        // Draw ID
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            rect.id,
            margin + (rect.x + rect.width/2) * scale,
            margin + (rect.y + rect.height/2) * scale
        );
    });

    // 绘制外接矩形
    ctx.strokeStyle = 'red';
    ctx.setLineDash([5, 5]); // 设置虚线样式
    ctx.strokeRect(
        margin + minX * scale,
        margin + minY * scale,
        (maxX - minX) * scale,
        (maxY - minY) * scale
    );
    ctx.setLineDash([]); // 恢复实线

    // 显示外接矩形尺寸
    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    ctx.fillStyle = 'red';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    // 绘制宽度标注
    ctx.fillText(
        `${boundingWidth}`,
        margin + minX * scale + (maxX - minX) * scale / 2 - 20,
        margin + minY * scale - 5
    );
    
    // 绘制高度标注
    ctx.save();
    ctx.translate(
        margin + maxX * scale + 20,
        margin + minY * scale + (maxY - minY) * scale / 2
    );
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`${boundingHeight}`, 0, 0);
    ctx.restore();

    // 计算并显示外接矩形利用率
    const totalArea = container.width * container.height;
    const usedArea = container.rectangles.reduce((sum, rect) => 
        sum + rect.width * rect.height, 0);
    const boundingBoxArea = boundingWidth * boundingHeight;
    const boundingBoxUtilization = (usedArea / boundingBoxArea * 100).toFixed(1);
    const plateUtilization = (usedArea / totalArea * 100).toFixed(1);

    // 绘制利用率信息
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // 显示外接矩形利用率
    ctx.fillText(
        `外接矩形利用率: ${boundingBoxUtilization}%`,
        margin,
        margin / 3
    );
    
    // 显示大板利用率
    ctx.fillText(
        `大板利用率: ${plateUtilization}%`,
        margin,
        margin / 3 + 25  // 在外接矩形利用率下方显示
    );

    // 在大板右上角显示尺寸信息
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillText(
        `大板尺寸: ${container.width}×${container.height}`,
        margin + container.width * scale,
        margin - 10
    );

    // 绘制图例（在容器图形下方）
    const legendY = margin + container.height * scale + 20;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(margin, legendY, canvas.width - margin * 2, legendHeight);
    ctx.strokeStyle = '#ddd';
    ctx.strokeRect(margin, legendY, canvas.width - margin * 2, legendHeight);

    // 绘制"图例"标题
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('图例:', margin + legendPadding, legendY + 20);

    // 绘制图例项
    const legendItemWidth = (canvas.width - margin * 2 - legendPadding * 2) / itemsPerRow;
    ctx.font = '12px Arial';
    
    // 绘制所有图例项
    sortedSizes.forEach(([size, color], index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const [width, height] = size.split('×').map(Number);
        
        const x = margin + legendPadding + col * legendItemWidth;
        const y = legendY + legendPadding + row * legendItemHeight + 30;

        // 绘制颜色块
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 16, 16);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(x, y, 16, 16);
        
        // 计算该尺寸的数量
        const count = container.rectangles.filter(r => 
            r.width === width && r.height === height
        ).length;

        // 绘制尺寸和数量信息
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(
            `${size} (${count}块)`,
            x + 24,
            y + 12
        );
    });
}

function updateStatusBar() {
    const statusBar = document.getElementById('statusBar');
    const totalRectangles = rectangles.length;
    const totalContainers = currentContainers.length;
    
    const utilizations = currentContainers.map(container => {
        const totalArea = container.width * container.height;
        const usedArea = container.rectangles.reduce((sum, rect) => 
            sum + rect.width * rect.height, 0);
        return (usedArea / totalArea * 100).toFixed(1);
    });

    const avgUtilization = (utilizations.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / totalContainers).toFixed(1);

    statusBar.textContent = `总计放置 ${totalRectangles} 个子板, ` +
                           `使用 ${totalContainers} 个大板, ` +
                           `平均大板利用率 ${avgUtilization}%`;
}

// 初始化时添加窗口调整监听
window.addEventListener('resize', () => {
    if (currentContainers.length > 0) {
        drawActiveContainer();
    }
}); 
