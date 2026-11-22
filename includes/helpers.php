<?php
/**
 * Ham tien ich dung chung.
 */

declare(strict_types=1);

// ===================== HTML / XSS =====================

/** Escape du lieu khi in ra HTML. */
function e(mixed $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Loc HTML tu editor (Quill) theo danh sach trang:
 * chi giu cac the dinh dang co ban, bo moi thuoc tinh nguy hiem
 * (onclick, style, javascript: ...). Chong XSS.
 */
function sanitize_html(string $html): string
{
    $html = trim($html);
    if ($html === '') {
        return '';
    }

    $allowedTags = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'h4',
        'ul', 'ol', 'li', 'blockquote', 'a', 'span',
    ];

    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML(
        '<?xml encoding="UTF-8"><div id="__root">' . $html . '</div>',
        LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
    );
    libxml_clear_errors();

    $root = (new DOMXPath($doc))->query('//div[@id="__root"]')->item(0);
    if (!$root instanceof DOMElement) {
        return e(strip_tags($html));
    }

    $clean = function (DOMNode $node) use (&$clean, $allowedTags): void {
        // Duyet nguoc vi co the xoa/thay node con
        for ($i = $node->childNodes->length - 1; $i >= 0; $i--) {
            $child = $node->childNodes->item($i);

            if ($child instanceof DOMComment) {
                $node->removeChild($child);
                continue;
            }
            if (!$child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);

            // Xoa han cac the nguy hiem cung noi dung ben trong
            if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math'], true)) {
                $node->removeChild($child);
                continue;
            }

            $clean($child);

            if (!in_array($tag, $allowedTags, true)) {
                // The khong cho phep: giu lai noi dung, bo the
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
                continue;
            }

            // Xoa moi thuoc tinh, chi giu href an toan cho the <a>
            $href = $tag === 'a' ? trim($child->getAttribute('href')) : '';
            while ($child->attributes->length > 0) {
                $child->removeAttribute($child->attributes->item(0)->nodeName);
            }
            if ($tag === 'a') {
                if (preg_match('~^(https?://|mailto:)~i', $href)) {
                    $child->setAttribute('href', $href);
                    $child->setAttribute('target', '_blank');
                    $child->setAttribute('rel', 'noopener noreferrer');
                }
            }
        }
    };

    $clean($root);

    $result = '';
    foreach ($root->childNodes as $child) {
        $result .= $doc->saveHTML($child);
    }
    return trim($result);
}

/** Lay ma video YouTube tu link (watch?v=, youtu.be/, embed/) hoac ma truc tiep. */
function youtube_id(?string $value): string
{
    $value = trim((string) $value);
    if ($value === '') {
        return '';
    }
    if (preg_match('~^[A-Za-z0-9_-]{11}$~', $value)) {
        return $value;
    }
    if (preg_match('~(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})~', $value, $m)) {
        return $m[1];
    }
    return '';
}

// ===================== JSON API =====================

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_ok(mixed $data = null, string $message = '', int $status = 200, array $extra = []): never
{
    json_response(array_merge(['success' => true, 'message' => $message, 'data' => $data], $extra), $status);
}

function json_error(string $message, int $status = 400): never
{
    json_response(['success' => false, 'message' => $message], $status);
}

/**
 * Doc body JSON cua request POST.
 * Bat buoc Content-Type application/json: trinh duyet khong cho trang
 * web khac gui loai request nay ma khong qua CORS -> chong CSRF cho API.
 */
function read_json_body(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== 0) {
        json_error('Yêu cầu không hợp lệ.', 415);
    }

    $data = json_decode((string) file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function require_method(string ...$methods): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        json_error('Phương thức không được hỗ trợ.', 405);
    }
}

