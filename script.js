// 1. Настройка Supabase
const SUPABASE_URL = 'https://vcmtioxcfugypkbmgxki.supabase.co'; // Сюда твой Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXRpb3hjZnVneXBrYm1neGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODIsImV4cCI6MjA5NTQ1Mzc4Mn0.mB4yu1HhB7mDVBvny2rnjRfztUMD-okPv4Yg4ZfwBHw';       // Сюда твой ANON KEY
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentMode = 'newest';

async function Save() {
    const fileInput = document.getElementById("image");
    const titleInput = document.getElementById("Title");
    const descrInput = document.getElementById("description");

    const file = fileInput.files[0];
    if (!file || !titleInput.value) {
        alert("Бро, заполни всё и выбери файл!");
        return;
    }

    try {
        // 1. Грузим картинку в бакет 'arts'
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await db.storage
            .from('arts')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Получаем публичную ссылку
        const { data: publicUrlData } = db.storage.from('arts').getPublicUrl(fileName);

        // 3. Создаем запись в таблице 'posts'
        const { error: dbError } = await db
            .from('posts')
            .insert([{ 
                title: titleInput.value, 
                description: descrInput.value,
                image_url: publicUrlData.publicUrl,
                likes: 0 
            }]);

        if (dbError) throw dbError;

        alert("Арт залетел на сервер!");
        window.location.href = "index.html"; // Перекидываем обратно на главную
    } catch (err) {
        console.error(err);
        alert("Ошибка при сохранении: " + err.message);
    }
}

async function render() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    let query = db.from('posts').select('*');

    // Логика режимов через базу данных
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    if (currentMode === 'topToday') {
        query = query.gte('created_at', today).order('likes', { ascending: false });
    } else if (currentMode === 'topWeek') {
        query = query.gte('created_at', oneWeekAgo).order('likes', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data: posts, error } = await query;
    if (error) return console.error(error);

    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    
    gallery.innerHTML = posts.map(post => `
        <div class="card">
            <h2>${post.title}</h2>
            <p>${post.description}</p>
            <img src="${post.image_url}" width="200">
            <button onclick="LikePost(${post.id}, ${post.likes})">
                ${likedPosts.includes(post.id) ? '❤️' : '🤍'} ${post.likes}
            </button>
        </div>
    `).join('');
}

async function LikePost(id, currentLikes) {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    if (likedPosts.includes(id)) return; // Уже лайкнул

    const { error } = await db
        .from('posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', id);

    if (!error) {
        likedPosts.push(id);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        render();
    }
}

function SetMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    render();
    updateStats(); // Вызывай, если нужно
});
