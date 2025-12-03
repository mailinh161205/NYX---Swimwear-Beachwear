<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

// Destroy session
session_unset();
session_destroy();

// Delete cookie
if (isset($_COOKIE['nyx_user'])) {
    setcookie('nyx_user', '', time() - 3600, '/');
}

echo json_encode([
    'status' => 'success',
    'message' => 'Successfully logged out!'
], JSON_UNESCAPED_UNICODE);
?>