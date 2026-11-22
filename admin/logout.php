<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

// Chi dang xuat bang POST co CSRF token (tranh bi dang xuat qua link gia mao)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    logout_user();
}

redirect('login.php');