/** Bat loi chua xu ly trong API, tra JSON thay vi trang loi HTML. */
function api_guard(callable $handler): void
{
    try {
        $handler();
    } catch (PDOException $e) {
        error_log('[API] ' . $e->getMessage());
        json_error(APP_DEBUG ? $e->getMessage() : db_error_message($e), 500);
    } catch (Throwable $e) {
        error_log('[API] ' . $e->getMessage());
        json_error(APP_DEBUG ? $e->getMessage() : 'Lỗi hệ thống.', 500);
    }
}

// ===================== Kieu du lieu =====================

function int_param(mixed $value): ?int
{
    if (is_int($value)) {
        return $value > 0 ? $value : null;
    }
    if (is_string($value) && preg_match('/^[1-9][0-9]{0,17}$/', $value)) {
        return (int) $value;
    }
    return null;
}

function str_param(mixed $value, int $maxLength = 255): string
{
    if (!is_string($value) && !is_numeric($value)) {
        return '';
    }
    return mb_substr(trim((string) $value), 0, $maxLength);
}

// ===================== Admin: redirect, flash, CSRF =====================

function redirect(string $url): never
{
    header('Location: ' . $url);
    exit;
}

function flash(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function take_flashes(): array
{
    $messages = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $messages;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    $token = $_POST['csrf_token'] ?? '';
    if (!is_string($token) || !hash_equals(csrf_token(), $token)) {
        error_page(
            403,
            'Phiên làm việc đã hết hạn',
            'Biểu mẫu đã quá hạn hoặc không hợp lệ. Vui lòng tải lại trang và thử lại.',
            'javascript:history.back()',
            '← Quay lại'
        );
    }
}

/**
 * Trang bao loi co giao dien (dung cho trang Admin: 403, phien het han...).
 * Duong dan CSS tuong doi tu thu muc admin/.
 */
function error_page(int $status, string $title, string $message, string $linkHref, string $linkText): never
{
    http_response_code($status);
    ?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?> · Cinema Admin</title>
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="login-page">
<div class="login-card error-card">
    <div class="error-card__code"><?= $status ?></div>
    <h1><?= e($title) ?></h1>
    <p class="muted"><?= e($message) ?></p>
    <a class="btn btn--primary btn--block" href="<?= e($linkHref) ?>"><?= e($linkText) ?></a>
</div>
</body>
</html>
    <?php
    exit;
}

// ===================== Phan trang =====================

/**
 * Tinh thong tin phan trang.
 * @return array{page:int, per_page:int, total:int, pages:int, offset:int}
 */
function paginate(int $total, int $perPage, mixed $pageParam): array
{
    $pages = max(1, (int) ceil($total / $perPage));
    $page = int_param($pageParam) ?? 1;
    $page = min(max(1, $page), $pages);

    return [
        'page'     => $page,
        'per_page' => $perPage,
        'total'    => $total,
        'pages'    => $pages,
        'offset'   => ($page - 1) * $perPage,
    ];
}

/** Ve thanh phan trang, giu nguyen cac tham so tim kiem tren URL. */
function pagination_links(array $p): string
{
    if ($p['pages'] <= 1) {
        return '';
    }

    $query = $_GET;
    $link = function (int $page) use ($query): string {
        $query['page'] = $page;
        return '?' . http_build_query($query);
    };

    $html = '<nav class="pagination" aria-label="Phân trang">';
    $html .= $p['page'] > 1
        ? '<a href="' . e($link($p['page'] - 1)) . '" aria-label="Trang trước">&laquo;</a>'
        : '<span class="disabled">&laquo;</span>';

    $start = max(1, $p['page'] - 2);
    $end = min($p['pages'], $p['page'] + 2);

    if ($start > 1) {
        $html .= '<a href="' . e($link(1)) . '">1</a>';
        if ($start > 2) {
            $html .= '<span class="dots">…</span>';
        }
    }
    for ($i = $start; $i <= $end; $i++) {
        $html .= $i === $p['page']
            ? '<span class="current" aria-current="page">' . $i . '</span>'
            : '<a href="' . e($link($i)) . '">' . $i . '</a>';
    }
    if ($end < $p['pages']) {
        if ($end < $p['pages'] - 1) {
            $html .= '<span class="dots">…</span>';
        }
        $html .= '<a href="' . e($link($p['pages'])) . '">' . $p['pages'] . '</a>';
    }

    $html .= $p['page'] < $p['pages']
        ? '<a href="' . e($link($p['page'] + 1)) . '" aria-label="Trang sau">&raquo;</a>'
        : '<span class="disabled">&raquo;</span>';

    return $html . '</nav>';
}

// ===================== Upload anh =====================

/**
 * Chuan hoa mang $_FILES['field'] (nhieu file) thanh danh sach tung file.
 */
function normalize_files(?array $files): array
{
    if (!$files || !isset($files['name'])) {
        return [];
    }
    if (!is_array($files['name'])) {
        return [$files];
    }

    $list = [];
    foreach ($files['name'] as $i => $name) {
        $list[] = [
            'name'     => $name,
            'type'     => $files['type'][$i] ?? '',
            'tmp_name' => $files['tmp_name'][$i] ?? '',
            'error'    => $files['error'][$i] ?? UPLOAD_ERR_NO_FILE,
            'size'     => $files['size'][$i] ?? 0,
        ];
    }
    return $list;
}

/**
 * Luu 1 anh upload an toan:
 * - kiem tra loi upload, dung luong
 * - xac dinh dinh dang THAT bang finfo (khong tin ten file / MIME trinh duyet gui)
 * - dat ten ngau nhien, chi cho phep jpg/png/webp/gif
 * @return string duong dan tuong doi (vd: uploads/movies/abc.jpg)
 * @throws RuntimeException neu file khong hop le
 */
function save_uploaded_image(array $file): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload ảnh "' . ($file['name'] ?? '') . '" thất bại.');
    }
    if (($file['size'] ?? 0) > UPLOAD_MAX_BYTES) {
        throw new RuntimeException('Ảnh "' . $file['name'] . '" vượt quá ' . (UPLOAD_MAX_BYTES / 1024 / 1024) . ' MB.');
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('File upload không hợp lệ.');
    }

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']) ?: '';
    if (!isset($allowed[$mime]) || @getimagesize($file['tmp_name']) === false) {
        throw new RuntimeException('"' . $file['name'] . '" không phải ảnh JPG/PNG/WEBP/GIF.');
    }

    if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) {
        throw new RuntimeException('Không tạo được thư mục upload.');
    }

    $fileName = date('Ymd') . '_' . bin2hex(random_bytes(12)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . '/' . $fileName)) {
        throw new RuntimeException('Không lưu được ảnh.');
    }

    return UPLOAD_URL . '/' . $fileName;
}

/** Xoa file anh da upload (chi xoa file nam trong thu muc uploads). */
function delete_uploaded_image(?string $url): void
{
    if (!$url || !str_starts_with($url, UPLOAD_URL . '/')) {
        return;
    }
    $path = UPLOAD_DIR . '/' . basename($url);
    if (is_file($path)) {
        @unlink($path);
    }
}

// ===================== Suat chieu =====================

/**
 * Bieu thuc SQL tinh trang thai THUC TE cua suat chieu:
 * suat 'scheduled' da qua gio ket thuc thi coi la 'finished'.
 * (Tinh luc truy van nen luon dung theo gio hien tai, khong can job cap nhat DB.)
 */
function show_status_sql(string $alias = 's'): string
{
    return "(CASE WHEN {$alias}.status = 'scheduled' AND {$alias}.end_time < NOW()
                  THEN 'finished' ELSE {$alias}.status END)";
}

// ===================== Dinh dang =====================

function money(mixed $amount): string
{
    return number_format((float) $amount, 0, ',', '.') . 'đ';
}

function format_datetime(?string $value, string $format = 'd/m/Y H:i'): string
{
    if (!$value) {
        return '';
    }
    $time = strtotime($value);
    return $time ? date($format, $time) : '';
}
