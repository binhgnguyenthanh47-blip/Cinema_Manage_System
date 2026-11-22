
const pool = require('./config/db');

async function testConnection() {
    try {
        const [rows] = await pool.query(
            'SELECT DATABASE() AS database_name, COUNT(*) AS total_movies FROM Movies'
        );

        console.log('Kết nối MySQL thành công!');
        console.log('Database:', rows[0].database_name);
        console.log('Số phim:', rows[0].total_movies);
    } catch (error) {
        console.error('Kết nối hoặc truy vấn thất bại:');
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

testConnection();
