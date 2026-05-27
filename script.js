let currentMode = 'newest';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    render();
});

function Save() {
    let fileInput = document.getElementById("image");
    let file = fileInput.files[0];

    if (!file) {
        alert("Бро, выбери файл!");
        return;
    }

    let reader = new FileReader();
    reader.onload = function(e) {
        let newPost = {
            id: Date.now(), // Уникальный ID для каждого поста
            title: document.getElementById("Title").value,
            descr: document.getElementById("description").value,
            image: e.target.result,
            likes: 0,
            timestamp: Date.now()
        };

        let posts = JSON.parse(localStorage.getItem('myPosts')) || [];
        posts.push(newPost);
        localStorage.setItem('myPosts', JSON.stringify(posts));
        
        render();
    };

    reader.readAsDataURL(file);
}

function updateCounters(posts) {
    let now = Date.now();
    let oneDay = 24 * 60 * 60 * 1000;

    let todayEl = document.getElementById('artsTodayCount');
    let allEl = document.getElementById('artsAllTimeCount');
    let likesEl = document.getElementById('allArtsLikes');

    if (todayEl) todayEl.innerText = posts.filter(p => (now - p.timestamp) < oneDay).length;
    if (allEl) allEl.innerText = posts.length;
    if (likesEl) likesEl.innerText = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
}

function getProcessedPosts() {
    let posts = JSON.parse(localStorage.getItem('myPosts')) || [];
    let now = Date.now();
    let oneDay = 24 * 60 * 60 * 1000;
    let oneWeek = 7 * oneDay;

    updateCounters(posts);

    let filtered = [...posts]; // Копируем массив, чтобы не менять оригинал при сортировке

    switch (currentMode) {
        case 'topToday':
            return filtered
                .filter(p => (now - p.timestamp) < oneDay)
                .sort((a, b) => b.likes - a.likes);
        case 'topWeek':
            return filtered
                .filter(p => (now - p.timestamp) < oneWeek)
                .sort((a, b) => b.likes - a.likes);
        case 'newest':
        default:
            return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }
}

function render() {
    let gallery = document.getElementById('gallery');
    if (!gallery) return;

    let posts = getProcessedPosts();
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    gallery.innerHTML = '';

    posts.forEach(post => {
        let alreadyLiked = likedPosts.includes(post.id);
        gallery.innerHTML += `
            <div class="card">
                <h2>${post.title}</h2>
                <p>${post.descr}</p>
                <img src="${post.image}" width="200">
                <button onclick="LikePost(${post.id})">
                    ${alreadyLiked ? '❤️' : '🤍'} ${post.likes}
                </button>
            </div>
        `;
    });
}

function SetMode(mode) {
    currentMode = mode;
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    // Добавляем активный класс нажатой кнопке
    event.target.classList.add('active');
    
    render();
}

function LikePost(postId) {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    let posts = JSON.parse(localStorage.getItem('myPosts')) || [];
    let post = posts.find(p => p.id === postId);
    
    if (!post) return;

    if (likedPosts.includes(postId)) {
        // Снимаем лайк
        post.likes--;
        likedPosts = likedPosts.filter(id => id !== postId);
    } else {
        // Ставим лайк
        post.likes++;
        likedPosts.push(postId);
    }

    localStorage.setItem('myPosts', JSON.stringify(posts));
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    render();
}