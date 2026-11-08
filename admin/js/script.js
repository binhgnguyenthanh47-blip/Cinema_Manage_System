// Mock Database
let movies = [
    { id: 1, name: "Mai", duration: 131, genre: "Tâm lý", poster: "https://picsum.photos/200/300?random=1" },
    { id: 2, name: "Dune: Part Two", duration: 166, genre: "Hành động", poster: "https://picsum.photos/200/300?random=2" }
];

let showtimes = [
    { id: 1, room: "Phòng 1", time: "14:00", movie: "Mai" },
    { id: 2, room: "Phòng 2", time: "16:30", movie: "Dune: Part Two" }
];

// Dữ liệu ghế riêng cho từng phòng chiếu
let currentRoom = "Phòng 1";
let roomsSeats = {
    "Phòng 1": Array.from({ length: 30 }, (_, i) => ({
        id: `A${i + 1}`,
        type: i >= 12 && i <= 23 ? 'vip' : 'standard',
        status: i === 5 ? 'booked' : (i === 10 ? 'disabled' : 'available')
    })),
    "Phòng 2": Array.from({ length: 30 }, (_, i) => ({
        id: `B${i + 1}`,
        type: i >= 12 && i <= 23 ? 'vip' : 'standard',
        status: i === 2 ? 'booked' : 'available'
    })),
    "Phòng 3": Array.from({ length: 30 }, (_, i) => ({
        id: `C${i + 1}`,
        type: i >= 12 && i <= 23 ? 'vip' : 'standard',
        status: 'available'
    }))
};

// Switch Tab
function switchTab(tabId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (tabId === 'analytics') initChart();
    if (tabId === 'rooms') renderSeats(); // Gọi renderSeats khi chuyển sang tab Phòng & Ghế
}

// Thay đổi phòng được chọn
function changeRoom(roomName) {
    currentRoom = roomName;
    const titleEl = document.getElementById('room-title');
    if (titleEl) titleEl.innerText = `Sơ Đồ Ghế - ${roomName}`;
    renderSeats();
}

// Render Functions
function renderMovies() {
    const tbody = document.getElementById('movie-table');
    if (!tbody) return;
    tbody.innerHTML = movies.map(m => `
        <tr>
            <td><img src="${m.poster}" class="poster-thumb"/></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.genre}</td>
            <td>${m.duration} phút</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editMovie(${m.id})">Sửa</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMovie(${m.id})">Xóa</button>
            </td>
        </tr>
    `).join('');

    const select = document.getElementById('st-movie');
    if (select) {
        select.innerHTML = movies.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    }
}

function renderShowtimes() {
    const tbody = document.getElementById('showtime-table');
    if (!tbody) return;
    tbody.innerHTML = showtimes.map(st => `
        <tr>
            <td><strong>${st.room}</strong></td>
            <td>${st.time}</td>
            <td>${st.movie}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteShowtime(${st.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

function renderSeats() {
    const grid = document.getElementById('seat-grid');
    if (!grid) return;

    const seats = roomsSeats[currentRoom];
    if (!seats) return;

    grid.innerHTML = seats.map(s => {
        let cls = `seat ${s.type}`;
        if (s.status === 'booked') cls = 'seat booked';
        if (s.status === 'disabled') cls = 'seat disabled';
        return `<div class="${cls}" onclick="toggleSeat('${s.id}')">${s.id}</div>`;
    }).join('');
}

// CRUD Movie Logic
function saveMovie(e) {
    e.preventDefault();
    const id = document.getElementById('movie-id').value;
    const name = document.getElementById('movie-name').value;
    const duration = document.getElementById('movie-duration').value;
    const genre = document.getElementById('movie-genre').value;
    const poster = document.getElementById('movie-poster').value || 'https://picsum.photos/200/300';

    if (id) {
        const idx = movies.findIndex(m => m.id == id);
        movies[idx] = { id: Number(id), name, duration, genre, poster };
    } else {
        movies.push({ id: Date.now(), name, duration, genre, poster });
    }
    
    resetMovieForm();
    renderMovies();
}

function editMovie(id) {
    const m = movies.find(item => item.id === id);
    document.getElementById('movie-id').value = m.id;
    document.getElementById('movie-name').value = m.name;
    document.getElementById('movie-duration').value = m.duration;
    document.getElementById('movie-genre').value = m.genre;
    document.getElementById('movie-poster').value = m.poster;
}

function deleteMovie(id) {
    movies = movies.filter(m => m.id !== id);
    renderMovies();
}

function resetMovieForm() {
    document.getElementById('movie-id').value = '';
    document.getElementById('movie-name').value = '';
    document.getElementById('movie-duration').value = '';
    document.getElementById('movie-genre').value = '';
    document.getElementById('movie-poster').value = '';
}

// CRUD Showtime Logic (Tránh trùng giờ)
function addShowtime(e) {
    e.preventDefault();
    const room = document.getElementById('st-room').value;
    const time = document.getElementById('st-time').value;
    const movie = document.getElementById('st-movie').value;

    const conflict = showtimes.some(st => st.room === room && st.time === time);
    if (conflict) {
        alert("Cảnh báo: Phòng chiếu này đã có suất chiếu vào khung giờ được chọn!");
        return;
    }

    showtimes.push({ id: Date.now(), room, time, movie });
    renderShowtimes();
}

function deleteShowtime(id) {
    showtimes = showtimes.filter(st => st.id !== id);
    renderShowtimes();
}

// Seat Toggle Logic (Cho phòng hiện tại)
function toggleSeat(id) {
    const seats = roomsSeats[currentRoom];
    const seat = seats.find(s => s.id === id);
    if (!seat || seat.status === 'booked') return;
    
    if (seat.status === 'available') seat.status = 'disabled';
    else seat.status = 'available';
    
    renderSeats();
}

// Chart.js Revenue Initialization
let revenueChart = null;
function initChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mai', 'Dune 2', 'Kung Fu Panda 4', 'Exhuma', 'Lật Mặt 7'],
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: [520, 340, 290, 410, 600],
                backgroundColor: '#e91e63',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderMovies();
    renderShowtimes();
    renderSeats();
    initChart();
});
