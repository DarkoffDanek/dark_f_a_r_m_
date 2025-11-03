// shop.js - Управление магазином и инвентарем
class ShopManager {
    constructor(game) {
        this.game = game;
        this.shopOpen = false;
        this.inventoryOpen = false;
        this.shopCounters = {};
        this.exchangeCounter = 1;
        this.plotCounter = 1;
        this.sellCounters = {};
        
        // Инициализация счетчиков
        Object.keys(this.game.seedTypes).forEach(seedType => {
            this.shopCounters[seedType] = 1;
            this.sellCounters[seedType] = 1;
        });
    }

    loadFromData(data) {
        this.shopCounters = data.shopCounters || {};
        this.exchangeCounter = data.exchangeCounter || 1;
        this.plotCounter = data.plotCounter || 1;
        this.sellCounters = data.sellCounters || {};
        
        // Инициализация недостающих счетчиков
        Object.keys(this.game.seedTypes).forEach(seedType => {
            if (!this.shopCounters[seedType]) this.shopCounters[seedType] = 1;
            if (!this.sellCounters[seedType]) this.sellCounters[seedType] = 1;
        });
    }

    getSaveData() {
        return {
            shopCounters: this.shopCounters,
            exchangeCounter: this.exchangeCounter,
            plotCounter: this.plotCounter,
            sellCounters: this.sellCounters
        };
    }

    // ========== МАГАЗИН ==========

