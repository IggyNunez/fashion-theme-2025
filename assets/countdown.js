// Countdown Timer JavaScript
class CountdownTimer {
  constructor(element) {
    this.element = element;
    this.endDate = new Date(element.dataset.date);
    this.daysEl = element.querySelector('[data-days]');
    this.hoursEl = element.querySelector('[data-hours]');
    this.minutesEl = element.querySelector('[data-minutes]');
    this.secondsEl = element.querySelector('[data-seconds]');
    
    if (this.isValidDate()) {
      this.init();
    } else {
      this.hideTimer();
    }
  }
  
  init() {
    this.updateTimer();
    this.interval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }
  
  isValidDate() {
    return this.endDate instanceof Date && !isNaN(this.endDate);
  }
  
  updateTimer() {
    const now = new Date();
    const distance = this.endDate - now;
    
    if (distance < 0) {
      this.timerExpired();
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    this.updateDisplay(days, hours, minutes, seconds);
  }
  
  updateDisplay(days, hours, minutes, seconds) {
    if (this.daysEl) this.daysEl.textContent = this.pad(days);
    if (this.hoursEl) this.hoursEl.textContent = this.pad(hours);
    if (this.minutesEl) this.minutesEl.textContent = this.pad(minutes);
    if (this.secondsEl) this.secondsEl.textContent = this.pad(seconds);
  }
  
  pad(number) {
    return number < 10 ? '0' + number : number;
  }
  
  timerExpired() {
    clearInterval(this.interval);
    this.element.innerHTML = '<div class="countdown-expired">This offer has expired</div>';
    
    // Trigger custom event
    const event = new CustomEvent('countdownExpired', {
      detail: { element: this.element }
    });
    document.dispatchEvent(event);
  }
  
  hideTimer() {
    this.element.style.display = 'none';
  }
  
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Initialize all countdown timers
document.addEventListener('DOMContentLoaded', function() {
  const countdowns = document.querySelectorAll('.hero-advanced__countdown, .countdown-timer');
  countdowns.forEach(countdown => {
    new CountdownTimer(countdown);
  });
});

// Export for use in other scripts
window.CountdownTimer = CountdownTimer;
