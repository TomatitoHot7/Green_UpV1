// jQuery document ready function to handle bootstrap toast notifications initialization
$(document).ready(function () {
    if ($("toast").length) {
        $("toast").toast("show");
    }
});

// Main DOM content loaded event listener to handle user profile data, experience, levels, and interactivity
document.addEventListener('DOMContentLoaded', () => {

    // Retrieve saved experience and level values from localStorage, defaulting to 0 exp and level 1
    let currentExp = parseInt(localStorage.getItem('currentExp')) || 0;
    let currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    let expToNextLevel = calculateExpToNextLevel(currentLevel);

    // Initialize Bootstrap modal element for level up notifications if present in the DOM
    const levelUpModalElement = document.getElementById('levelUpModal');
    const levelUpModal = levelUpModalElement ? new bootstrap.Modal(levelUpModalElement) : null;

    // Load and apply saved user avatar image from localStorage if available
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar && document.getElementById('user-avatar')) {
        document.getElementById('user-avatar').src = savedAvatar;
    }

    // Function to calculate the required experience points needed to reach the next level
    function calculateExpToNextLevel(level) {
        return 2000 * level; 
    }

    // Function to update the user interface elements with current level, experience, and progress bar stats
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

    // Function to add experience points, manage level-ups, save to localStorage, and trigger modal notifications
    function addExp(expAmount) {
        currentExp += expAmount;
        localStorage.setItem('currentExp', currentExp);

        let levelUp = false; 
        
        // Loop to handle multiple level-ups if gained experience exceeds multiple thresholds
        while (currentExp >= expToNextLevel) {
            levelUp = true;
            currentExp -= expToNextLevel; 
            currentLevel++;          
            expToNextLevel = calculateExpToNextLevel(currentLevel); 
        }

        localStorage.setItem('currentLevel', currentLevel);
        localStorage.setItem('currentExp', currentExp); 

        updateUI();

        // Show level up modal popup if a new level has been attained
        if (levelUp && levelUpModal) {
            const display = document.getElementById('newLevelDisplay');
            if (display) display.textContent = currentLevel;
            levelUpModal.show(); 
        }
    }

    // Event listener for user avatar file input selection and local storage update via FileReader
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

    // Event listeners for mission completion buttons to grant experience and update button state
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

    // Initial call to populate the UI stats upon page load
    updateUI();
});