    initShop() {
        const shopItems = document.getElementById('shopItems');
        if (!shopItems) return;
        
        shopItems.innerHTML = '';
        
        // ОБМЕН ВАЛЮТЫ
        const exchangeRate = 5;
        const exchangeAmount = 1;
        const exchangeTotalCost = exchangeAmount * this.exchangeCounter;
        const exchangeTotalGain = exchangeAmount * exchangeRate * this.exchangeCounter;
        const maxExchange = Math.floor(this.game.souls / exchangeAmount);
        const canExchange = this.game.souls >= exchangeTotalCost;
        
        const exchangeShopItem = document.createElement('div');
        exchangeShopItem.className = 'shop-item exchange-shop-item';
        
        exchangeShopItem.innerHTML = `
            <div class="item-emoji">💱</div>
            <div class="item-name">Обмен валюты</div>
            <div class="item-price">${exchangeAmount} душ → ${exchangeAmount * exchangeRate} эссенции</div>
            <div class="item-growth">Курс: 1 душа = ${exchangeRate} эссенции</div>
            <div class="item-description">Обменяйте души на эссенцию для покупки семян</div>
            
            <div class="quantity-controls">
                <div class="quantity-info">
                    <span>Количество: </span>
                    <span class="quantity-total">${exchangeTotalCost} душ → ${exchangeTotalGain} эссенции</span>
                </div>
                <div class="quantity-buttons">
                    <button class="quantity-btn" onclick="game.decrementExchange()">-</button>
                    <input type="number" 
                           class="quantity-input" 
                           id="quantity-exchange" 
                           value="${this.exchangeCounter}" 
                           min="1" 
                           max="${maxExchange}" 
                           onchange="game.updateExchangeFromInput()">
                    <button class="quantity-btn" onclick="game.incrementExchange()">+</button>
                    <button class="quantity-max-btn" onclick="game.setMaxExchange()">MAX</button>
                </div>
                <div class="quantity-hint" id="hint-exchange">
                    Можно обменять: ${maxExchange} раз
                </div>
            </div>
            
            <button class="buy-btn" onclick="game.buyEssence()" 
                    ${!canExchange ? 'disabled' : ''}>
                Обменять ${this.exchangeCounter} раз за ${exchangeTotalCost} душ
            </button>
        `;
        shopItems.appendChild(exchangeShopItem);
        
        // ПОКУПКА ГРЯДОК
        const plotTotalCost = this.game.farm.plotPrice * this.plotCounter;
        const maxPlotsToBuy = Math.min(
            Math.floor(this.game.souls / this.game.farm.plotPrice),
            this.game.farm.maxPlots - this.game.farm.plots.length
        );
        const canBuyPlot = this.game.souls >= plotTotalCost && this.game.farm.plots.length + this.plotCounter <= this.game.farm.maxPlots;
        
        const plotShopItem = document.createElement('div');
        plotShopItem.className = 'shop-item plot-shop-item';
        
        plotShopItem.innerHTML = `
            <div class="item-emoji">🟫</div>
            <div class="item-name">Дополнительная грядка</div>
            <div class="item-price">Цена: ${this.game.farm.plotPrice} душ</div>
            <div class="item-growth">Грядок: ${this.game.farm.plots.length}/${this.game.farm.maxPlots}</div>
            <div class="item-description">Увеличьте площадь вашей фермы</div>
            
            <div class="quantity-controls">
                <div class="quantity-info">
                    <span>Количество: </span>
                    <span class="quantity-total">${plotTotalCost} душ</span>
                </div>
                <div class="quantity-buttons">
                    <button class="quantity-btn" onclick="game.decrementPlot()">-</button>
                    <input type="number" 
                           class="quantity-input" 
                           id="quantity-plot" 
                           value="${this.plotCounter}" 
                           min="1" 
                           max="${maxPlotsToBuy}" 
                           onchange="game.updatePlotFromInput()">
                    <button class="quantity-btn" onclick="game.incrementPlot()">+</button>
                    <button class="quantity-max-btn" onclick="game.setMaxPlot()">MAX</button>
                </div>
                <div class="quantity-hint" id="hint-plot">
                    Можно купить: ${maxPlotsToBuy} грядок
                </div>
            </div>
            
            <button class="buy-btn" onclick="game.buyPlot()" 
                    ${!canBuyPlot ? 'disabled' : ''}>
                ${this.game.farm.plots.length + this.plotCounter >= this.game.farm.maxPlots ? 'Максимум' : `Купить ${this.plotCounter} грядок за ${plotTotalCost} душ`}
            </button>
        `;
        shopItems.appendChild(plotShopItem);
        
        // Семена
        Object.entries(this.game.seedTypes).forEach(([seedType, seedData]) => {
            const shopItem = document.createElement('div');
            shopItem.className = `shop-item ${seedData.buyPrice > 100 ? 'expensive' : 'cheap'}`;
            
            const currentCount = this.shopCounters[seedType] || 1;
            const totalPrice = seedData.buyPrice * currentCount;
            const canAfford = this.game.darkEssence >= totalPrice;
            const maxAffordable = Math.floor(this.game.darkEssence / seedData.buyPrice);
            
            shopItem.innerHTML = `
                <div class="item-emoji">${seedData.emoji}</div>
                <div class="item-name">${seedData.name}</div>
                <div class="item-price">Цена: ${seedData.buyPrice} эссенции</div>
                <div class="item-sell-price">Продажа урожая: ${seedData.baseSellPrice} душ</div>
                <div class="item-growth">Рост: ${seedData.time/1000}сек | Шанс семян: ${Math.round(seedData.dropChance * 100)}%</div>
                <div class="item-description">${seedData.description}</div>
                
                <div class="quantity-controls">
                    <div class="quantity-info">
                        <span>Количество: </span>
                        <span class="quantity-total">${totalPrice} эссенции</span>
                    </div>
                    <div class="quantity-buttons">
                        <button class="quantity-btn" onclick="game.decrementQuantity('${seedType}')">-</button>
                        <input type="number" 
                               class="quantity-input" 
                               id="quantity-${seedType}" 
                               value="${currentCount}" 
                               min="1" 
                               max="${maxAffordable}" 
                               onchange="game.updateQuantityFromInput('${seedType}')">
                        <button class="quantity-btn" onclick="game.incrementQuantity('${seedType}')">+</button>
                        <button class="quantity-max-btn" onclick="game.setMaxQuantity('${seedType}')">MAX</button>
                    </div>
                    <div class="quantity-hint" id="hint-${seedType}">
                        Можно купить: ${maxAffordable} шт
                    </div>
                </div>
                
                <button class="buy-btn" onclick="game.buySeed('${seedType}')" 
                        ${!canAfford ? 'disabled' : ''}>
                    Купить ${currentCount} семян за ${totalPrice} эссенции
                </button>
            `;
            
            shopItems.appendChild(shopItem);
        });
    }

