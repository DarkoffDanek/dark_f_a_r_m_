// farm.js - Управление грядками и выращиванием
export class FarmManager {
    constructor(game) {
        this.game = game;
        this.plots = [];
        this.initialPlots = 3;
        this.maxPlots = 31;
        this.plotPrice = 25;
    }

    // Загрузка состояния фермы
    loadFromData(data) {
        this.plots = data.plots || [];
        if (this.plots.length === 0) {
            for (let i = 0; i < this.initialPlots; i++) {
                this.addNewPlot();
            }
        }
    }

    // Добавление новой грядки
    addNewPlot() {
        if (this.plots.length < this.maxPlots) {
            this.plots.push({
                planted: false,
                growth: 0,
                clicks: 0,
                type: null,
                growthMethod: null,
                plantTime: null,
                totalGrowthTime: 0,
                remainingTime: 0
            });
            return true;
        }
        return false;
    }

    // Посадка семян
    plantSeed(plotIndex, seedType) {
        if (this.game.seedsInventory[seedType] > 0 && !this.plots[plotIndex].planted) {
            const seedData = this.game.seedTypes[seedType];
            
            this.plots[plotIndex].planted = true;
            this.plots[plotIndex].growth = 0;
            this.plots[plotIndex].clicks = 0;
            this.plots[plotIndex].type = seedType;
            this.plots[plotIndex].growthMethod = null;
            this.plots[plotIndex].plantTime = Date.now();
            this.plots[plotIndex].totalGrowthTime = seedData.time;
            this.plots[plotIndex].remainingTime = seedData.time;
            
            this.game.seedsInventory[seedType]--;
            return true;
        }
        return false;
    }

    // Сбор урожая
    harvest(plotIndex) {
        const plot = this.plots[plotIndex];
        if (plot.planted && plot.growth >= 100) {
            const seedType = plot.type;
            const seedData = this.game.seedTypes[seedType];
            
            // Добавляем урожай в инвентарь
            if (!this.game.harvestInventory[seedType]) {
                this.game.harvestInventory[seedType] = 0;
            }
            this.game.harvestInventory[seedType]++;
            
            // Проверяем выпадение семян
            const seedDrop = this.getRandomSeedDrop(seedType);
            if (seedDrop > 0) {
                if (!this.game.seedsInventory[seedType]) {
                    this.game.seedsInventory[seedType] = 0;
                }
                this.game.seedsInventory[seedType] += seedDrop;
                this.game.showDropMessage(seedData.emoji, seedData.name, seedDrop);
            }
            
            // Сбрасываем грядку
            plot.planted = false;
            plot.growth = 0;
            plot.clicks = 0;
            plot.type = null;
            plot.growthMethod = null;
            plot.plantTime = null;
            plot.totalGrowthTime = 0;
            plot.remainingTime = 0;
            
            return true;
        }
        return false;
    }

    // Клик по растению для ускорения роста
    clickCrop(plotIndex) {
        const plot = this.plots[plotIndex];
        if (plot.planted && plot.growth < 100) {
            plot.clicks++;
            
            if (plot.remainingTime > 3000) {
                plot.remainingTime -= 3000;
                
                const progressFromTime = 100 - (plot.remainingTime / plot.totalGrowthTime * 100);
                const progressFromClicks = (plot.clicks / this.game.seedTypes[plot.type].clicks) * 100;
                
                plot.growth = Math.max(progressFromTime, progressFromClicks);
                
                if (plot.growth > 100) plot.growth = 100;
            } else {
                plot.growth = 100;
                plot.remainingTime = 0;
            }
            
            plot.plantTime = Date.now() - (plot.growth / 100) * plot.totalGrowthTime;
            
            // Анимация клика
            const plotElement = document.querySelectorAll('.plot')[plotIndex];
            if (plotElement) {
                plotElement.classList.add('clicked');
                setTimeout(() => {
                    plotElement.classList.remove('clicked');
                }, 300);
            }
            
            return true;
        }
        return false;
    }

    // Рост растений со временем
    growCrops(deltaTime) {
        this.plots.forEach(plot => {
            if (plot.planted && plot.growth < 100) {
                if (plot.growthMethod === null) {
                    plot.growthMethod = 'time';
                }
                
                if (plot.growthMethod === 'time') {
                    plot.remainingTime = Math.max(0, plot.remainingTime - (deltaTime * 1000));
                    plot.growth = 100 - (plot.remainingTime / plot.totalGrowthTime * 100);
                    if (plot.growth > 100) plot.growth = 100;
                }
            }
        });
    }

    // Обработчик клика по грядке
    handlePlotClick(plotIndex) {
        const plot = this.plots[plotIndex];
        if (plot.planted) {
            if (plot.growth >= 100) {
                this.harvest(plotIndex);
            } else {
                this.clickCrop(plotIndex);
            }
        } else {
            const availableSeeds = Object.keys(this.game.seedsInventory).filter(seed => this.game.seedsInventory[seed] > 0);
            if (availableSeeds.length > 0) {
                const seedToPlant = availableSeeds[0];
                this.plantSeed(plotIndex, seedToPlant);
            } else {
                alert('Нет семян в инвентаре! Купите в магазине.');
            }
        }
    }

    // Случайное выпадение семян
    getRandomSeedDrop(seedType) {
        const seedData = this.game.seedTypes[seedType];
        const dropChance = seedData.dropChance;
        
        if (Math.random() < dropChance) {
            const randomValue = Math.random();
            if (randomValue < 0.4) {
                return 1;
            } else if (randomValue < 0.7) {
                return 2;
            }
        }
        return 0;
    }

    // Отрисовка фермы
    renderFarm() {
        const farmArea = document.getElementById('farmArea');
        if (!farmArea) return;
        
        farmArea.innerHTML = '';
        
        this.plots.forEach((plot, index) => {
            const plotElement = document.createElement('div');
            plotElement.className = 'plot';
            plotElement.onclick = () => this.handlePlotClick(index);
            
            if (plot.planted) {
                const seedData = this.game.seedTypes[plot.type];
                if (plot.growth >= 100) {
                    plotElement.textContent = seedData.emoji;
                    plotElement.className = 'plot ready';
                } else {
                    const growthStage = Math.floor(plot.growth / 25);
                    const stages = ['🌱', '🪴', '🌿', seedData.emoji];
                    plotElement.textContent = stages[growthStage] || stages[0];
                    plotElement.className = 'plot growing';
                }
            } else {
                plotElement.textContent = '🟫';
                plotElement.className = 'plot';
            }
            
            farmArea.appendChild(plotElement);
        });
    }

    // Обновление отображения грядок
    updateDisplay() {
        const plotElements = document.querySelectorAll('.plot');
        this.plots.forEach((plot, index) => {
            const plotElement = plotElements[index];
            if (!plotElement) return;
            
            if (plot.planted) {
                const seedData = this.game.seedTypes[plot.type];
                
                if (plot.growth >= 100) {
                    plotElement.textContent = seedData.emoji;
                    plotElement.style.background = '#4a2d5a';
                    plotElement.className = 'plot ready';
                } else {
                    const growthStage = Math.floor(plot.growth / 25);
                    const stages = ['🌱', '🪴', '🌿', seedData.emoji];
                    plotElement.textContent = stages[growthStage] || stages[0];
                    plotElement.style.background = '#2d5a2d';
                    plotElement.className = 'plot growing';
                }
            } else {
                plotElement.textContent = '🟫';
                plotElement.style.background = '#0f3460';
                plotElement.className = 'plot';
            }
        });
    }

    // Получение данных для сохранения
    getSaveData() {
        return {
            plots: this.plots
        };
    }
}
