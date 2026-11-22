<?php
/**
 * Ket noi MySQL bang PDO (prepared statement chong SQL injection).
 */

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            DB_HOST,
            DB_PORT,
            DB_NAME
        );

        $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        // Luu y: moi so sanh thoi gian (het han giu ghe...) deu dung NOW() cua MySQL
        // de dong bo voi event ev_expire_bookings chay tren server MySQL.
    }

    return $pdo;
}

/** Chay cau truy van co tham so, tra ve PDOStatement. */
function db_query(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function db_all(string $sql, array $params = []): array
{
    return db_query($sql, $params)->fetchAll();
}

function db_one(string $sql, array $params = []): ?array
{
    $row = db_query($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function db_value(string $sql, array $params = []): mixed
{
    $value = db_query($sql, $params)->fetchColumn();
    return $value === false ? null : $value;
}

/** Goi stored procedure va dong cursor (bat buoc voi MySQL). */
function db_call(string $sql, array $params = []): void
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    // closeCursor doc bo moi result set con lai cua CALL, giai phong ket noi
    $stmt->closeCursor();
}

/**
 * Lay thong bao loi than thien tu loi MySQL:
 * - SIGNAL SQLSTATE '45000' trong trigger/procedure
 * - Vi pham khoa ngoai / trung gia tri unique
 */
function db_error_message(PDOException $e): string
{
    $info = $e->errorInfo ?? [];
    $sqlState = $info[0] ?? $e->getCode();
    $driverCode = (int) ($info[1] ?? 0);

    if ($sqlState === '45000' && !empty($info[2])) {
        return (string) $info[2];
    }
    if ($driverCode === 1062) {
        return 'Dữ liệu bị trùng (đã tồn tại).';
    }
    if ($driverCode === 1451) {
        return 'Không thể xóa vì đang có dữ liệu khác liên kết tới.';
    }
    if ($driverCode === 1452) {
        return 'Dữ liệu liên kết không tồn tại.';
    }
    if ($driverCode === 3819) {
        return 'Dữ liệu không thỏa ràng buộc kiểm tra.';
    }
    return 'Lỗi cơ sở dữ liệu.';
}