    buySeed(seedType) {
        const seedData = this.game.seedTypes[seedType];
        const quantity = this.shopCounters[seedType] || 1;
        const totalPrice = seedData.buyPrice * quantity;
        
        if (this.game.darkEssence >= totalPrice) {
            this.game.darkEssence -= totalPrice;
            
            if (!this.game.seedsInventory[seedType]) {
                this.game.seedsInventory[seedType] = 0;
            }
            this.game.seedsInventory[seedType] += quantity;
            
            this.shopCounters[seedType] = 1;
            
            this.game.updateDisplay();
            this.initShop();
            this.updateInventoryDisplay();
            this.game.saveToLocalStorage();
            
            this.game.showPurchaseMessage(seedData.emoji, seedData.name, quantity, totalPrice);
            return true;
        }
        return false;
    }

    buyEssence() {
        const exchangeRate = 5;
        const exchangeAmount = 1;
        const totalCost = exchangeAmount * this.exchangeCounter;
        const totalGain = exchangeAmount * exchangeRate * this.exchangeCounter;
        
        if (this.game.souls >= totalCost) {
            this.game.souls -= totalCost;
            this.game.darkEssence += totalGain;
            
            this.exchangeCounter = 1;
            
            this.game.updateDisplay();
            this.initShop();
            this.game.saveToLocalStorage();
            
            this.game.showMessage('💱', `Обменяно ${totalCost} душ на ${totalGain} эссенции!`, 'success');
            return true;
        }
        return false;
    }

    buyPlot() {
        const totalCost = this.game.farm.plotPrice * this.plotCounter;
        
        if (this.game.souls >= totalCost && this.game.farm.plots.length + this.plotCounter <= this.game.farm.maxPlots) {
            this.game.souls -= totalCost;
            
            for (let i = 0; i < this.plotCounter; i++) {
                this.game.farm.addNewPlot();
            }
            
            this.plotCounter = 1;
            
            this.game.farm.renderFarm();
            this.initShop();
            this.game.updateDisplay();
            this.game.saveToLocalStorage();
            
            this.game.showMessage('🟫', `Куплено ${this.plotCounter} грядок за ${totalCost} душ!`, 'success');
            return true;
        } else if (this.game.farm.plots.length + this.plotCounter > this.game.farm.maxPlots) {
            alert('Достигнут максимум грядок!');
        }
        return false;
    }

    // ========== УПРАВЛЕНИЕ КОЛИЧЕСТВОМ В МАГАЗИНЕ ==========

    incrementQuantity(seedType) {
        const maxAffordable = Math.floor(this.game.darkEssence / this.game.seedTypes[seedType].buyPrice);
        const currentCount = this.shopCounters[seedType] || 1;
        
        if (currentCount < maxAffordable) {
            this.shopCounters[seedType] = currentCount + 1;
            this.updateShopItem(seedType);
        }
    }

    decrementQuantity(seedType) {
        const currentCount = this.shopCounters[seedType] || 1;
        if (currentCount > 1) {
            this.shopCounters[seedType] = currentCount - 1;
            this.updateShopItem(seedType);
        }
    }

    setMaxQuantity(seedType) {
        const maxAffordable = Math.floor(this.game.darkEssence / this.game.seedTypes[seedType].buyPrice);
        if (maxAffordable > 0) {
            this.shopCounters[seedType] = maxAffordable;
            this.updateShopItem(seedType);
        }
    }

    updateQuantityFromInput(seedType) {
        const input = document.getElementById(`quantity-${seedType}`);
        const maxAffordable = Math.floor(this.game.darkEssence / this.game.seedTypes[seedType].buyPrice);
        let value = parseInt(input.value) || 1;
        
        if (value < 1) value = 1;
        if (value > maxAffordable) value = maxAffordable;
        
        this.shopCounters[seedType] = value;
        this.updateShopItem(seedType);
    }

