// utils.js - Вспомогательные функции и утилиты для игры
class GameUtils {
    constructor() {
        this.messageQueue = [];
        this.isShowingMessage = false;
    }

    // ========== СИСТЕМА СООБЩЕНИЙ ==========

    showMessage(emoji, text, type = 'info', duration = 3000) {
        const message = {
            emoji,
            text,
            type,
            duration,
            timestamp: Date.now()
        };
        
        this.messageQueue.push(message);
        
        if (!this.isShowingMessage) {
            this.processMessageQueue();
        }
    }

    processMessageQueue() {
        if (this.messageQueue.length === 0) {
            this.isShowingMessage = false;
            return;
        }

        this.isShowingMessage = true;
        const message = this.messageQueue.shift();
        this.displayMessage(message);
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'purchase-message';
        
        // Устанавливаем цвет в зависимости от типа
        switch (message.type) {
            case 'success':
                messageElement.style.background = '#4CAF50';
                break;
            case 'error':
                messageElement.style.background = '#f44336';
                break;
            case 'warning':
                messageElement.style.background = '#FF9800';
                break;
            default:
                messageElement.style.background = '#2196F3';
        }
        
        messageElement.innerHTML = `
            <span class="purchase-emoji">${message.emoji}</span>
            <span class="purchase-text">${message.text}</span>
        `;
        
        document.body.appendChild(messageElement);
        
        // Анимация появления
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // Автоматическое скрытие
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
                this.processMessageQueue();
            }, 500);
        }, message.duration);
    }

    showDropMessage(emoji, name, count) {
        this.showMessage(emoji, `+${count} семян ${name}!`, 'success', 2000);
    }

    showPurchaseMessage(emoji, name, quantity, price) {
        this.showMessage(emoji, `Куплено ${quantity} семян ${name} за ${price} эссенции!`, 'success');
    }

    // ========== РАБОТА С ВРЕМЕНЕМ ==========

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}ч ${minutes % 60}м`;
        } else if (minutes > 0) {
            return `${minutes}м ${seconds % 60}с`;
        } else {
            return `${seconds}с`;
        }
    }

    formatShortTime(ms) {
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) {
            return `${seconds}с`;
        } else {
            const minutes = Math.ceil(seconds / 60);
            return `${minutes}м`;
        }
    }

    getTimeUntil(targetTime) {
        const now = Date.now();
        return Math.max(0, targetTime - now);
    }

    isTimePassed(timestamp) {
        return Date.now() >= timestamp;
    }

    // ========== РАБОТА С ЧИСЛАМИ ==========

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    // ========== РАБОТА С LOCALSTORAGE ==========

    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            return false;
        }
    }

    loadFromLocalStorage(key, defaultValue = null) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            return defaultValue;
        }
    }

    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Ошибка удаления из localStorage:', error);
            return false;
        }
    }

    clearLocalStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Ошибка очистки localStorage:', error);
            return false;
        }
    }

    // ========== РАБОТА С DOM ==========

    createElement(tag, className, innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    showElement(element) {
        if (element) element.classList.remove('hidden');
    }

    hideElement(element) {
        if (element) element.classList.add('hidden');
    }

    toggleElement(element) {
        if (element) element.classList.toggle('hidden');
    }

    setButtonState(button, enabled, text = null) {
        if (button) {
            button.disabled = !enabled;
            if (text !== null) {
                button.textContent = text;
            }
        }
    }

    updateElementText(selector, text) {
        const element = document.querySelector(selector);
        if (element) element.textContent = text;
    }

    // ========== МАТЕМАТИЧЕСКИЕ ФУНКЦИИ ==========

    calculateProgress(current, total) {
        if (total === 0) return 0;
        return this.clamp((current / total) * 100, 0, 100);
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // ========== СЛУЧАЙНЫЕ ВЕЛИЧИНЫ ==========

    weightedRandom(weights) {
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        
        return weights.length - 1;
    }

    chance(probability) {
        return Math.random() < probability;
    }

    // ========== АНИМАЦИИ ==========

    animateValue(element, start, end, duration, callback = null) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else if (callback) {
                callback();
            }
        }
        
        requestAnimationFrame(update);
    }

    pulseAnimation(element, scale = 1.1, duration = 200) {
        element.style.transform = `scale(${scale})`;
        element.style.transition = `transform ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration);
    }

    shakeAnimation(element, intensity = 5, duration = 300) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const shake = Math.sin(progress * Math.PI * 10) * intensity * (1 - progress);
            
            element.style.transform = `translateX(${shake}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.style.transform = 'translateX(0)';
            }
        }
        
        requestAnimationFrame(update);
    }

    // ========== ВАЛИДАЦИЯ ==========

    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    isValidString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    isValidArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    isValidObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    // ========== ОПТИМИЗАЦИЯ ==========

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ========== СИСТЕМА СОХРАНЕНИЙ ==========

    createBackup(data, backupName = 'backup') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupKey = `darkFarm_${backupName}_${timestamp}`;
        
        if (this.saveToLocalStorage(backupKey, data)) {
            this.cleanupOldBackups(backupName);
            return backupKey;
        }
        return null;
    }

    cleanupOldBackups(backupName, maxBackups = 5) {
        const backups = [];
        
        // Собираем все бэкапы
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`darkFarm_${backupName}_`)) {
                backups.push(key);
            }
        }
        
        // Сортируем по времени (новые первые)
        backups.sort((a, b) => b.localeCompare(a));
        
        // Удаляем старые бэкапы
        for (let i = maxBackups; i < backups.length; i++) {
            this.removeFromLocalStorage(backups[i]);
        }
    }

    listBackups(backupName) {
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`darkFarm_${backupName}_`)) {
                const data = this.loadFromLocalStorage(key);
                if (data) {
                    backups.push({
                        key,
                        timestamp: key.split('_').pop(),
                        data
                    });
                }
            }
        }
        
        return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    // ========== СИСТЕМА ЛОГГИРОВАНИЯ ==========

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        
        console.log(logMessage);
        
        // Можно добавить сохранение логов в localStorage для отладки
        if (type === 'error' || type === 'warn') {
            this.saveLog(logMessage);
        }
    }

    saveLog(message) {
        const logs = this.loadFromLocalStorage('game_logs', []);
        logs.push(message);
        
        // Ограничиваем размер логов
        if (logs.length > 100) {
            logs.shift();
        }
        
        this.saveToLocalStorage('game_logs', logs);
    }

    getLogs() {
        return this.loadFromLocalStorage('game_logs', []);
    }

    clearLogs() {
        this.removeFromLocalStorage('game_logs');
    }

    // ========== СИСТЕМА КОНФИГУРАЦИИ ==========

    loadConfig() {
        const defaultConfig = {
            autoSave: true,
            autoSaveInterval: 30000,
            showAnimations: true,
            soundEnabled: true,
            notifications: true,
            language: 'ru'
        };
        
        return this.loadFromLocalStorage('game_config', defaultConfig);
    }

    saveConfig(config) {
        return this.saveToLocalStorage('game_config', config);
    }

    // ========== СИСТЕМА СТАТИСТИКИ ==========

    trackEvent(category, action, label = null, value = null) {
        const event = {
            category,
            action,
            label,
            value,
            timestamp: Date.now()
        };
        
        const stats = this.loadFromLocalStorage('game_stats', { events: [] });
        stats.events.push(event);
        
        // Ограничиваем размер статистики
        if (stats.events.length > 1000) {
            stats.events = stats.events.slice(-500);
        }
        
        this.saveToLocalStorage('game_stats', stats);
        this.log(`Event tracked: ${category}.${action}`);
    }

    getStats() {
        return this.loadFromLocalStorage('game_stats', { events: [] });
    }

    clearStats() {
        this.removeFromLocalStorage('game_stats');
    }
}

// Создаем глобальный экземпляр утилит
const gameUtils = new GameUtils();

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameUtils;
}
