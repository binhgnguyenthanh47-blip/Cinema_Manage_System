
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự!' });
    }

    // 1. Kiểm tra email đã tồn tại trong bảng users chưa
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email này đã được sử dụng!' });
    }

    // 2. Băm mật khẩu bằng bcryptjs trước khi lưu vào MySQL
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Thêm người dùng mới
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name.trim(), email.toLowerCase(), passwordHash, 'customer']
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      user: {
        user_id: result.insertId,
        full_name: full_name.trim(),
        email: email.toLowerCase(),
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Lỗi Register:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký!' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email và Mật khẩu!' });
    }

    const [rows] = await db.query(
      'SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    const user = rows[0];

    // Hỗ trợ kiểm tra cả mật khẩu đã băm bcrypt và mật khẩu mẫu chưa băm (nếu có trong dummy data)
    let isMatch = false;
    if (user.password_hash && user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = (user.password_hash === password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi Login:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập!' });
  }
};