// 1. Инициализация (вставь свои данные из Supabase Settings -> API)
const supabase = supabase.createClient('https://vcmtioxcfugypkbmgxki.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXRpb3hjZnVneXBrYm1neGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4Nzc3ODIsImV4cCI6MjA5NTQ1Mzc4Mn0.mB4yu1HhB7mDVBvny2rnjRfztUMD-okPv4Yg4ZfwBHw');

let currentMode = 'newest';

document.addEventListener('DOMContentLoaded', () => {
    render();
});

async function Save() {
    let fileInput = document.getElementById("image");
    let file = fileInput.files[0];
    let title = document.getElementById("Title").value;
    let descr = document.getElementById("description").value;

    if (!file || !title) {
        alert("Бро, заполни всё!");
        return;
    }

    // Загрузка картинки в Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
        .from('arts') // Убедись, что бакет называется 'arts'
        .upload(fileName, file);

    if (storageError) { alert("Ошибка файла: " + storageError.message); return; }

    // Получаем ссылку
    const { data: publicUrlData } = supabase.storage.from('arts').getPublicUrl(fileName);

    // Сохраняем пост в БД
    const { error: dbError } = await supabase
        .from('posts')
        .insert([{ 
            title: title, 
            description: descr, // В БД у тебя колонка 'description'
            image_url: publicUrlData.publicUrl, 
            likes: 0 
        }]);

    if (dbError) { alert("Ошибка БД: " + dbError.message); return; }

    alert("Арт успешно загружен!");
    render();
}

// Функция получения постов с сервера
async function render() {
    let gallery = document.getElementById('gallery');
    if (!gallery) return;

    // Запрос в базу данных
    let { data: posts, error } = await supabase
        .from('posts')
        .select('*');

    if (error) { console.error(error); return; }

    gallery.innerHTML = '';
    posts.forEach(post => {
        gallery.innerHTML += `
            <div class="card">
                <h2>${post.title}</h2>
                <p>${post.description}</p>
                <img src="${post.image_url}" width="200">
                <button onclick="LikePost(${post.id})">🤍 ${post.likes}</button>
            </div>
        `;
    });
}

// Лайк (теперь он обновляет базу)
async function LikePost(postId) {
    // В реальном проекте тут нужна логика проверки лайкал ли юзер, 
    // но для начала просто делаем инкремент в базе
    const { data, error } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();

    if (data) {
        await supabase
            .from('posts')
            .update({ likes: data.likes + 1 })
            .eq('id', postId);
        render();
    }
}
