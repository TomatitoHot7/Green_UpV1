$(document).ready(function () {
    if ($("toast").length) {
        $("toast").toast("show");
    }
});

document.addEventListener('DOMContentLoaded', () => {

    let currentExp = parseInt(localStorage.getItem('currentExp')) || 0;
    let currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    let expToNextLevel = calculateExpToNextLevel(currentLevel);

    const levelUpModalElement = document.getElementById('levelUpModal');
    const levelUpModal = levelUpModalElement ? new bootstrap.Modal(levelUpModalElement) : null;

    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar && document.getElementById('user-avatar')) {
        document.getElementById('user-avatar').src = savedAvatar;
    }

    function calculateExpToNextLevel(level) {
        return 2000 * level; 
    }

    function updateUI() {
        const progressPercentage = (currentExp / expToNextLevel) * 100;
        const progressBarElement = document.getElementById('progressBar');
        const progressTextElement = document.getElementById('progressText');

        if (document.getElementById('currentLevel')) document.getElementById('currentLevel').textContent = currentLevel;
        if (document.getElementById('nav-level')) document.getElementById('nav-level').textContent = currentLevel;
        if (document.getElementById('currentExp')) document.getElementById('currentExp').textContent = currentExp;
        if (document.getElementById('expToNextLevel')) document.getElementById('expToNextLevel').textContent = expToNextLevel;

        if (progressBarElement && progressTextElement) {
            progressBarElement.style.width = `${progressPercentage}%`;
            progressTextElement.textContent = `${Math.round(progressPercentage)}%`;
        }
    }

    function addExp(expAmount) {
        currentExp += expAmount;
        localStorage.setItem('currentExp', currentExp);

        let levelUp = false; 
        
        while (currentExp >= expToNextLevel) {
            levelUp = true;
            currentExp -= expToNextLevel; 
            currentLevel++;          
            expToNextLevel = calculateExpToNextLevel(currentLevel); 
        }

        localStorage.setItem('currentLevel', currentLevel);
        localStorage.setItem('currentExp', currentExp); 

        updateUI();

        if (levelUp && levelUpModal) {
            const display = document.getElementById('newLevelDisplay');
            if (display) display.textContent = currentLevel;
            levelUpModal.show(); 
        }
    }

    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newAvatarUrl = e.target.result;
                    document.getElementById('user-avatar').src = newAvatarUrl;
                    localStorage.setItem('userAvatar', newAvatarUrl);
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    document.querySelectorAll('.complete-mission').forEach(button => {
        button.addEventListener('click', function() {
            const exp = parseInt(this.getAttribute('data-exp'));
            
            addExp(exp);

            this.textContent = '¡Completada!';
            this.disabled = true;
            this.classList.remove('btn-success', 'btn-primary');
            this.classList.add('btn-secondary');
        });
    });

    updateUI();
});