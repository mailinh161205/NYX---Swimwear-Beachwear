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
error_log("=== REGISTRATION ATTEMPT STARTED ===");

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

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

error_log("Name: $name, Email: $email");

// Validate data
if (empty($name) || empty($email) || empty($password)) {
    error_log("Validation failed: empty fields");
    echo json_encode([
        'status' => 'error',
        'message' => 'Please fill in all required information!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check valid name
if (!preg_match('/^[a-zA-ZÀ-ỹ\s]{2,}$/u', $name)) {
    error_log("Invalid name format: " . $name);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid name! Name must contain at least 2 characters and no numbers or special characters.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check valid email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_log("Invalid email format: " . $email);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid email address!'
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

// Check password strength
if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d).{6,}$/', $password)) {
    error_log("Password weak");
    echo json_encode([
        'status' => 'error',
        'message' => 'Password must include both letters and numbers!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    error_log("Database connection OK");
    
    // KHÔNG chuyển đổi encoding - để nguyên UTF-8
    $email_for_db = $email;
    $name_for_db = $name;
    
    // THỬ CÁC CÁCH QUERY KHÁC NHAU
    
    // Cách 1: Không dùng COLLATE
    $sql1 = "SELECT id FROM users WHERE email = ?";
    $stmt1 = $conn->prepare($sql1);
    if (!$stmt1) {
        throw new Exception("Prepare failed for SQL1: " . $conn->error);
    }
    
    $stmt1->bind_param("s", $email_for_db);
    $stmt1->execute();
    $result1 = $stmt1->get_result();
    
    if ($result1->num_rows > 0) {
        $stmt1->close();
        error_log("Email already exists: $email");
        echo json_encode([
            'status' => 'error',
            'message' => 'Email is already in use!'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $stmt1->close();
    error_log("Email not found, proceeding with registration");
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // THỬ INSERT với UTF-8 trực tiếp
    $sql_insert = "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())";
    $stmt_insert = $conn->prepare($sql_insert);
    if (!$stmt_insert) {
        throw new Exception("Prepare failed for INSERT: " . $conn->error);
    }
    
    $stmt_insert->bind_param("sss", $name_for_db, $email_for_db, $hashed_password);
    
    if ($stmt_insert->execute()) {
        error_log("Registration successful for: $email");
        echo json_encode([
            'status' => 'success',
            'message' => 'Registration successful! Please log in.'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        $error = $stmt_insert->error;
        error_log("Insert failed: " . $error);
        
        // THỬ LẠI với encoding khác nếu cần
        if (strpos($error, 'incorrect string value') !== false) {
            // Thử với latin1 encoding
            $email_latin1 = mb_convert_encoding($email, 'ISO-8859-1', 'UTF-8');
            $name_latin1 = mb_convert_encoding($name, 'ISO-8859-1', 'UTF-8');
            
            $stmt_insert2 = $conn->prepare($sql_insert);
            $stmt_insert2->bind_param("sss", $name_latin1, $email_latin1, $hashed_password);
            
            if ($stmt_insert2->execute()) {
                error_log("Registration successful with latin1 encoding");
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Registration successful! Please log in.'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                throw new Exception("Insert with latin1 failed: " . $stmt_insert2->error);
            }
            
            $stmt_insert2->close();
        } else {
            throw new Exception($error);
        }
    }
    
    if (isset($stmt_insert)) {
        $stmt_insert->close();
    }
    
} catch (Exception $e) {
    error_log("Exception in register.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>