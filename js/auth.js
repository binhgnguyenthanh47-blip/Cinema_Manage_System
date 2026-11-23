const AUTH_STORAGE_KEY = 'cinema_current_user';

const AuthService = {
  getCurrentUser() {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = 'auth.html';
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
      return;
    }
    if (user.role !== 'admin') {
      alert('Bạn không có quyền truy cập trang Quản trị!');
      window.location.href = '../index.html';
    }
  }
};

window.AuthService = AuthService;

document.addEventListener('DOMContentLoaded', () => {
  const taiKhoanBox = document.getElementById('taiKhoan');
  if (taiKhoanBox) {
    const user = AuthService.getCurrentUser();
    if (user) {
      const adminBtn = user.role === 'admin'
        ? `<a href="admin/index.html" class="nut" style="margin-right: 8px;">Quản trị</a>`
        : '';
      taiKhoanBox.innerHTML = `
        ${adminBtn}
        <span style="margin-right: 10px; font-weight: 600; color: var(--chinh);">${user.full_name}</span>
        <button type="button" class="nut nut--phu" onclick="AuthService.logout()">Đăng xuất</button>
      `;
    } else {
      taiKhoanBox.innerHTML = `<a href="auth.html" class="nut nut--chinh">Đăng nhập</a>`;
    }
  }

  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  const alertBox = document.getElementById('authAlert');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (!loginForm || !registerForm) return;

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
        if (sessionUser.role === 'admin') {
          window.location.href = 'admin/index.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 700);
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
      }, 900);
    } catch (error) {
      console.error('Lỗi kết nối API Register:', error);
      showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại!', 'error');
    }
  });
});