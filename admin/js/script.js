let state = {
    stats: null,
    movies: [],
    shows: [],
    cinemas: [],
    halls: [],
    bookings: [],
    currentSeats: []
};

let revenueChart = null;
let cinemaChart = null;
let eventSource = null;

function getAdminHeaders(extra = {}) {
    const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
    return {
        'Content-Type': 'application/json',
        'x-user-id': user ? String(user.user_id) : '',
        ...extra
    };
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + ' ₫';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function updateSyncTimestamp() {
    const el = document.getElementById('lastSyncTime');
    if (el) {
        const now = new Date();
        el.textContent = `(${now.toLocaleTimeString('vi-VN')})`;
    }
}

// ==========================================
// ĐIỀU HƯỚNG TAB
// ==========================================
const TAB_TITLES = {
    analytics: 'Thống Kê & Doanh Thu',
    movies: 'Quản Lý Kho Phim',
    showtimes: 'Quản Lý Suất Chiếu',
    rooms: 'Quản Lý Rạp, Phòng & Sơ Đồ Ghế',
    bookings: 'Quản Lý Đơn Đặt Vé'
};

function switchTab(tabId, el = null) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    const navEl = el || document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (navEl) navEl.classList.add('active');

    const titleEl = document.getElementById('pageTitle');
    if (titleEl && TAB_TITLES[tabId]) titleEl.textContent = TAB_TITLES[tabId];

    if (tabId === 'analytics') renderCharts();
    if (tabId === 'rooms') loadHallSeats();
}

// ==========================================
// ĐỒNG BỘ DỮ LIỆU THỜI GIAN THẬT (SSE + API)
// ==========================================
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: getAdminHeaders(options.headers || {})
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi kết nối API');
    }
    return data;
}

async function syncAllData(manual = false) {
    try {
        const [dashRes, moviesRes, showsRes, cinemaHallRes, bookingsRes] = await Promise.all([
            apiFetch('/api/admin/dashboard'),
            apiFetch('/api/admin/movies'),
            apiFetch('/api/admin/shows'),
            apiFetch('/api/admin/cinemas-halls'),
            apiFetch('/api/admin/bookings')
        ]);

        state.stats = dashRes.data;
        state.movies = moviesRes.data;
        state.shows = showsRes.data;
        state.cinemas = cinemaHallRes.data.cinemas;
        state.halls = cinemaHallRes.data.halls;
        state.bookings = bookingsRes.data;

        renderDashboard();
        renderMoviesTable();
        populateShowFiltersAndSelects();
        renderShowsTable();
        populateCinemaHallSelectors();
        renderBookingsTable();
        updateSyncTimestamp();

        if (document.getElementById('rooms').classList.contains('active')) {
            await loadHallSeats();
        }

        if (manual) showToast('Đã đồng bộ dữ liệu mới nhất từ MySQL!');
    } catch (error) {
        console.error('Lỗi đồng bộ:', error);
        if (manual) showToast(error.message, 'error');
    }
}

function initRealtimeStream() {
    const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
    if (!user) return;

    if (eventSource) eventSource.close();

    const statusBox = document.getElementById('liveStatusBox');
    const statusText = document.getElementById('liveStatusText');

    eventSource = new EventSource(`/api/admin/stream?userId=${user.user_id}`);

    eventSource.addEventListener('connected', () => {
        if (statusBox) statusBox.classList.remove('offline');
        if (statusText) statusText.textContent = 'Live MySQL';
        updateSyncTimestamp();
    });

    const handleRealtimeEvent = (label) => async () => {
        await syncAllData(false);
        showToast(`Đồng bộ thời gian thật: ${label}`);
    };

    eventSource.addEventListener('movies_updated', handleRealtimeEvent('Danh sách phim đã thay đổi'));
    eventSource.addEventListener('shows_updated', handleRealtimeEvent('Lịch chiếu đã cập nhật'));
    eventSource.addEventListener('cinemas_updated', handleRealtimeEvent('Rạp / Phòng chiếu đã cập nhật'));
    eventSource.addEventListener('seats_updated', handleRealtimeEvent('Sơ đồ ghế đã cập nhật'));
    eventSource.addEventListener('bookings_updated', handleRealtimeEvent('Trạng thái đơn vé đã thay đổi'));
    eventSource.addEventListener('booking_created', handleRealtimeEvent('Có khách hàng vừa đặt vé mới!'));

    eventSource.onerror = () => {
        if (statusBox) statusBox.classList.add('offline');
        if (statusText) statusText.textContent = 'Đang kết nối lại...';
    };
}

