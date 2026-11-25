const AUTH_STORAGE_KEY = 'cinema_current_user';

const AuthService = {
  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && String(user.role || '').trim().toLowerCase() === 'admin');
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    const inAdminFolder = window.location.pathname.includes('/admin/');
    window.location.href = inAdminFolder ? '../auth.html' : 'auth.html';
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục đặt vé!');
      window.location.href = 'auth.html';
    }
  },

  requireAdmin() {
    const user = this.getCurrentUser();
    if (!user) {
      alert('Vui lòng đăng nhập bằng tài khoản Quản trị viên!');
      window.location.href = '../auth.html';
      return false;
    }
    if (!this.isAdmin()) {
      alert('Bạn không có quyền truy cập trang Quản trị!');
      window.location.href = '../index.html';
      return false;
    }
    return true;
  },

  renderHeaderAccount() {
    const taiKhoanBox = document.getElementById('taiKhoan');
    if (!taiKhoanBox) return;

    const user = this.getCurrentUser();
    if (user) {
      const adminBtn = this.isAdmin()
        ? `<a href="admin/index.html" class="nut nut--admin" title="Mở bảng điều khiển Quản trị">⚙ Trang Quản Trị</a>`
        : '';
      taiKhoanBox.innerHTML = `
        ${adminBtn}
        <span class="dau-trang__chao">Xin chào, ${user.full_name}</span>
        <button type="button" class="nut nut--phu" onclick="AuthService.logout()">Đăng xuất</button>
      `;
    } else {
      taiKhoanBox.innerHTML = `
        <a href="auth.html" class="nut">Đăng nhập</a>
        <a href="auth.html#register" class="nut nut--chinh">Đăng ký</a>
      `;
    }
  }
};

window.AuthService = AuthService;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.renderHeaderAccount();

  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  const alertBox = document.getElementById('authAlert');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (!loginForm || !registerForm) return;

  if (window.location.hash === '#register') {
    const regTab = document.querySelector('.auth-tab[data-target="registerForm"]');
    if (regTab) {
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      regTab.classList.add('active');
      registerForm.classList.add('active');
    }
  }

  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `auth-alert ${type}`;
  }

  function clearAlert() {
    alertBox.textContent = '';
    alertBox.className = 'auth-alert';
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      clearAlert();
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // ĐĂNG NHẬP QUA API /api/auth/login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAlert(data.message || 'Email hoặc mật khẩu không chính xác!', 'error');
        return;
      }

      const sessionUser = {
        user_id: data.user.user_id,
        full_name: data.user.full_name,
        email: data.user.email,
        role: data.user.role
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));

      showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');

      setTimeout(() => {
        if (String(sessionUser.role || '').toLowerCase() === 'admin') {
          window.location.href = 'admin/index.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 600);
    } catch (error) {
      console.error('Lỗi kết nối API Login:', error);
      showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại!', 'error');
    }
  });

  // ĐĂNG KÝ QUA API /api/auth/register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const full_name = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
      showAlert('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAlert(data.message || 'Đăng ký thất bại!', 'error');
        return;
      }

      showAlert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
      registerForm.reset();

      setTimeout(() => {
        document.querySelector('.auth-tab[data-target="loginForm"]').click();
        document.getElementById('loginEmail').value = email;
      }, 800);
    } catch (error) {
      console.error('Lỗi kết nối API Register:', error);
      showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại!', 'error');
    }
  });
});
