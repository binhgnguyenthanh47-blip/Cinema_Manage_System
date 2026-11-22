<?php
/**
 * API rap chieu
 *   GET api/cinemas.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

api_guard(function (): void {
    require_method('GET');

    $cinemas = db_all('SELECT cinema_id, name, address, cluster_name FROM cinemas ORDER BY cinema_id');
    foreach ($cinemas as &$c) {
        $c['cinema_id'] = (int) $c['cinema_id'];
    }

    json_ok($cinemas, '', 200, ['total' => count($cinemas)]);
});
