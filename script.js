// 1. Настройка Supabase
const SUPABASE_URL = 'https://vcmtioxcfugypkbmgxki.supabase.co'; // Сюда твой Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXRpb3hjZnVneXBrYm1neGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODIsImV4cCI6MjA5NTQ1Mzc4Mn0.mB4yu1HhB7mDVBvny2rnjRfztUMD-okPv4Yg4ZfwBHw';       // Сюда твой ANON KEY
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentMode = 'newest';

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
