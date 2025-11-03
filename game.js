// game.js - Основной файл игры (модульная версия)
class DarkFarmGame {
    constructor() {
        this.souls = 0;
        this.darkEssence = 100;
        this.seedsInventory = {};
        this.harvestInventory = {};
        this.elixirInventory = {};
        this.shopCounters = {};
        this.exchangeCounter = 1;
        this.plotCounter = 1;
        this.sellCounters = {};
        
        // Состояния интерфейса
        this.shopOpen = false;
        this.inventoryOpen = false;
        
        // Типы семян
        this.seedTypes = {
            'shadow_berry': {
                name: 'Теневая ягода',
                emoji: '🍇',
                time: 20000,
                clicks: 7,
                buyPrice: 10,
                baseSellPrice: 5,
                description: 'Быстрорастущая, но дешёвая',
                dropChance: 0.5
            },
            'ghost_pumpkin': {
                name: 'Призрачная тыква',
                emoji: '🎃',
                time: 50000,
                clicks: 40,
                buyPrice: 25,
                baseSellPrice: 15,
                description: 'Средняя скорость, хорошая цена',
                dropChance: 0.35
            },
            'void_mushroom': {
                name: 'Гриб пустоты',
                emoji: '🍄',
                time: 100000,
                clicks: 300,
                buyPrice: 50,
                baseSellPrice: 28,
                description: 'Растёт медленно, но дорого стоит',
                dropChance: 0.3
            },
            'crystal_flower': {
                name: 'Хрустальный цветок',
                emoji: '🌷',
                time: 800000,
                clicks: 800,
                buyPrice: 80,
                baseSellPrice: 37,
                description: 'Ценный, но требует терпения',
                dropChance: 0.28
            },
            'blood_rose': {
                name: 'Кровавая роза',
                emoji: '🌹',
                time: 5400000,
                clicks: 1800,
                buyPrice: 120,
                baseSellPrice: 60,
                description: 'Очень редкая и дорогая',
                dropChance: 0.15
            }
        };
        
        // Рецепты эликсиров
        this.elixirRecipes = {
            'shadow_berry': {
                name: 'Теневой Нектар',
                emoji: '🍷',
                baseSellPrice: 15,
                description: 'Лёгкий напиток из теневых ягод',
                brewingTime: 15000,
                outputMultiplier: 1
            },
            'ghost_pumpkin': {
                name: 'Призрачный Эликсир',
                emoji: '👻',
                baseSellPrice: 25,
                description: 'Эфирная субстанция из призрачной тыквы',
                brewingTime: 30000,
                outputMultiplier: 1
            },
            'void_mushroom': {
                name: 'Эликсир Пустоты',
                emoji: '⚫',
                baseSellPrice: 45,
                description: 'Концентрированная энергия небытия',
                brewingTime: 60000,
                outputMultiplier: 1
            },
            'crystal_flower': {
                name: 'Кристальный Настой',
                emoji: '💎',
                baseSellPrice: 65,
                description: 'Сияющая жидкость с частицами кристаллов',
                brewingTime: 120000,
                outputMultiplier: 1
            },
            'blood_rose': {
                name: 'Кровавый Отвар',
                emoji: '🩸',
                baseSellPrice: 100,
                description: 'Густая тёмная жидкость с металлическим блеском',
                brewingTime: 240000,
                outputMultiplier: 1
            }
        };
        
        // Инициализация счетчиков магазина
        Object.keys(this.seedTypes).forEach(seedType => {
            this.shopCounters[seedType] = 1;
            this.sellCounters[seedType] = 1;
        });
        
        // Инициализация менеджеров
        this.farm = new FarmManager(this);
        this.cauldron = new CauldronManager(this);
        this.shop = new ShopManager(this);
        
        // Загрузка и инициализация
        this.loadFromLocalStorage();
        this.lastUpdate = Date.now();
        this.startGameLoop();
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('shopToggle').addEventListener('click', () => {
            this.shop.toggleShop();
        });
        
        document.getElementById('inventoryToggle').addEventListener('click', () => {
            this.shop.toggleInventory();
        });

        // Обработчики для модального окна авторизации
        const authModal = document.getElementById('authModal');
        const closeBtn = document.querySelector('.close');
        const authButton = document.getElementById('authButton');
        
        if (authButton) {
            authButton.addEventListener('click', () => {
                authModal.classList.remove('hidden');
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                authModal.classList.add('hidden');
            });
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === authModal) {
                authModal.classList.add('hidden');
            }
        });
    }

    startGameLoop() {
        setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - this.lastUpdate) / 1000;
            this.lastUpdate = now;
            
            this.farm.growCrops(deltaTime);
            this.cauldron.updateProgress();
            this.updateDisplay();
        }, 100);
    }

    updateDisplay() {
        document.getElementById('souls').textContent = `Души: ${this.souls}`;
        document.getElementById('darkEssence').textContent = `Тёмная эссенция: ${this.darkEssence}`;
        this.farm.updateDisplay();
    }

    showMessage(emoji, text, type = 'info') {
        const message = document.createElement('div');
        message.className = 'purchase-message';
        
        if (type === 'success') {
            message.style.background = '#4CAF50';
        } else if (type === 'error') {
            message.style.background = '#f44336';
        } else {
            message.style.background = '#2196F3';
        }
        
        message.innerHTML = `
            <span class="purchase-emoji">${emoji}</span>
            <span class="purchase-text">${text}</span>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 500);
        }, 3000);
    }

    showDropMessage(emoji, name, count) {
        this.showMessage(emoji, `+${count} семян ${name}!`, 'success');
    }

    showPurchaseMessage(emoji, name, quantity, price) {
        this.showMessage(emoji, `Куплено ${quantity} семян ${name} за ${price} эссенции!`, 'success');
    }

    saveToLocalStorage() {
        const gameData = {
            souls: this.souls,
            darkEssence: this.darkEssence,
            seedsInventory: this.seedsInventory,
            harvestInventory: this.harvestInventory,
            elixirInventory: this.elixirInventory,
            shopCounters: this.shopCounters,
            exchangeCounter: this.exchangeCounter,
            plotCounter: this.plotCounter,
            sellCounters: this.sellCounters,
            lastUpdate: Date.now(),
            farm: this.farm.getSaveData(),
            cauldron: this.cauldron.getSaveData(),
            shop: this.shop.getSaveData()
        };
        localStorage.setItem('darkFarm_backup', JSON.stringify(gameData));
    }
    
    loadFromLocalStorage() {
        const saved = localStorage.getItem('darkFarm_backup');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                
                // Загрузка основных данных
                this.souls = gameData.souls || 0;
                this.darkEssence = gameData.darkEssence || 100;
                this.seedsInventory = gameData.seedsInventory || {};
                this.harvestInventory = gameData.harvestInventory || {};
                this.elixirInventory = gameData.elixirInventory || {};
                this.shopCounters = gameData.shopCounters || {};
                this.exchangeCounter = gameData.exchangeCounter || 1;
                this.plotCounter = gameData.plotCounter || 1;
                this.sellCounters = gameData.sellCounters || {};
                
                // Загрузка данных менеджеров
                if (this.farm) this.farm.loadFromData(gameData.farm || {});
                if (this.cauldron) this.cauldron.loadFromData(gameData.cauldron || {});
                if (this.shop) this.shop.loadFromData(gameData.shop || {});
                
                this.lastUpdate = gameData.lastUpdate || Date.now();
                return true;
            } catch (error) {
                console.error('Ошибка загрузки из localStorage:', error);
            }
        }
        return false;
    }

    // Методы для глобального доступа из HTML
    buySeed(seedType) {
        return this.shop.buySeed(seedType);
    }
    
    plantSeed(plotIndex, seedType) {
        return this.farm.plantSeed(plotIndex, seedType);
    }
    
    harvest(plotIndex) {
        return this.farm.harvest(plotIndex);
    }
    
    buyEssence() {
        return this.shop.buyEssence();
    }
    
    buyPlot() {
        return this.shop.buyPlot();
    }
    
    handlePlotClick(plotIndex) {
        return this.farm.handlePlotClick(plotIndex);
    }
    
    clickCrop(plotIndex) {
        return this.farm.clickCrop(plotIndex);
    }
    
    // Методы для управления количеством в магазине
    incrementQuantity(seedType) {
        return this.shop.incrementQuantity(seedType);
    }
    
    decrementQuantity(seedType) {
        return this.shop.decrementQuantity(seedType);
    }
    
    setMaxQuantity(seedType) {
        return this.shop.setMaxQuantity(seedType);
    }
    
    updateQuantityFromInput(seedType) {
        return this.shop.updateQuantityFromInput(seedType);
    }
    
    // Методы для обмена валюты
    incrementExchange() {
        return this.shop.incrementExchange();
    }
    
    decrementExchange() {
        return this.shop.decrementExchange();
    }
    
    setMaxExchange() {
        return this.shop.setMaxExchange();
    }
    
    updateExchangeFromInput() {
        return this.shop.updateExchangeFromInput();
    }
    
    // Методы для покупки грядок
    incrementPlot() {
        return this.shop.incrementPlot();
    }
    
    decrementPlot() {
        return this.shop.decrementPlot();
    }
    
    setMaxPlot() {
        return this.shop.setMaxPlot();
    }
    
    updatePlotFromInput() {
        return this.shop.updatePlotFromInput();
    }
    
    // Методы для продажи
    incrementSell(seedType) {
        return this.shop.incrementSell(seedType);
    }
    
    decrementSell(seedType) {
        return this.shop.decrementSell(seedType);
    }
    
    setMaxSell(seedType) {
        return this.shop.setMaxSell(seedType);
    }
    
    updateSellFromInput(seedType) {
        return this.shop.updateSellFromInput(seedType);
    }
    
    sellHarvest(seedType) {
        return this.shop.sellHarvest(seedType);
    }
    
    sellElixir(elixirType) {
        return this.shop.sellElixir(elixirType);
    }
    
    // Методы для котла
    buyCauldron() {
        return this.cauldron.buyCauldron();
    }
    
    updateCauldronMaxQuantity() {
        return this.cauldron.updateCauldronMaxQuantity();
    }
    
    incrementCauldronQuantity() {
        return this.cauldron.incrementCauldronQuantity();
    }
    
    decrementCauldronQuantity() {
        return this.cauldron.decrementCauldronQuantity();
    }
    
    startBrewing() {
        return this.cauldron.startBrewing();
    }
    
    collectElixir() {
        return this.cauldron.collectElixir();
    }
}

// Инициализация игры
let game;
window.onload = function() {
    // Загружаем модули только если они не загружены
    if (typeof FarmManager === 'undefined') {
        console.error('FarmManager не загружен. Убедитесь, что farm.js подключен.');
        return;
    }
    if (typeof CauldronManager === 'undefined') {
        console.error('CauldronManager не загружен. Убедитесь, что cauldron.js подключен.');
        return;
    }
    if (typeof ShopManager === 'undefined') {
        console.error('ShopManager не загружен. Убедитесь, что shop.js подключен.');
        return;
    }
    
    game = new DarkFarmGame();
    
    // Инициализация интерфейса
    game.shop.initShop();
    game.shop.updateInventoryDisplay();
    game.farm.renderFarm();
    game.cauldron.renderBuildings();
};