    updateShopItem(seedType) {
        const seedData = this.game.seedTypes[seedType];
        const currentCount = this.shopCounters[seedType] || 1;
        const totalPrice = seedData.buyPrice * currentCount;
        const maxAffordable = Math.floor(this.game.darkEssence / seedData.buyPrice);
        const canAfford = this.game.darkEssence >= totalPrice;
        
        const input = document.getElementById(`quantity-${seedType}`);
        if (input) {
            input.value = currentCount;
            input.max = maxAffordable;
        }
        
        const hint = document.getElementById(`hint-${seedType}`);
        if (hint) {
            hint.textContent = `Можно купить: ${maxAffordable} шт`;
            hint.style.color = maxAffordable > 0 ? '#4CAF50' : '#f44336';
        }
        
        const shopItem = document.querySelector(`#quantity-${seedType}`)?.closest('.shop-item');
        if (shopItem) {
            const totalElement = shopItem.querySelector('.quantity-total');
            if (totalElement) {
                totalElement.textContent = `${totalPrice} эссенции`;
            }
            
            const button = shopItem.querySelector('.buy-btn');
            if (button) {
                button.textContent = `Купить ${currentCount} семян за ${totalPrice} эссенции`;
                button.disabled = !canAfford;
            }
        }
    }

    // ========== УПРАВЛЕНИЕ ОБМЕНОМ ВАЛЮТЫ ==========

    incrementExchange() {
        const exchangeAmount = 1;
        const maxAffordable = Math.floor(this.game.souls / exchangeAmount);
        if (this.exchangeCounter < maxAffordable) {
            this.exchangeCounter++;
            this.updateShopExchange();
        }
    }

    decrementExchange() {
        if (this.exchangeCounter > 1) {
            this.exchangeCounter--;
            this.updateShopExchange();
        }
    }

    setMaxExchange() {
        const exchangeAmount = 1;
        const maxAffordable = Math.floor(this.game.souls / exchangeAmount);
        if (maxAffordable > 0) {
            this.exchangeCounter = maxAffordable;
            this.updateShopExchange();
        }
    }

    updateExchangeFromInput() {
        const exchangeAmount = 1;
        const input = document.getElementById('quantity-exchange');
        const maxAffordable = Math.floor(this.game.souls / exchangeAmount);
        let value = parseInt(input.value) || 1;
        
        if (value < 1) value = 1;
        if (value > maxAffordable) value = maxAffordable;
        
        this.exchangeCounter = value;
        this.updateShopExchange();
    }

    updateShopExchange() {
        const exchangeRate = 5;
        const exchangeAmount = 1;
        const totalCost = exchangeAmount * this.exchangeCounter;
        const totalGain = exchangeAmount * exchangeRate * this.exchangeCounter;
        const maxAffordable = Math.floor(this.game.souls / exchangeAmount);
        const canAfford = this.game.souls >= totalCost;
        
        const input = document.getElementById('quantity-exchange');
        if (input) {
            input.value = this.exchangeCounter;
            input.max = maxAffordable;
        }
        
        const hint = document.getElementById('hint-exchange');
        if (hint) {
            hint.textContent = `Можно обменять: ${maxAffordable} раз`;
            hint.style.color = maxAffordable > 0 ? '#4CAF50' : '#f44336';
        }
        
        const shopItem = document.querySelector('.exchange-shop-item');
        if (shopItem) {
            const totalElement = shopItem.querySelector('.quantity-total');
            if (totalElement) {
                totalElement.textContent = `${totalCost} душ → ${totalGain} эссенции`;
            }
            
            const button = shopItem.querySelector('.buy-btn');
            if (button) {
                button.textContent = `Обменять ${this.exchangeCounter} раз за ${totalCost} душ`;
                button.disabled = !canAfford;
            }
        }
    }

    // ========== УПРАВЛЕНИЕ ПОКУПКОЙ ГРЯДОК ==========

    incrementPlot() {
        const maxAffordableBySouls = Math.floor(this.game.souls / this.game.farm.plotPrice);
        const maxByPlots = this.game.farm.maxPlots - this.game.farm.plots.length;
        const maxAffordable = Math.min(maxAffordableBySouls, maxByPlots);
        
        if (this.plotCounter < maxAffordable) {
            this.plotCounter++;
            this.updateShopPlot();
        }
    }

