<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Bật lỗi để debug
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Database connection
require_once 'db_connect.php';

// Ghi log
error_log("=== LOGIN ATTEMPT STARTED ===");

// Receive data from client
$input = file_get_contents('php://input');
error_log("Raw input: " . $input);
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON decode error: " . json_last_error_msg());
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON data.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$remember = $data['remember'] ?? false;

error_log("Email: $email, Remember: " . ($remember ? 'true' : 'false'));

// Validate data
if (empty($email) || empty($password)) {
    error_log("Validation failed: empty email or password");
    echo json_encode([
        'status' => 'error',
        'message' => 'Please fill in all required information!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check valid email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_log("Invalid email format: " . $email);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid email format!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check password length
if (strlen($password) < 6) {
    error_log("Password too short");
    echo json_encode([
        'status' => 'error',
        'message' => 'Password must be at least 6 characters long!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    error_log("Database connection OK");

    // THỬ CÁC CÁCH QUERY KHÁC NHAU
    $found_user = null;
    
    // Cách 1: Dùng UTF-8 trực tiếp
    $sql1 = "SELECT id, name, email, password FROM users WHERE email = ?";
    $stmt1 = $conn->prepare($sql1);
    if ($stmt1) {
        $stmt1->bind_param("s", $email);
        $stmt1->execute();
        $result1 = $stmt1->get_result();
        if ($result1->num_rows > 0) {
            $found_user = $result1->fetch_assoc();
            error_log("Found user with UTF-8 direct query");
        }
        $stmt1->close();
    } else {
        error_log("Prepare failed for SQL1: " . $conn->error);
    }
    
    // Cách 2: Thử với BINARY comparison
    if (!$found_user) {
        $sql2 = "SELECT id, name, email, password FROM users WHERE BINARY email = ?";
        $stmt2 = $conn->prepare($sql2);
        if ($stmt2) {
            $stmt2->bind_param("s", $email);
            $stmt2->execute();
            $result2 = $stmt2->get_result();
            if ($result2->num_rows > 0) {
                $found_user = $result2->fetch_assoc();
                error_log("Found user with BINARY comparison");
            }
            $stmt2->close();
        }
    }
    
    // Cách 3: Thử với latin1 encoding
    if (!$found_user) {
        $email_latin1 = mb_convert_encoding($email, 'ISO-8859-1', 'UTF-8');
        $sql3 = "SELECT id, name, email, password FROM users WHERE email = ?";
        $stmt3 = $conn->prepare($sql3);
        if ($stmt3) {
            $stmt3->bind_param("s", $email_latin1);
            $stmt3->execute();
            $result3 = $stmt3->get_result();
            if ($result3->num_rows > 0) {
                $found_user = $result3->fetch_assoc();
                error_log("Found user with latin1 encoding");
            }
            $stmt3->close();
        }
    }
    
    if (!$found_user) {
        error_log("No user found with email: $email");
        echo json_encode([
            'status' => 'error',
            'message' => 'Incorrect email or password!'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    error_log("User found: ID=" . $found_user['id'] . ", Email=" . $found_user['email']);
    
    // Check password
    if (password_verify($password, $found_user['password'])) {
        error_log("Password verified successfully");
        
        // Không cần chuyển đổi encoding nếu dữ liệu đã là UTF-8
        // Nếu cần, thử chuyển đổi
        if (!mb_check_encoding($found_user['name'], 'UTF-8')) {
            $found_user['name'] = mb_convert_encoding($found_user['name'], 'UTF-8', 'ISO-8859-1');
            $found_user['email'] = mb_convert_encoding($found_user['email'], 'UTF-8', 'ISO-8859-1');
        }
        
        // Save user information to session
        $_SESSION['user_id'] = $found_user['id'];
        $_SESSION['user_name'] = $found_user['name'];
        $_SESSION['user_email'] = $found_user['email'];
        $_SESSION['logged_in'] = true;
        
        // If "Remember me" is checked, set cookie
        if ($remember) {
            $cookie_value = json_encode([
                'id' => $found_user['id'],
                'name' => $found_user['name'],
                'email' => $found_user['email']
            ], JSON_UNESCAPED_UNICODE);
            setcookie('nyx_user', $cookie_value, time() + (30 * 24 * 60 * 60), '/');
        }
        
        // Remove password before returning
        unset($found_user['password']);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful!',
            'user' => $found_user
        ], JSON_UNESCAPED_UNICODE);
    } else {
        error_log("Password verification failed");
        echo json_encode([
            'status' => 'error',
            'message' => 'Incorrect email or password!'
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    error_log("Exception in login.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>