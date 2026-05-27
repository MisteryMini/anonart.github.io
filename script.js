// 1. Настройка Supabase
const SUPABASE_URL = 'https://vcmtioxcfugypkbmgxki.supabase.co'; // Сюда твой Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXRpb3hjZnVneXBrYm1neGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODIsImV4cCI6MjA5NTQ1Mzc4Mn0.mB4yu1HhB7mDVBvny2rnjRfztUMD-okPv4Yg4ZfwBHw';       // Сюда твой ANON KEY

// Безопасная инициализация
const db = typeof supabase !== 'undefined' 
    ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
    : null;

// 2. Функция сохранения (для страницы загрузки)
async function Save() {
    if (!db) return alert("Ошибка: Supabase не подключен!");

    const fileInput = document.getElementById("image");
    const titleInput = document.getElementById("Title");
    const descrInput = document.getElementById("description");

    const file = fileInput.files[0];
    if (!file || !titleInput.value) return alert("Бро, заполни всё!");

    try {
        // Загрузка файла
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await db.storage
            .from('arts')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Получение ссылки
        const { data: publicUrlData } = db.storage.from('arts').getPublicUrl(fileName);

        // Запись в БД
        const { error: dbError } = await db
            .from('posts')
            .insert([{ 
                title: titleInput.value, 
                description: descrInput.value,
                image_url: publicUrlData.publicUrl,
                likes: 0 
            }]);

        if (dbError) throw dbError;

        alert("Арт успешно загружен!");
        window.location.href = "index.html"; // Возврат на главную
    } catch (err) {
        console.error(err);
        alert("Ошибка: " + err.message);
    }
}

// 3. Функция рендера (для главной страницы)
async function render() {
    const gallery = document.getElementById('gallery');
    if (!gallery || !db) return;

    const { data: posts, error } = await db
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

    if (error) return console.error(error);

    gallery.innerHTML = posts.map(post => `
        <div class="card">
            <h2>${post.title}</h2>
            <p>${post.description}</p>
            <img src="${post.image_url}" width="200" alt="${post.title}">
            <button onclick="LikePost(${post.id}, ${post.likes})">🤍 ${post.likes}</button>
        </div>
    `).join('');
}

// 4. Лайк
async function LikePost(id, currentLikes) {
    if (!db) return;
    const { error } = await db
        .from('posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', id);

    if (!error) render();
}

// Автозапуск рендера на главной
document.addEventListener('DOMContentLoaded', render);
