// cauldron.js - Управление алхимическим котлом
class CauldronManager {
    constructor(game) {
        this.game = game;
        this.alchemyCauldron = {
            owned: false,
            working: false,
            progress: 0,
            currentRecipe: null,
            startTime: null,
            totalTime: 0,
            inputQuantity: 0,
            outputQuantity: 0,
            endTime: null
        };
    }

    loadFromData(data) {
        if (data.alchemyCauldron) {
            this.alchemyCauldron = { ...this.alchemyCauldron, ...data.alchemyCauldron };
            
            // Восстанавливаем временные метки если процесс был активен
            if (this.alchemyCauldron.working && this.alchemyCauldron.endTime) {
                const now = Date.now();
                if (now >= this.alchemyCauldron.endTime) {
                    // Процесс завершен
                    this.alchemyCauldron.progress = 100;
                } else {
                    // Процесс все еще идет
                    const elapsed = now - this.alchemyCauldron.startTime;
                    this.alchemyCauldron.progress = Math.min(100, (elapsed / this.alchemyCauldron.totalTime) * 100);
                }
            }
        }
    }

    getSaveData() {
        return {
            alchemyCauldron: this.alchemyCauldron
        };
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ КОТЛА ==========

    renderBuildings() {
        const buildingsContainer = document.getElementById('buildingsContainer');
        if (!buildingsContainer) return;
        
        buildingsContainer.innerHTML = '';
    
        const cauldron = document.createElement('div');
        cauldron.className = `cauldron-building ${!this.alchemyCauldron.owned ? 'locked' : ''} ${this.alchemyCauldron.working ? 'working' : ''} ${this.alchemyCauldron.progress >= 100 ? 'ready' : ''}`;
    
        if (!this.alchemyCauldron.owned) {
            // Котел не куплен
            cauldron.innerHTML = `
                <div class="cauldron-emoji">🧪</div>
                <div class="cauldron-name">Алхимический Котёл</div>
                <div class="cauldron-price">Цена: 500 душ</div>
                <div class="cauldron-description">Превращает цветы в магические эликсиры</div>
                <div class="cauldron-stats">Увеличивает стоимость урожая в 1.5-2 раза</div>
                <div class="cauldron-info">Требуется для создания эликсиров</div>
                <button class="cauldron-buy-btn" onclick="game.buyCauldron()" 
                        ${this.game.souls >= 500 ? '' : 'disabled'}>
                    Купить за 500 душ
                </button>
            `;
        } else if (this.alchemyCauldron.working) {
            // Котел работает
            const recipe = this.game.elixirRecipes[this.alchemyCauldron.currentRecipe];
            if (!recipe) return;
            
            const timeLeft = Math.max(0, this.alchemyCauldron.endTime - Date.now());
            const progress = this.alchemyCauldron.progress;
            
            cauldron.innerHTML = `
                <div class="cauldron-emoji">🧪</div>
                <div class="cauldron-name">Алхимический Котёл</div>
                <div class="cauldron-status">🔄 Варится: ${recipe.name}</div>
                
                <div class="cauldron-progress">
                    <div class="cauldron-progress-info">
                        Осталось: ${Math.ceil(timeLeft / 1000)} сек
                    </div>
                    <div class="cauldron-progress-bar">
                        <div class="cauldron-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="cauldron-info">
                    Создаёт: ${this.alchemyCauldron.outputQuantity} эликсира
                </div>
                
                <button class="cauldron-collect-btn" onclick="game.collectElixir()" 
                        ${progress >= 100 ? '' : 'disabled'}>
                    ${progress >= 100 ? '🎁 Забрать эликсир!' : '⏳ Ещё не готово'}
                </button>
            `;
        } else {
            // Котел готов к работе
            const availableRecipes = Object.keys(this.game.elixirRecipes)
                .filter(recipeType => (this.game.harvestInventory[recipeType] || 0) > 0);
            
            cauldron.innerHTML = `
                <div class="cauldron-emoji">🧪</div>
                <div class="cauldron-name">Алхимический Котёл</div>
                <div class="cauldron-status">✅ Готов к работе</div>
                <div class="cauldron-description">Выберите цветы для переработки в эликсир</div>
                
                <div class="cauldron-controls">
                    <div class="cauldron-input-label">Тип цветов:</div>
                    <select class="cauldron-seed-select" id="cauldronRecipeType" onchange="game.updateCauldronMaxQuantity()">
                        <option value="">-- Выберите цветы --</option>
                        ${availableRecipes.map(recipeType => {
                            const recipe = this.game.elixirRecipes[recipeType];
                            const seed = this.game.seedTypes[recipeType];
                            const availableCount = this.game.harvestInventory[recipeType] || 0;
                            return `<option value="${recipeType}">${seed.name} (доступно: ${availableCount}) → ${recipe.name}</option>`;
                        }).join('')}
                    </select>
                    
                    <div class="cauldron-input-label">Количество цветов:</div>
                    <div class="cauldron-quantity">
                        <button class="cauldron-quantity-btn" onclick="game.decrementCauldronQuantity()">-</button>
                        <input type="number" class="cauldron-quantity-input" id="cauldronQuantity" value="1" min="1" max="10" onchange="game.updateCauldronMaxQuantity()">
                        <button class="cauldron-quantity-btn" onclick="game.incrementCauldronQuantity()">+</button>
                    </div>
                </div>
                
                <button class="cauldron-start-btn" onclick="game.startBrewing()" id="startBrewingBtn">
                    Начать варку эликсира
                </button>
            `;
            
            // Обновляем максимальное количество сразу после создания
            setTimeout(() => {
                this.updateCauldronMaxQuantity();
            }, 0);
        }
        
        buildingsContainer.appendChild(cauldron);
    }

    buyCauldron() {
        if (this.game.souls >= 500 && !this.alchemyCauldron.owned) {
            this.game.souls -= 500;
            this.alchemyCauldron.owned = true;
            
            this.game.updateDisplay();
            this.renderBuildings();
            this.game.saveToLocalStorage();
            
            this.game.showMessage('🧪', 'Куплен Алхимический Котёл!', 'success');
            return true;
        }
        return false;
    }

    updateCauldronMaxQuantity() {
        const recipeTypeSelect = document.getElementById('cauldronRecipeType');
        const quantityInput = document.getElementById('cauldronQuantity');
        
        if (!recipeTypeSelect || !quantityInput) {
            return;
        }
        
        const recipeType = recipeTypeSelect.value;
        
        if (recipeType && this.game.harvestInventory[recipeType] !== undefined) {
            const available = this.game.harvestInventory[recipeType] || 0;
            const maxQuantity = Math.min(10, available);
            
            quantityInput.max = maxQuantity;
            
            let currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > maxQuantity) {
                quantityInput.value = maxQuantity;
            } else if (currentValue < 1) {
                quantityInput.value = 1;
            }
            
            // Обновляем состояние кнопки
            const startButton = document.getElementById('startBrewingBtn');
            if (startButton) {
                startButton.disabled = available === 0;
            }
        } else {
            quantityInput.max = 1;
            quantityInput.value = 1;
            
            const startButton = document.getElementById('startBrewingBtn');
            if (startButton) {
                startButton.disabled = true;
            }
        }
    }

