$(document).ready(function () {
 $("toast").toast("show")
})
document.addEventListener('DOMContentLoaded', () => {

    let currentExp = parseInt(localStorage.getItem('currentExp')) || 0;
    let currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    let expToNextLevel = calculateExpToNextLevel(currentLevel);

    const levelUpModalElement = document.getElementById('levelUpModal');
    const levelUpModal = new bootstrap.Modal(levelUpModalElement);

    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        document.getElementById('user-avatar').src = savedAvatar;
    }

    function calculateExpToNextLevel(level) {
        return 2000 * level; 
    }

    function updateUI() {
        const progressPercentage = (currentExp / expToNextLevel) * 100;
        const progressBarElement = document.getElementById('progressBar');
        const progressTextElement = document.getElementById('progressText');

        document.getElementById('currentLevel').textContent = currentLevel;
        document.getElementById('nav-level').textContent = currentLevel;
        document.getElementById('currentExp').textContent = currentExp;
        document.getElementById('expToNextLevel').textContent = expToNextLevel;

        progressBarElement.style.width = `${progressPercentage}%`;
        progressTextElement.textContent = `${Math.round(progressPercentage)}%`;
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

        if (levelUp) {
            document.getElementById('newLevelDisplay').textContent = currentLevel;
            levelUpModal.show(); 
        }
    }


    document.getElementById('file-input').addEventListener('change', function() {
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