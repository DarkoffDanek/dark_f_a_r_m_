const gameState = {
    souls: 100,
    darkEnergy: 50,
    shovelPower: 1,
    plots: Array(8).fill().map(() => ({
        plant: null,
        progress: 0,
        growthTime: 0
    }))
};

const darkPlants = {
    'shadow-root': {
        name: 'Корень Тени',
        cost: 10,
        reward: 25,
        baseTime: 25
    },
    'blood-fruit': {
        name: 'Плод Крови',
        cost: 20,
        reward: 50,
        baseTime: 40
    },
    'void-blossom': {
        name: 'Цветок Бездны',
        cost: 50,
        reward: 150,
        baseTime: 60
    }
};

function updateUI() {
    document.getElementById('souls').textContent = gameState.souls;
    document.getElementById('darkEnergy').textContent = gameState.darkEnergy;
    document.getElementById('shovelLevel').textContent = gameState.shovelPower;
    
    const farm = document.getElementById('farm');
    farm.innerHTML = '';
    
    gameState.plots.forEach((plot, index) => {
        const plotElement = document.createElement('div');
        plotElement.className = `plot ${plot.plant ? '' : 'empty'}`;
        
        if (plot.plant) {
            plotElement.innerHTML = `
                <div class="plant ${plot.plant}">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(plot.progress/plot.growthTime)*100}%"></div>
                    </div>
                </div>
            `;
        }
        
        plotElement.onclick = () => clickPlot(index);
        farm.appendChild(plotElement);
    });
}

function clickPlot(index) {
    const plot = gameState.plots[index];
    if (!plot.plant) {
        showMessage('🌀 Этот ритуальный круг пуст...', 'info');
        return;
    }
    
    if (gameState.darkEnergy <= 0) {
        showMessage('💀 Недостаточно тёмной энергии!', 'warning');
        return;
    }
    
    gameState.darkEnergy -= 1;
    plot.progress += 5 * gameState.shovelPower;
    
    // Спецэффект при клике
    createClickEffect(event);
    
    if (plot.progress >= plot.growthTime) {
        harvestPlot(index);
    }
    
    updateUI();
}

function createClickEffect(event) {
    const effect = document.createElement('div');
    effect.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #e94560, transparent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${event.clientX - 10}px;
        top: ${event.clientY - 10}px;
        animation: expand 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 500);
}

function harvestPlot(index) {
    const plot = gameState.plots[index];
    const plant = darkPlants[plot.plant];
    
    gameState.souls += plant.reward;
    gameState.darkEnergy = Math.min(100, gameState.darkEnergy + 8);
    
    showMessage(`🌑 Собрано: ${plant.name}! +${plant.reward} душ`, 'success');
    
    plot.plant = null;
    plot.progress = 0;
    
    updateUI();
}

function buySeed(plantType) {
    const plant = darkPlants[plantType];
    
    if (gameState.souls >= plant.cost) {
        const emptyPlotIndex = gameState.plots.findIndex(p => !p.plant);
        if (emptyPlotIndex !== -1) {
            gameState.souls -= plant.cost;
            gameState.plots[emptyPlotIndex].plant = plantType;
            gameState.plots[emptyPlotIndex].growthTime = plant.baseTime;
            showMessage(`🕯️ Посажен: ${plant.name}`, 'success');
        } else {
            showMessage('💀 Все ритуальные круги заняты!', 'warning');
        }
    } else {
        showMessage('💀 Недостаточно душ для ритуала!', 'warning');
    }
    updateUI();
}

function buyUpgrade() {
    if (gameState.souls >= 100) {
        gameState.souls -= 100;
        gameState.shovelPower += 1;
        showMessage('🔮 Сила заклинания увеличена! Тёмная энергия стала эффективнее!', 'success');
        updateUI();
    } else {
        showMessage('💀 Нужно 100 душ для этого тёмного искусства!', 'warning');
    }
}

function sacrificeSouls() {
    if (gameState.souls >= 10) {
        gameState.souls -= 10;
        gameState.darkEnergy = Math.min(100, gameState.darkEnergy + 25);
        showMessage('⚡ Принесено в жертву 10 душ! +25 тёмной энергии', 'info');
        updateUI();
    } else {
        showMessage('💀 Недостаточно душ для жертвоприношения!', 'warning');
    }
}

function showMessage(text, type = 'info') {
    const messages = document.getElementById('messages');
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    
    // Разные цвета для разных типов сообщений
    if (type === 'warning') {
        message.style.background = 'linear-gradient(45deg, #f39c12, #e74c3c)';
    } else if (type === 'success') {
        message.style.background = 'linear-gradient(45deg, #00cec9, #0984e3)';
    }
    
    messages.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideIn 0.5s ease reverse';
        setTimeout(() => message.remove(), 500);
    }, 3000);
}

// Автоматическое восстановление тёмной энергии
setInterval(() => {
    if (gameState.darkEnergy < 100) {
        gameState.darkEnergy = Math.min(100, gameState.darkEnergy + 2);
        updateUI();
    }
}, 4000);

// Случайные события
setInterval(() => {
    if (Math.random() < 0.3 && gameState.souls > 0) {
        const events = [
            { message: '🌙 Лунный свет усиливает вашу тёмную энергию! +10 энергии', energy: 10 },
            { message: '💀 Призрак забрал часть ваших душ! -5 душ', souls: -5 },
            { message: '🔮 Таинственный незнакомец подарил вам души! +15 душ', souls: 15 }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        showMessage(event.message, 'info');
        
        if (event.energy) {
            gameState.darkEnergy = Math.min(100, gameState.darkEnergy + event.energy);
        }
        if (event.souls) {
            gameState.souls = Math.max(0, gameState.souls + event.souls);
        }
        
        updateUI();
    }
}, 15000);

// Добавляем CSS для анимации эффекта клика
const style = document.createElement('style');
style.textContent = `
    @keyframes expand {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Запуск игры
updateUI();
showMessage('🌑 Добро пожаловать на Ферму Бездны! Начни с посадки Корней Тени.', 'info');