    incrementCauldronQuantity() {
        const input = document.getElementById('cauldronQuantity');
        const recipeTypeSelect = document.getElementById('cauldronRecipeType');
        
        if (!input || !recipeTypeSelect) return;
        
        const recipeType = recipeTypeSelect.value;
        if (!recipeType) return;
        
        const maxQuantity = Math.min(10, this.game.harvestInventory[recipeType] || 0);
        let value = parseInt(input.value) || 1;
        
        if (value < maxQuantity) {
            value++;
            input.value = value;
        }
        
        this.updateCauldronMaxQuantity();
    }

    decrementCauldronQuantity() {
        const input = document.getElementById('cauldronQuantity');
        if (!input) return;
        
        let value = parseInt(input.value) || 1;
        
        if (value > 1) {
            value--;
            input.value = value;
        }
        
        this.updateCauldronMaxQuantity();
    }

    startBrewing() {
        const recipeTypeSelect = document.getElementById('cauldronRecipeType');
        const quantityInput = document.getElementById('cauldronQuantity');
        
        if (!recipeTypeSelect || !quantityInput) return;
        
        const recipeType = recipeTypeSelect.value;
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (!recipeType) {
            this.game.showMessage('⚠️', 'Выберите тип цветов для переработки!', 'error');
            return;
        }
        
        if (!this.game.harvestInventory[recipeType] || this.game.harvestInventory[recipeType] < quantity) {
            this.game.showMessage('⚠️', 'Недостаточно выбранных цветов!', 'error');
            return;
        }
        
        // Проверяем, не работает ли уже котел
        if (this.alchemyCauldron.working) {
            this.game.showMessage('⚠️', 'Котёл уже работает! Дождитесь окончания текущей варки.', 'error');
            return;
        }
        
        // Забираем цветы из инвентаря
        this.game.harvestInventory[recipeType] -= quantity;
        
        // Настраиваем процесс варки
        const recipe = this.game.elixirRecipes[recipeType];
        this.alchemyCauldron.working = true;
        this.alchemyCauldron.currentRecipe = recipeType;
        this.alchemyCauldron.progress = 0;
        this.alchemyCauldron.startTime = Date.now();
        this.alchemyCauldron.totalTime = recipe.brewingTime * quantity;
        this.alchemyCauldron.inputQuantity = quantity;
        this.alchemyCauldron.outputQuantity = quantity * recipe.outputMultiplier;
        this.alchemyCauldron.endTime = Date.now() + (recipe.brewingTime * quantity);
        
        this.game.updateDisplay();
        this.renderBuildings();
        this.game.shop.updateInventoryDisplay();
        this.game.saveToLocalStorage();
        
        this.game.showMessage('🔥', `Начата варка ${recipe.name}!`, 'success');
    }

