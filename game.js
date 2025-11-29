const gameState = {
    gold: 100,
    energy: 50,
    shovelPower: 1,
    plots: Array(8).fill().map(() => ({
        plant: null,
        progress: 0,
        growthTime: 0
    }))
};

const plants = {
    carrot: {
        cost: 10,
        reward: 25,
        baseTime: 30
    },
    tomato: {
        cost: 20,
        reward: 50,
        baseTime: 45
    }
};

function updateUI() {
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('energy').textContent = gameState.energy;
    
    const farm = document.getElementById('farm');
    farm.innerHTML = '';
    
    gameState.plots.forEach((plot, index) => {
        const plotElement = document.createElement('div');
        plotElement.className = 'plot';
        plotElement.innerHTML = plot.plant ? 
            `<div class="plant ${plot.plant}">
                <div class="progress-bar" style="width: ${(plot.progress/plot.growthTime)*100}%"></div>
             </div>` : '';
        
        plotElement.onclick = () => clickPlot(index);
        farm.appendChild(plotElement);
    });
}

function clickPlot(index) {
    const plot = gameState.plots[index];
    if (!plot.plant || gameState.energy <= 0) return;
    
    gameState.energy -= 1;
    plot.progress += 5 * gameState.shovelPower;
    
    if (plot.progress >= plot.growthTime) {
        harvestPlot(index);
    }
    
    updateUI();
}

function harvestPlot(index) {
    const plot = gameState.plots[index];
    const plant = plants[plot.plant];
    
    gameState.gold += plant.reward;
    gameState.energy = Math.min(100, gameState.energy + 5);
    
    plot.plant = null;
    plot.progress = 0;
    
    showMessage(`+${plant.reward} золота!`);
}

function buySeed(plantType) {
    const plant = plants[plantType];
    
    if (gameState.gold >= plant.cost) {
        const emptyPlot = gameState.plots.find(p => !p.plant);
        if (emptyPlot) {
            gameState.gold -= plant.cost;
            emptyPlot.plant = plantType;
            emptyPlot.growthTime = plant.baseTime;
            showMessage(`Посажено: ${plantType}`);
        } else {
            showMessage('Нет свободных грядок!');
        }
    } else {
        showMessage('Недостаточно золота!');
    }
    updateUI();
}

function buyUpgrade() {
    if (gameState.gold >= 100) {
        gameState.gold -= 100;
        gameState.shovelPower += 1;
        showMessage('Лопата улучшена!');
        updateUI();
    } else {
        showMessage('Нужно 100 золота!');
    }
}

function showMessage(text) {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
    `;
    msg.textContent = text;
    document.body.appendChild(msg);
    
    setTimeout(() => msg.remove(), 2000);
}

// Автоматическое восстановление энергии
setInterval(() => {
    if (gameState.energy < 100) {
        gameState.energy = Math.min(100, gameState.energy + 1);
        updateUI();
    }
}, 3000);

// Запуск игры
updateUI();