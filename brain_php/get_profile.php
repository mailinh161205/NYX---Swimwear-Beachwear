<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

if (!isset($_SESSION['user_id']) || !$_SESSION['logged_in']) {
    echo json_encode(['loggedIn' => false], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once 'db_connect.php';

$user_id = $_SESSION['user_id'];

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    // Fetch all user information from the database (INCLUDING avatar)
    // KHÔNG dùng COLLATE, sử dụng UTF-8 trực tiếp
    $stmt = $conn->prepare("SELECT id, name, email, phone, gender, date_of_birth, address, avatar, created_at FROM users WHERE id = ?");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // CHUYỂN ĐỔI ENCODING TỪ latin1 SANG UTF-8 (nếu cần)
        $user = convertArrayToUTF8($user);
        
        // Format the returned data
        $response = [
            'loggedIn' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'] ?? '',
                'gender' => $user['gender'] ?? '',
                'date_of_birth' => $user['date_of_birth'] ?? '',
                'address' => $user['address'] ?? '',
                'avatar' => $user['avatar'] ?? '',
                'join_date' => date('d/m/Y', strtotime($user['created_at']))
            ]
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['loggedIn' => false, 'message' => 'User not found'], JSON_UNESCAPED_UNICODE);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Error in get_profile.php: " . $e->getMessage());
    echo json_encode(['loggedIn' => false, 'error' => 'An error occurred: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}

// HÀM CHUYỂN ĐỔI ENCODING CHO MẢNG (ĐỆ QUY)
function convertArrayToUTF8($array) {
    if (!is_array($array)) {
        // Nếu không phải mảng, kiểm tra và chuyển đổi nếu là chuỗi
        if (is_string($array)) {
            // Kiểm tra encoding, nếu không phải UTF-8 thì chuyển đổi từ ISO-8859-1 sang UTF-8
            if (!mb_check_encoding($array, 'UTF-8')) {
                return mb_convert_encoding($array, 'UTF-8', 'ISO-8859-1');
            }
        }
        return $array;
    }
    
    foreach ($array as $key => $value) {
        $array[$key] = convertArrayToUTF8($value);
    }
    
    return $array;
}
?>