    collectElixir() {
        if (!this.alchemyCauldron.working || this.alchemyCauldron.progress < 100) {
            this.game.showMessage('⚠️', 'Эликсир ещё не готов!', 'error');
            return;
        }
        
        const recipeType = this.alchemyCauldron.currentRecipe;
        const recipe = this.game.elixirRecipes[recipeType];
        
        if (!recipe) return;
        
        // Добавляем эликсир в инвентарь
        if (!this.game.elixirInventory[recipeType]) {
            this.game.elixirInventory[recipeType] = 0;
        }
        this.game.elixirInventory[recipeType] += this.alchemyCauldron.outputQuantity;
        
        // Сбрасываем состояние котла
        this.alchemyCauldron.working = false;
        this.alchemyCauldron.currentRecipe = null;
        this.alchemyCauldron.progress = 0;
        this.alchemyCauldron.startTime = null;
        this.alchemyCauldron.endTime = null;
        this.alchemyCauldron.totalTime = 0;
        this.alchemyCauldron.inputQuantity = 0;
        this.alchemyCauldron.outputQuantity = 0;
        
        this.game.updateDisplay();
        this.renderBuildings();
        this.game.shop.updateInventoryDisplay();
        this.game.saveToLocalStorage();
        
        this.game.showMessage(recipe.emoji, `Создано ${this.alchemyCauldron.outputQuantity} эликсира ${recipe.name}!`, 'success');
    }

    updateProgress() {
        if (this.alchemyCauldron.working && this.alchemyCauldron.startTime) {
            const now = Date.now();
            
            if (this.alchemyCauldron.endTime && now >= this.alchemyCauldron.endTime) {
                // Процесс завершен
                this.alchemyCauldron.progress = 100;
            } else {
                // Процесс продолжается
                const elapsed = now - this.alchemyCauldron.startTime;
                this.alchemyCauldron.progress = Math.min(100, (elapsed / this.alchemyCauldron.totalTime) * 100);
            }
            
            // Обновляем отображение каждую секунду если процесс активен
            if (Math.floor(now / 1000) !== Math.floor(this.game.lastUpdate / 1000)) {
                this.renderBuildings();
            }
            
            this.game.saveToLocalStorage();
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    getRecipeForSeedType(seedType) {
        return this.game.elixirRecipes[seedType];
    }

    getCurrentRecipe() {
        if (this.alchemyCauldron.currentRecipe) {
            return this.game.elixirRecipes[this.alchemyCauldron.currentRecipe];
        }
        return null;
    }

    isWorking() {
        return this.alchemyCauldron.working;
    }

    isReady() {
        return this.alchemyCauldron.progress >= 100;
    }

    getRemainingTime() {
        if (this.alchemyCauldron.working && this.alchemyCauldron.endTime) {
            return Math.max(0, this.alchemyCauldron.endTime - Date.now());
        }
        return 0;
    }

    // Метод для расчета эффективности (можно расширить для улучшений)
    getEfficiencyMultiplier() {
        return 1.0; // Базовая эффективность, можно увеличивать с улучшениями
    }

    // Метод для расчета бонуса к выходу (можно расширить для улучшений)
    getOutputBonus() {
        return 0; // Базовый бонус, можно увеличивать с улучшениями
    }

    // Метод для проверки, можно ли начать новый процесс
    canStartBrewing() {
        if (!this.alchemyCauldron.owned || this.alchemyCauldron.working) {
            return false;
        }

        // Проверяем, есть ли доступные рецепты
        const availableRecipes = Object.keys(this.game.elixirRecipes)
            .filter(recipeType => (this.game.harvestInventory[recipeType] || 0) > 0);
        
        return availableRecipes.length > 0;
    }

    // Метод для получения статуса котла (для отладки)
    getStatus() {
        return {
            owned: this.alchemyCauldron.owned,
            working: this.alchemyCauldron.working,
            progress: this.alchemyCauldron.progress,
            currentRecipe: this.alchemyCauldron.currentRecipe,
            canStart: this.canStartBrewing()
        };
    }

    // Метод для сброса котла (для отладки или специальных событий)
    resetCauldron() {
        this.alchemyCauldron.working = false;
        this.alchemyCauldron.currentRecipe = null;
        this.alchemyCauldron.progress = 0;
        this.alchemyCauldron.startTime = null;
        this.alchemyCauldron.endTime = null;
        this.alchemyCauldron.totalTime = 0;
        this.alchemyCauldron.inputQuantity = 0;
        this.alchemyCauldron.outputQuantity = 0;
        
        this.renderBuildings();
        this.game.saveToLocalStorage();
    }

    // Метод для принудительного завершения процесса (для отладки)
    forceComplete() {
        if (this.alchemyCauldron.working) {
            this.alchemyCauldron.progress = 100;
            this.alchemyCauldron.endTime = Date.now();
            this.renderBuildings();
            this.game.saveToLocalStorage();
        }
    }
}