// ==========================================
// 1. RENDER DASHBOARD & CHARTS
// ==========================================
function renderDashboard() {
    if (!state.stats) return;
    const { kpis } = state.stats;

    document.getElementById('kpiPaidRevenue').textContent = formatCurrency(kpis.paid_revenue);
    document.getElementById('kpiPendingRevenue').textContent =
        `Vé: ${formatCurrency(kpis.paid_ticket_revenue)} | Bắp nước: ${formatCurrency(kpis.paid_combo_revenue)}`;

    const comboEl = document.getElementById('kpiComboRevenue');
    if (comboEl) {
        comboEl.textContent = formatCurrency(kpis.paid_combo_revenue);
        const ratio = kpis.paid_revenue > 0
            ? ((kpis.paid_combo_revenue / kpis.paid_revenue) * 100).toFixed(1)
            : 0;
        document.getElementById('kpiComboRatio').textContent =
            `Chiếm ${ratio}% tổng doanh thu (Chờ TT: ${formatCurrency(kpis.pending_combo_revenue)})`;
    }

    document.getElementById('kpiSoldTickets').textContent = `${kpis.sold_tickets} vé`;
    document.getElementById('kpiHeldTickets').textContent = `Đang giữ chỗ: ${kpis.held_tickets} vé`;
    document.getElementById('kpiTotalMovies').textContent = `${kpis.total_movies} phim`;
    document.getElementById('kpiMovieBreakdown').textContent = `Đang chiếu: ${kpis.now_showing_count} | Sắp chiếu: ${kpis.coming_soon_count}`;
    document.getElementById('kpiActiveShows').textContent = `${kpis.active_shows} suất`;

    const badge = document.getElementById('badgePendingBookings');
    if (badge) {
        if (kpis.pending_bookings > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = kpis.pending_bookings;
        } else {
            badge.style.display = 'none';
        }
    }

    renderCharts();
    renderRecentBookings();
}