    decrementPlot() {
        if (this.plotCounter > 1) {
            this.plotCounter--;
            this.updateShopPlot();
        }
    }

    setMaxPlot() {
        const maxAffordableBySouls = Math.floor(this.game.souls / this.game.farm.plotPrice);
        const maxByPlots = this.game.farm.maxPlots - this.game.farm.plots.length;
        const maxAffordable = Math.min(maxAffordableBySouls, maxByPlots);
        
        if (maxAffordable > 0) {
            this.plotCounter = maxAffordable;
            this.updateShopPlot();
        }
    }

    updatePlotFromInput() {
        const input = document.getElementById('quantity-plot');
        const maxAffordableBySouls = Math.floor(this.game.souls / this.game.farm.plotPrice);
        const maxByPlots = this.game.farm.maxPlots - this.game.farm.plots.length;
        const maxAffordable = Math.min(maxAffordableBySouls, maxByPlots);
        let value = parseInt(input.value) || 1;
        
        if (value < 1) value = 1;
        if (value > maxAffordable) value = maxAffordable;
        
        this.plotCounter = value;
        this.updateShopPlot();
    }

    updateShopPlot() {
        const totalCost = this.game.farm.plotPrice * this.plotCounter;
        const maxAffordableBySouls = Math.floor(this.game.souls / this.game.farm.plotPrice);
        const maxByPlots = this.game.farm.maxPlots - this.game.farm.plots.length;
        const maxAffordable = Math.min(maxAffordableBySouls, maxByPlots);
        const canAfford = this.game.souls >= totalCost && this.plotCounter <= maxByPlots;
        
        const input = document.getElementById('quantity-plot');
        if (input) {
            input.value = this.plotCounter;
            input.max = maxAffordable;
        }
        
        const hint = document.getElementById('hint-plot');
        if (hint) {
            hint.textContent = `Можно купить: ${maxAffordable} грядок`;
            hint.style.color = maxAffordable > 0 ? '#4CAF50' : '#f44336';
        }
        
        const shopItem = document.querySelector('.plot-shop-item');
        if (shopItem) {
            const totalElement = shopItem.querySelector('.quantity-total');
            if (totalElement) {
                totalElement.textContent = `${totalCost} душ`;
            }
            
            const button = shopItem.querySelector('.buy-btn');
            if (button) {
                const isMax = this.game.farm.plots.length + this.plotCounter >= this.game.farm.maxPlots;
                button.textContent = isMax ? 
                    'Максимум' : 
                    `Купить ${this.plotCounter} грядок за ${totalCost} душ`;
                button.disabled = !canAfford || isMax;
            }
        }
    }

    // ========== ИНВЕНТАРЬ ==========

