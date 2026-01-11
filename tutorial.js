document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tutorial-complete-btn').addEventListener('click', () => {
        localStorage.setItem('tutorial-complete', 'true');
        window.history.back();
    });
});