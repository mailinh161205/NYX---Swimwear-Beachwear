<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    // Kiểm tra và chuyển đổi encoding cho session data nếu cần
    $user_name = $_SESSION['user_name'] ?? '';
    $user_email = $_SESSION['user_email'] ?? '';
    
    if (!mb_check_encoding($user_name, 'UTF-8')) {
        $user_name = mb_convert_encoding($user_name, 'UTF-8', 'ISO-8859-1');
        $_SESSION['user_name'] = $user_name;
    }
    
    if (!mb_check_encoding($user_email, 'UTF-8')) {
        $user_email = mb_convert_encoding($user_email, 'UTF-8', 'ISO-8859-1');
        $_SESSION['user_email'] = $user_email;
    }
    
    echo json_encode([
        'loggedIn' => true,
        'fullname' => $user_name,
        'email' => $user_email,
        'userId' => $_SESSION['user_id']
    ], JSON_UNESCAPED_UNICODE);
} else {
    // Check for cookie if available
    if (isset($_COOKIE['nyx_user'])) {
        $user_data = json_decode($_COOKIE['nyx_user'], true);
        if ($user_data) {
            // Restore session from cookie
            $_SESSION['user_id'] = $user_data['id'] ?? '';
            $_SESSION['user_name'] = $user_data['name'] ?? '';
            $_SESSION['user_email'] = $user_data['email'] ?? '';
            $_SESSION['logged_in'] = true;
            
            echo json_encode([
                'loggedIn' => true,
                'fullname' => $user_data['name'] ?? '',
                'email' => $user_data['email'] ?? '',
                'userId' => $user_data['id'] ?? ''
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    
    echo json_encode([
        'loggedIn' => false
    ], JSON_UNESCAPED_UNICODE);
}
?>