<?php
// NO white/empty lines before <?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$servername = "sql100.infinityfree.com";
$username = "if0_40586459";
$password = "FHl10gOB3U5L";
$dbname = "if0_40586459_nyx_store";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // KHÔNG đặt charset ở đây, để MySQL tự động xử lý
    // Hoặc đặt là utf8mb4 (phổ biến nhất)
    $conn->set_charset("utf8mb4");
    
    // Thêm dòng này để đảm bảo encoding
    $conn->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    
} catch (mysqli_sql_exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Khai báo kiểu cho PHPStan/Editor (nếu cần)
/** @var mysqli $conn */
?>