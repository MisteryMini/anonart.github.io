const SUPABASE_URL = 'https://vcmtioxcfugypkbmgxki.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXRpb3hjZnVneXBrYm1neGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODIsImV4cCI6MjA5NTQ1Mzc4Mn0.mB4yu1HhB7mDVBvny2rnjRfztUMD-okPv4Yg4ZfwBHw';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentMode = 'newest';
let isAdmin = false;

function checkAdmin() {
    isAdmin = localStorage.getItem('admin-key') === 'OIJoijOIJOI!JIoij1oijOIJ534356OIJUIHUsjsufuuhi';
    render();
}

db.channel('posts-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        render();
        updateStats();
    })
    .subscribe();

async function Save() {
    const fileInput = document.getElementById("image");
    const titleInput = document.getElementById("Title");
    const descrInput = document.getElementById("description");
    const file = fileInput.files[0];

    if (!file || !titleInput.value) return alert("Бро, заполни всё!");

    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await db.storage.from('arts').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = db.storage.from('arts').getPublicUrl(fileName);

        const { error: dbError } = await db.from('posts').insert([{
            title: titleInput.value,
            description: descrInput.value,
            image_url: publicUrlData.publicUrl,
            likes: 0,
            created_at: new Date().toISOString()
        }]);

        if (dbError) throw dbError;
        alert("Арт залетел на сервер!");
        window.location.href = "index.html";
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
}

async function render() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    let query = db.from('posts').select('*');
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    if (currentMode === 'topToday') query = query.gte('created_at', oneDayAgo).order('likes', { ascending: false });
    else if (currentMode === 'topWeek') query = query.gte('created_at', oneWeekAgo).order('likes', { ascending: false });
    else query = query.order('created_at', { ascending: false });

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
            ${isAdmin ? `<button onclick="DeletePost(${post.id})" style="color:red;">🗑 Удалить</button>` : ''}
        </div>
    `).join('');
}

async function LikePost(id, currentLikes) {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    const isLiked = likedPosts.includes(id);
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

    const { error } = await db.from('posts').update({ likes: newLikes }).eq('id', id);
    if (!error) {
        likedPosts = isLiked ? likedPosts.filter(p => p !== id) : [...likedPosts, id];
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        render();
    }
}

async function DeletePost(id) {
    if (!isAdmin) return;
    if (!confirm("Удалить этот пост?")) return;

    const { data: post, error: fetchError } = await db.from('posts').select('image_url').eq('id', id).single();
    if (fetchError) return alert("Ошибка: " + fetchError.message);

    const fileName = post.image_url.split('/arts/')[1];
    const { error: storageError } = await db.storage.from('arts').remove([fileName]);
    if (storageError) return alert("Ошибка удаления файла: " + storageError.message);

    const { error: dbError } = await db.from('posts').delete().eq('id', id);
    if (dbError) alert("Ошибка: " + dbError.message);
}

async function updateStats() {
    const { count: allCount } = await db.from('posts').select('*', { count: 'exact', head: true });
    const { data: likesData } = await db.from('posts').select('likes');
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today);

    if (document.getElementById("artsAllTimeCount")) document.getElementById("artsAllTimeCount").innerText = allCount || 0;
    if (document.getElementById("artsTodayCount")) document.getElementById("artsTodayCount").innerText = todayCount || 0;
    if (document.getElementById("allArtsLikes")) {
        document.getElementById("allArtsLikes").innerText = likesData ? likesData.reduce((sum, p) => sum + p.likes, 0) : 0;
    }
}

function SetMode(mode) {
    currentMode = mode;
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    updateStats();
});