function renderCharts() {
    if (!state.stats) return;

    const movieCtx = document.getElementById('revenueChart');
    if (movieCtx) {
        if (revenueChart) revenueChart.destroy();
        const topMovies = state.stats.revenueByMovie.slice(0, 8);
        revenueChart = new Chart(movieCtx, {
            type: 'bar',
            data: {
                labels: topMovies.map(m => m.title.length > 18 ? m.title.slice(0, 18) + '…' : m.title),
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: topMovies.map(m => m.revenue),
                    backgroundColor: '#4338CA',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    const cinemaCtx = document.getElementById('cinemaChart');
    if (cinemaCtx) {
        if (cinemaChart) cinemaChart.destroy();
        const cinemas = state.stats.revenueByCinema;
        cinemaChart = new Chart(cinemaCtx, {
            type: 'doughnut',
            data: {
                labels: cinemas.map(c => c.cinema_name),
                datasets: [{
                    data: cinemas.map(c => c.revenue > 0 ? c.revenue : 1),
                    backgroundColor: ['#4338CA', '#E11D48', '#16A34A', '#D97706', '#0284C7']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function renderRecentBookings() {
    const tbody = document.getElementById('recent-bookings-table');
    if (!tbody) return;
    const recent = state.bookings.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748B;">Chưa có đơn đặt vé nào.</td></tr>`;
        return;
    }
    tbody.innerHTML = recent.map(b => `
        <tr>
            <td><strong>#${b.booking_id}</strong></td>
            <td>${b.full_name}<br><small class="text-muted">${b.email}</small></td>
            <td><strong>${b.movie_title || '-'}</strong><br><small class="text-muted">${b.cinema_name || ''} - ${b.show_time || ''}</small></td>
            <td><strong>${b.seats || '-'}</strong></td>
            <td>${b.combo_summary ? `${b.combo_summary}<br><small class="text-muted">+${formatCurrency(b.combo_amount)}</small>` : '<span class="text-muted">Không có</span>'}</td>
            <td><strong>${formatCurrency(b.total_amount)}</strong></td>
            <td>${renderBookingBadge(b.status)}</td>
        </tr>
    `).join('');
}

// ==========================================
// 2. CRUD PHIM
// ==========================================
function renderMovieStatusBadge(status) {
    if (status === 'now_showing') return `<span class="badge badge-success">Đang chiếu</span>`;
    if (status === 'coming_soon') return `<span class="badge badge-info">Sắp chiếu</span>`;
    return `<span class="badge badge-muted">Ngừng chiếu</span>`;
}

function resolvePosterPath(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('../')) return url;
    return '../' + url.replace(/^\/+/, '');
}

function renderMoviesTable() {
    const tbody = document.getElementById('movie-table');
    if (!tbody) return;

    const kw = (document.getElementById('movieSearchInput')?.value || '').trim().toLowerCase();
    const stFilter = document.getElementById('movieStatusFilter')?.value || 'all';

    const filtered = state.movies.filter(m => {
        if (stFilter !== 'all' && m.status !== stFilter) return false;
        if (kw && !`${m.title} ${m.director || ''} ${m.genre || ''}`.toLowerCase().includes(kw)) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748B;">Không tìm thấy phim phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(m => `
        <tr>
            <td>#${m.movie_id}</td>
            <td>
    ${m.poster_url
        ? `<img src="${resolvePosterPath(m.poster_url)}" class="poster-thumb" onerror="this.outerHTML='<div class=\\'poster-thumb\\' style=\\'display:flex;align-items:center;justify-content:center;font-size:10px;color:#64748B;text-align:center;\\'>Lỗi ảnh</div>'">`
        : `<div class="poster-thumb" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#64748B;text-align:center;">Chưa có</div>`
    }
</td>
            <td>
                <strong>${m.title}</strong>
                <div class="text-muted">Đạo diễn: ${m.director || 'Đang cập nhật'}</div>
                <div class="text-muted">Khởi chiếu: ${m.release_date_text || '-'}</div>
            </td>
            <td>${m.genre}<br><small class="text-muted">${m.duration_minutes ? m.duration_minutes + ' phút' : 'Chưa rõ'}</small></td>
            <td><span class="badge badge-danger">${m.age_rating || 'P'}</span> <strong>${m.rating ?? '-'}</strong></td>
            <td>${renderMovieStatusBadge(m.status)}</td>
            <td><strong>${m.show_count || 0}</strong> suất</td>
            <td>
                <div class="action-group">
                    <button type="button" class="btn btn-light btn-sm" onclick="openMovieModal(${m.movie_id})">Sửa</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteMovie(${m.movie_id}, '${m.title.replace(/'/g, "\\'")}')">Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openMovieModal(movieId = null) {
    const modal = document.getElementById('movieModal');
    const titleEl = document.getElementById('movieModalTitle');

    if (movieId) {
        const m = state.movies.find(x => Number(x.movie_id) === Number(movieId));
        if (!m) return;
        titleEl.textContent = `Cập Nhật Phim #${m.movie_id}`;
        document.getElementById('movie-id').value = m.movie_id;
        document.getElementById('movie-title').value = m.title || '';
        document.getElementById('movie-genre').value = m.genre || '';
        document.getElementById('movie-duration').value = m.duration_minutes || '';
        document.getElementById('movie-age').value = m.age_rating || 'P';
        document.getElementById('movie-status').value = m.status || 'now_showing';
        document.getElementById('movie-rating').value = m.rating ?? '';
        document.getElementById('movie-release').value = m.release_date_text || '';
        document.getElementById('movie-trailer').value = m.trailer_url || '';
        document.getElementById('movie-poster').value = m.poster_url || '';
        document.getElementById('movie-director').value = m.director || '';
        document.getElementById('movie-country').value = m.country || '';
        document.getElementById('movie-actors').value = m.actors || '';
        document.getElementById('movie-language').value = m.language || '';
        document.getElementById('movie-description').value = m.description || '';
    } else {
        titleEl.textContent = 'Thêm Phim Mới';
        document.getElementById('movie-id').value = '';
        document.getElementById('movie-title').value = '';
        document.getElementById('movie-genre').value = '';
        document.getElementById('movie-duration').value = '120';
        document.getElementById('movie-age').value = 'P';
        document.getElementById('movie-status').value = 'now_showing';
        document.getElementById('movie-rating').value = '';
        document.getElementById('movie-release').value = '';
        document.getElementById('movie-trailer').value = '';
        document.getElementById('movie-poster').value = 'assets/images/spiderman-brand-new-day.jpeg';
        document.getElementById('movie-director').value = '';
        document.getElementById('movie-country').value = 'Mỹ';
        document.getElementById('movie-actors').value = '';
        document.getElementById('movie-language').value = 'Tiếng Anh, phụ đề tiếng Việt';
        document.getElementById('movie-description').value = '';
    }

    modal.classList.add('open');
}

async function saveMovie(e) {
    e.preventDefault();
    const id = document.getElementById('movie-id').value;
    const payload = {
        title: document.getElementById('movie-title').value,
        genre: document.getElementById('movie-genre').value,
        duration_minutes: document.getElementById('movie-duration').value,
        age_rating: document.getElementById('movie-age').value,
        status: document.getElementById('movie-status').value,
        rating: document.getElementById('movie-rating').value,
        release_date_text: document.getElementById('movie-release').value,
        trailer_url: document.getElementById('movie-trailer').value,
        poster_url: document.getElementById('movie-poster').value,
        director: document.getElementById('movie-director').value,
        country: document.getElementById('movie-country').value,
        actors: document.getElementById('movie-actors').value,
        language: document.getElementById('movie-language').value,
        description: document.getElementById('movie-description').value
    };

    try {
        const res = await apiFetch(id ? `/api/admin/movies/${id}` : '/api/admin/movies', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        closeModal('movieModal');
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteMovie(id, title) {
    if (!confirm(`Bạn có chắc chắn muốn xóa phim "${title}" không?`)) return;
    try {
        const res = await apiFetch(`/api/admin/movies/${id}`, { method: 'DELETE' });
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// 3. CRUD SUẤT CHIẾU
// ==========================================
function populateShowFiltersAndSelects() {
    const movieFilter = document.getElementById('showMovieFilter');
    const cinemaFilter = document.getElementById('showCinemaFilter');

    if (movieFilter) {
        const current = movieFilter.value;
        movieFilter.innerHTML = `<option value="all">Tất cả phim</option>` +
            state.movies.map(m => `<option value="${m.movie_id}">${m.title}</option>`).join('');
        movieFilter.value = current || 'all';
    }

    if (cinemaFilter) {
        const current = cinemaFilter.value;
        cinemaFilter.innerHTML = `<option value="all">Tất cả rạp</option>` +
            state.cinemas.map(c => `<option value="${c.cinema_id}">${c.cluster_name ? c.cluster_name + ' - ' : ''}${c.name}</option>`).join('');
        cinemaFilter.value = current || 'all';
    }
}

function renderShowStatusBadge(status) {
    if (status === 'scheduled') return `<span class="badge badge-success">Mở bán</span>`;
    if (status === 'finished') return `<span class="badge badge-muted">Đã chiếu</span>`;
    return `<span class="badge badge-danger">Đã hủy</span>`;
}

function formatShowFormat(fmt) {
    if (fmt === '2d_dubbed') return '2D Lồng tiếng';
    if (fmt === '3D') return '3D Phụ đề';
    return '2D Phụ đề';
}

function renderShowsTable() {
    const tbody = document.getElementById('showtime-table');
    if (!tbody) return;

    const mFilter = document.getElementById('showMovieFilter')?.value || 'all';
    const cFilter = document.getElementById('showCinemaFilter')?.value || 'all';
    const sFilter = document.getElementById('showStatusFilter')?.value || 'all';

    const filtered = state.shows.filter(s => {
        if (mFilter !== 'all' && String(s.movie_id) !== mFilter) return false;
        if (cFilter !== 'all' && String(s.cinema_id) !== cFilter) return false;
        if (sFilter !== 'all' && s.status !== sFilter) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#64748B;">Chưa có suất chiếu nào phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => `
        <tr>
            <td>#${s.show_id}</td>
            <td><strong>${s.movie_title}</strong></td>
            <td>${s.cinema_name}<br><small class="text-muted">${s.hall_name}</small></td>
            <td>
                <strong>${s.start_time.slice(11, 16)}</strong> → ${s.end_time.slice(11, 16)}
                <div class="text-muted">${s.start_time.slice(0, 10)}</div>
            </td>
            <td>${formatShowFormat(s.show_format)}</td>
            <td><strong>${formatCurrency(s.base_price)}</strong></td>
            <td>${s.booked_seats} / ${s.total_seats}</td>
            <td>${renderShowStatusBadge(s.status)}</td>
            <td>
                <div class="action-group">
                    <button type="button" class="btn btn-light btn-sm" onclick="openShowModal(${s.show_id})">Sửa</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteShow(${s.show_id})">Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openShowModal(showId = null) {
    const modal = document.getElementById('showModal');
    const movieSelect = document.getElementById('show-movie');
    const cinemaSelect = document.getElementById('show-cinema');

    movieSelect.innerHTML = state.movies
        .filter(m => m.status !== 'ended' || showId)
        .map(m => `<option value="${m.movie_id}" data-duration="${m.duration_minutes || 120}">${m.title} (${m.duration_minutes || 120} phút)</option>`)
        .join('');

    cinemaSelect.innerHTML = state.cinemas
        .map(c => `<option value="${c.cinema_id}">${c.cluster_name ? c.cluster_name + ' - ' : ''}${c.name}</option>`)
        .join('');

    if (showId) {
        const s = state.shows.find(x => Number(x.show_id) === Number(showId));
        if (!s) return;
        document.getElementById('showModalTitle').textContent = `Cập Nhật Suất Chiếu #${s.show_id}`;
        document.getElementById('show-id').value = s.show_id;
        movieSelect.value = s.movie_id;
        cinemaSelect.value = s.cinema_id;
        populateShowHalls(s.hall_id);
        document.getElementById('show-start').value = s.start_time.replace(' ', 'T').slice(0, 16);
        document.getElementById('show-end').value = s.end_time.replace(' ', 'T').slice(0, 16);
        document.getElementById('show-format').value = s.show_format || '2d_subtitled';
        document.getElementById('show-price').value = s.base_price;
        document.getElementById('show-status').value = s.status;
    } else {
        document.getElementById('showModalTitle').textContent = 'Tạo Suất Chiếu Mới';
        document.getElementById('show-id').value = '';
        populateShowHalls();
        const tomorrow = new Date(Date.now() + 3600 * 1000 * 2);
        const pad = n => String(n).padStart(2, '0');
        const defaultStart = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:00`;
        document.getElementById('show-start').value = defaultStart;
        document.getElementById('show-format').value = '2d_subtitled';
        document.getElementById('show-price').value = 75000;
        document.getElementById('show-status').value = 'scheduled';
        autoCalculateEndTime();
    }

    modal.classList.add('open');
}

function populateShowHalls(selectedHallId = null) {
    const cinemaId = Number(document.getElementById('show-cinema').value);
    const hallSelect = document.getElementById('show-hall');
    const halls = state.halls.filter(h => Number(h.cinema_id) === cinemaId);

    hallSelect.innerHTML = halls.length > 0
        ? halls.map(h => `<option value="${h.hall_id}">${h.hall_name} (${h.seat_count} ghế)</option>`).join('')
        : `<option value="">Rạp này chưa có phòng chiếu</option>`;

    if (selectedHallId) hallSelect.value = selectedHallId;
}

function autoCalculateEndTime() {
    const startVal = document.getElementById('show-start').value;
    const movieSelect = document.getElementById('show-movie');
    if (!startVal || !movieSelect.selectedOptions.length) return;

    const duration = Number(movieSelect.selectedOptions[0].dataset.duration || 120);
    const startDate = new Date(startVal);
    if (isNaN(startDate.getTime())) return;

    const endDate = new Date(startDate.getTime() + (duration + 15) * 60000); // +15p dọn phòng
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('show-end').value =
        `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
}

async function saveShow(e) {
    e.preventDefault();
    const id = document.getElementById('show-id').value;
    const payload = {
        movie_id: document.getElementById('show-movie').value,
        hall_id: document.getElementById('show-hall').value,
        start_time: document.getElementById('show-start').value,
        end_time: document.getElementById('show-end').value,
        show_format: document.getElementById('show-format').value,
        base_price: document.getElementById('show-price').value,
        status: document.getElementById('show-status').value
    };

    try {
        const res = await apiFetch(id ? `/api/admin/shows/${id}` : '/api/admin/shows', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        closeModal('showModal');
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteShow(id) {
    if (!confirm(`Xác nhận xóa suất chiếu #${id}?`)) return;
    try {
        const res = await apiFetch(`/api/admin/shows/${id}`, { method: 'DELETE' });
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// 4. QUẢN LÝ RẠP, PHÒNG & SƠ ĐỒ GHẾ
// ==========================================
function populateCinemaHallSelectors() {
    const cinemaSel = document.getElementById('adminCinemaSelect');
    const hallModalCinemaSel = document.getElementById('hall-cinema-id');

    if (cinemaSel) {
        const prev = cinemaSel.value;
        cinemaSel.innerHTML = state.cinemas
            .map(c => `<option value="${c.cinema_id}">${c.cluster_name ? c.cluster_name + ' - ' : ''}${c.name}</option>`)
            .join('');
        if (prev && state.cinemas.some(c => String(c.cinema_id) === prev)) {
            cinemaSel.value = prev;
        }
        onSelectAdminCinema();
    }

    if (hallModalCinemaSel) {
        hallModalCinemaSel.innerHTML = state.cinemas
            .map(c => `<option value="${c.cinema_id}">${c.name}</option>`)
            .join('');
    }
}

function onSelectAdminCinema() {
    const cinemaId = Number(document.getElementById('adminCinemaSelect')?.value);
    const hallSel = document.getElementById('adminHallSelect');
    if (!hallSel) return;

    const prevHall = hallSel.value;
    const halls = state.halls.filter(h => Number(h.cinema_id) === cinemaId);

    hallSel.innerHTML = halls.length > 0
        ? halls.map(h => `<option value="${h.hall_id}">${h.hall_name}</option>`).join('')
        : `<option value="">Chưa có phòng chiếu</option>`;

    if (prevHall && halls.some(h => String(h.hall_id) === prevHall)) {
        hallSel.value = prevHall;
    }

    populateHallShowDropdown();
    loadHallSeats();
}

function populateHallShowDropdown() {
    const hallId = Number(document.getElementById('adminHallSelect')?.value);
    const showSel = document.getElementById('adminHallShowSelect');
    if (!showSel) return;

    const prev = showSel.value;
    const hallShows = state.shows.filter(s => Number(s.hall_id) === hallId && s.status === 'scheduled');

    showSel.innerHTML = `<option value="">-- Chế độ cấu hình loại ghế --</option>` +
        hallShows.map(s => `<option value="${s.show_id}">${s.movie_title} (${s.start_time.slice(11, 16)} ${s.start_time.slice(0, 10)})</option>`).join('');

    if (prev && hallShows.some(s => String(s.show_id) === prev)) {
        showSel.value = prev;
    }
}

async function loadHallSeats() {
    const hallId = Number(document.getElementById('adminHallSelect')?.value);
    const showId = document.getElementById('adminHallShowSelect')?.value || '';
    const grid = document.getElementById('seat-grid');
    const titleEl = document.getElementById('room-title');
    const counterEl = document.getElementById('seatCounterBadge');

    if (!hallId || !grid) {
        if (grid) grid.innerHTML = `<p class="text-muted">Vui lòng chọn hoặc tạo mới phòng chiếu.</p>`;
        return;
    }

    const hallObj = state.halls.find(h => Number(h.hall_id) === hallId);
    if (titleEl && hallObj) {
        titleEl.textContent = `Sơ Đồ Ghế - ${hallObj.cinema_name} (${hallObj.hall_name})`;
    }

    try {
        const url = `/api/admin/halls/${hallId}/seats${showId ? `?showId=${showId}` : ''}`;
        const res = await apiFetch(url);
        state.currentSeats = res.data;

        if (counterEl) counterEl.textContent = `${state.currentSeats.length} ghế`;

        if (state.currentSeats.length === 0) {
            grid.innerHTML = `<p class="text-muted" style="padding: 24px 0;">Phòng chiếu này chưa có ghế nào. Nhấn <strong>"Khởi tạo 44 ghế chuẩn"</strong> ở cột bên trái.</p>`;
            return;
        }

        // Nhóm ghế theo hàng (row_label)
        const grouped = {};
        state.currentSeats.forEach(seat => {
            if (!grouped[seat.row_label]) grouped[seat.row_label] = [];
            grouped[seat.row_label].push(seat);
        });

        grid.innerHTML = Object.keys(grouped).sort().map(row => `
            <div class="seat-row">
                <span class="seat-row-label">${row}</span>
                ${grouped[row].map(s => {
                    const cls = s.booking_status !== 'available' ? s.booking_status : s.seat_type;
                    const title = s.booking_status !== 'available'
                        ? `Ghế ${s.seat_label} (${s.booking_status === 'paid' ? 'Đã thanh toán' : 'Đang giữ chỗ'})`
                        : `Ghế ${s.seat_label} - Loại: ${s.seat_type.toUpperCase()} (Click để đổi loại)`;
                    return `<button type="button" class="seat-btn ${cls}" title="${title}" onclick="cycleSeatType(${s.seat_id}, '${s.seat_type}', '${s.booking_status}')">${s.seat_label}</button>`;
                }).join('')}
            </div>
        `).join('');
    } catch (error) {
        console.error('Lỗi loadHallSeats:', error);
    }
}

async function cycleSeatType(seatId, currentType, bookingStatus) {
    if (bookingStatus !== 'available') {
        showToast('Ghế này đang có người đặt/giữ chỗ nên không thể đổi loại!', 'error');
        return;
    }
    const order = ['standard', 'vip', 'couple'];
    const nextType = order[(order.indexOf(currentType) + 1) % order.length];

    try {
        await apiFetch(`/api/admin/seats/${seatId}`, {
            method: 'PUT',
            body: JSON.stringify({ seat_type: nextType })
        });
        await loadHallSeats();
        showToast(`Đã đổi loại ghế sang ${nextType.toUpperCase()}`);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function generateDefaultSeats() {
    const hallId = Number(document.getElementById('adminHallSelect')?.value);
    if (!hallId) return;
    try {
        const res = await apiFetch(`/api/admin/halls/${hallId}/seats/generate`, { method: 'POST' });
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openCinemaModal() {
    document.getElementById('cinemaModal').classList.add('open');
}

async function saveCinema(e) {
    e.preventDefault();
    try {
        const res = await apiFetch('/api/admin/cinemas', {
            method: 'POST',
            body: JSON.stringify({
                cluster_name: document.getElementById('cinema-cluster').value,
                name: document.getElementById('cinema-name').value,
                address: document.getElementById('cinema-address').value
            })
        });
        closeModal('cinemaModal');
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openHallModal() {
    document.getElementById('hallModal').classList.add('open');
}

async function saveHall(e) {
    e.preventDefault();
    try {
        const res = await apiFetch('/api/admin/halls', {
            method: 'POST',
            body: JSON.stringify({
                cinema_id: document.getElementById('hall-cinema-id').value,
                hall_name: document.getElementById('hall-name').value,
                auto_generate_seats: document.getElementById('hall-auto-seats').checked
            })
        });
        closeModal('hallModal');
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// 5. QUẢN LÝ ĐƠN ĐẶT VÉ
// ==========================================
function renderBookingBadge(status) {
    if (status === 'paid') return `<span class="badge badge-success">Đã thanh toán</span>`;
    if (status === 'pending') return `<span class="badge badge-warning">Chờ thanh toán</span>`;
    if (status === 'cancelled') return `<span class="badge badge-danger">Đã hủy</span>`;
    return `<span class="badge badge-muted">Hết hạn</span>`;
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookings-table');
    if (!tbody) return;

    const kw = (document.getElementById('bookingSearchInput')?.value || '').trim().toLowerCase();
    const stFilter = document.getElementById('bookingStatusFilter')?.value || 'all';

    const filtered = state.bookings.filter(b => {
        if (stFilter !== 'all' && b.status !== stFilter) return false;
        if (kw && !`#${b.booking_id} ${b.full_name} ${b.email} ${b.movie_title || ''} ${b.combo_summary || ''}`.toLowerCase().includes(kw)) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#64748B;">Không có đơn đặt vé nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => `
        <tr>
            <td><strong>#${b.booking_id}</strong></td>
            <td><strong>${b.full_name}</strong><br><small class="text-muted">${b.email}</small></td>
            <td><strong>${b.movie_title || '-'}</strong></td>
            <td>${b.cinema_name || '-'} (${b.hall_name || '-'})<br><small class="text-muted">${b.show_time || '-'}</small></td>
            <td><strong>${b.seats || '-'}</strong> (${b.ticket_count} vé)</td>
            <td>${b.combo_summary ? `${b.combo_summary}<br><small class="text-muted">+${formatCurrency(b.combo_amount)}</small>` : '<span class="text-muted">Không có</span>'}</td>
            <td><strong>${formatCurrency(b.total_amount)}</strong></td>
            <td><small>${b.booking_time}</small></td>
            <td>${renderBookingBadge(b.status)}</td>
            <td>
                <div class="action-group">
                    ${b.status !== 'paid' ? `<button type="button" class="btn btn-success btn-sm" onclick="changeBookingStatus(${b.booking_id}, 'paid')">Duyệt TT</button>` : ''}
                    ${b.status !== 'cancelled' ? `<button type="button" class="btn btn-danger btn-sm" onclick="changeBookingStatus(${b.booking_id}, 'cancelled')">Hủy đơn</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function changeBookingStatus(bookingId, status) {
    const label = status === 'paid' ? 'xác nhận đã thanh toán' : 'hủy đơn và giải phóng ghế';
    if (!confirm(`Xác nhận ${label} cho đơn #${bookingId}?`)) return;

    try {
        const res = await apiFetch(`/api/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast(res.message);
        await syncAllData(false);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

// ==========================================
// KHỞI CHẠY TRANG ADMIN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
    if (!user || !window.AuthService.isAdmin()) return;

    const nameEl = document.getElementById('adminName');
    const avatarEl = document.getElementById('adminAvatar');
    if (nameEl) nameEl.textContent = user.full_name;
    if (avatarEl) avatarEl.textContent = (user.full_name || 'A').charAt(0).toUpperCase();

    await syncAllData(false);
    initRealtimeStream();
});