    updateInventoryDisplay() {
        const inventoryItems = document.getElementById('inventoryItems');
        if (!inventoryItems) return;
        
        inventoryItems.innerHTML = '';
        
        // Секция семян
        let hasSeeds = false;
        const seedsSection = document.createElement('div');
        seedsSection.className = 'inventory-section';
        seedsSection.innerHTML = '<h4>📦 Семена</h4>';
        
        Object.entries(this.game.seedsInventory).forEach(([seedType, count]) => {
            if (count > 0) {
                hasSeeds = true;
                const seedData = this.game.seedTypes[seedType];
                const seedItem = document.createElement('div');
                seedItem.className = 'inventory-item seed-item';
                
                seedItem.innerHTML = `
                    <div class="item-emoji">${seedData.emoji}</div>
                    <div class="item-name">${seedData.name}</div>
                    <div class="item-count">Семян: ${count}</div>
                    <div class="item-info">Посадите чтобы вырастить</div>
                `;
                
                seedsSection.appendChild(seedItem);
            }
        });
        
        if (hasSeeds) {
            inventoryItems.appendChild(seedsSection);
        }
        
        // Секция урожая
        let hasHarvest = false;
        const harvestSection = document.createElement('div');
        harvestSection.className = 'inventory-section';
        harvestSection.innerHTML = '<h4>🌿 Урожай (для продажи или котла)</h4>';
        
        Object.entries(this.game.harvestInventory).forEach(([seedType, count]) => {
            if (count > 0) {
                hasHarvest = true;
                const seedData = this.game.seedTypes[seedType];
                const sellCount = this.sellCounters[seedType] || 1;
                const totalPrice = seedData.baseSellPrice * sellCount;
                const canSell = count >= sellCount;
                
                const harvestItem = document.createElement('div');
                harvestItem.className = 'inventory-item harvest-item';
                
                harvestItem.innerHTML = `
                    <div class="item-emoji">${seedData.emoji}</div>
                    <div class="item-name">${seedData.name}</div>
                    <div class="item-count">Урожая: ${count}</div>
                    <div class="item-sell-price">Цена за шт: ${seedData.baseSellPrice} душ</div>
                    
                    <div class="quantity-controls">
                        <div class="quantity-info">
                            <span>Продать: </span>
                            <span class="quantity-total">${totalPrice} душ</span>
                        </div>
                        <div class="quantity-buttons">
                            <button class="quantity-btn" onclick="game.decrementSell('${seedType}')">-</button>
                            <input type="number" 
                                   class="quantity-input" 
                                   id="sell-quantity-${seedType}" 
                                   value="${sellCount}" 
                                   min="1" 
                                   max="${count}" 
                                   onchange="game.updateSellFromInput('${seedType}')">
                            <button class="quantity-btn" onclick="game.incrementSell('${seedType}')">+</button>
                            <button class="quantity-max-btn" onclick="game.setMaxSell('${seedType}')">MAX</button>
                        </div>
                    </div>
                    
                    <button class="sell-btn" onclick="game.sellHarvest('${seedType}')" 
                            ${!canSell ? 'disabled' : ''}>
                        Продать ${sellCount} шт за ${totalPrice} душ
                    </button>
                `;
                
                harvestSection.appendChild(harvestItem);
            }
        });
        
        if (hasHarvest) {
            inventoryItems.appendChild(harvestSection);
        }
        
        // Секция эликсиров
        let hasElixirs = false;
        const elixirsSection = document.createElement('div');
        elixirsSection.className = 'inventory-section';
        elixirsSection.innerHTML = '<h4>🧪 Эликсиры (из котла)</h4>';
        
        Object.entries(this.game.elixirInventory).forEach(([elixirType, count]) => {
            if (count > 0) {
                hasElixirs = true;
                const elixirData = this.game.elixirRecipes[elixirType];
                const sellCount = this.sellCounters[elixirType] || 1;
                const totalPrice = elixirData.baseSellPrice * sellCount;
                const canSell = count >= sellCount;
                
                const elixirItem = document.createElement('div');
                elixirItem.className = 'inventory-item';
                elixirItem.style.background = 'linear-gradient(135deg, #5a2d5a, #7c4a7c)';
                
                elixirItem.innerHTML = `
                    <div class="item-emoji">${elixirData.emoji}</div>
                    <div class="item-name">${elixirData.name}</div>
                    <div class="item-count">Эликсиров: ${count}</div>
                    <div class="item-sell-price">Цена за шт: ${elixirData.baseSellPrice} душ</div>
                    <div class="item-description">${elixirData.description}</div>
                    
                    <div class="quantity-controls">
                        <div class="quantity-info">
                            <span>Продать: </span>
                            <span class="quantity-total">${totalPrice} душ</span>
                        </div>
                        <div class="quantity-buttons">
                            <button class="quantity-btn" onclick="game.decrementSell('${elixirType}')">-</button>
                            <input type="number" 
                                   class="quantity-input" 
                                   id="sell-quantity-${elixirType}" 
                                   value="${sellCount}" 
                                   min="1" 
                                   max="${count}" 
                                   onchange="game.updateSellFromInput('${elixirType}')">
                            <button class="quantity-btn" onclick="game.incrementSell('${elixirType}')">+</button>
                            <button class="quantity-max-btn" onclick="game.setMaxSell('${elixirType}')">MAX</button>
                        </div>
                    </div>
                    
                    <button class="sell-btn" onclick="game.sellElixir('${elixirType}')" 
                            ${!canSell ? 'disabled' : ''}>
                        Продать ${sellCount} шт за ${totalPrice} душ
                    </button>
                `;
                
                elixirsSection.appendChild(elixirItem);
            }
        });
        
        if (hasElixirs) {
            inventoryItems.appendChild(elixirsSection);
        }
        
        if (!hasSeeds && !hasHarvest && !hasElixirs) {
            inventoryItems.innerHTML = '<div class="empty-inventory">Инвентарь пуст</div>';
        }
    }

    // ========== УПРАВЛЕНИЕ ПРОДАЖЕЙ ==========

    incrementSell(seedType) {
        const max = this.game.harvestInventory[seedType] || 0;
        const current = this.sellCounters[seedType] || 1;
        if (current < max) {
            this.sellCounters[seedType] = current + 1;
            this.updateInventoryDisplay();
        }
    }

    decrementSell(seedType) {
        const current = this.sellCounters[seedType] || 1;
        if (current > 1) {
            this.sellCounters[seedType] = current - 1;
            this.updateInventoryDisplay();
        }
    }

    setMaxSell(seedType) {
        const max = this.game.harvestInventory[seedType] || 0;
        if (max > 0) {
            this.sellCounters[seedType] = max;
            this.updateInventoryDisplay();
        }
    }

    updateSellFromInput(seedType) {
        const input = document.getElementById(`sell-quantity-${seedType}`);
        const max = this.game.harvestInventory[seedType] || 0;
        let value = parseInt(input.value) || 1;
        if (value < 1) value = 1;
        if (value > max) value = max;
        this.sellCounters[seedType] = value;
        this.updateInventoryDisplay();
    }

    sellHarvest(seedType) {
        const sellCount = this.sellCounters[seedType] || 1;
        const seedData = this.game.seedTypes[seedType];
        
        if (this.game.harvestInventory[seedType] >= sellCount) {
            const totalPrice = seedData.baseSellPrice * sellCount;
            this.game.souls += totalPrice;
            this.game.harvestInventory[seedType] -= sellCount;
            
            this.sellCounters[seedType] = 1;
            
            this.game.updateDisplay();
            this.updateInventoryDisplay();
            this.game.saveToLocalStorage();
            
            this.game.showMessage('💰', `Продано ${sellCount} урожая ${seedData.name} за ${totalPrice} душ!`, 'success');
            return true;
        }
        return false;
    }

    sellElixir(elixirType) {
        const sellCount = this.sellCounters[elixirType] || 1;
        const elixirData = this.game.elixirRecipes[elixirType];
        
        if (this.game.elixirInventory[elixirType] >= sellCount) {
            const totalPrice = elixirData.baseSellPrice * sellCount;
            this.game.souls += totalPrice;
            this.game.elixirInventory[elixirType] -= sellCount;
            
            this.sellCounters[elixirType] = 1;
            
            this.game.updateDisplay();
            this.updateInventoryDisplay();
            this.game.saveToLocalStorage();
            
            this.game.showMessage('💰', `Продано ${sellCount} эликсира ${elixirData.name} за ${totalPrice} душ!`, 'success');
            return true;
        }
        return false;
    }

    // ========== ИНТЕРФЕЙС ==========

    toggleShop() {
        this.shopOpen = !this.shopOpen;
        const shop = document.getElementById('shop');
        if (shop) {
            shop.classList.toggle('hidden', !this.shopOpen);
        }
        
        if (this.shopOpen) {
            this.initShop();
        }
        
        if (this.shopOpen && this.inventoryOpen) {
            this.toggleInventory();
        }
    }

    toggleInventory() {
        this.inventoryOpen = !this.inventoryOpen;
        const inventory = document.getElementById('inventory');
        if (inventory) {
            inventory.classList.toggle('hidden', !this.inventoryOpen);
        }
        
        if (this.inventoryOpen) {
            this.updateInventoryDisplay();
        }
        
        if (this.inventoryOpen && this.shopOpen) {
            this.toggleShop();
        }
    }
}
