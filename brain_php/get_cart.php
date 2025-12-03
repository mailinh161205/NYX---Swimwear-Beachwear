<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'db_connect.php';

// CHECK LOGIN
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Please log in to view the cart.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    // JOIN CART AND PRODUCTS TABLES - KHÔNG DÙNG COLLATE
    $sql = "SELECT 
                c.id AS cart_id, 
                c.quantity, 
                c.size, 
                c.color, 
                p.id AS product_id, 
                p.name, 
                p.price, 
                p.image_main,
                p.category,
                p.status
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();

    $cart_items = [];
    $total_items = 0;
    $total_price = 0;
    
    while ($row = $result->fetch_assoc()) {
        // CHUYỂN ĐỔI ENCODING NẾU CẦN
        $row = convertArrayToUTF8($row);
        
        // FIX IMAGE PATH
        $row['image_main'] = fixImagePath($row['image_main']);
        
        // Tính tổng tiền cho từng sản phẩm
        $row['item_total'] = $row['price'] * $row['quantity'];
        $total_price += $row['item_total'];
        
        $cart_items[] = $row;
        $total_items += $row['quantity'];
    }

    echo json_encode([
        'success' => true, 
        'cart' => $cart_items,
        'total_items' => $total_items,
        'total_price' => $total_price
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();

} catch (Exception $e) {
    error_log("Error in get_cart.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}

// FUNCTION TO FIX IMAGE PATH
function fixImagePath($imgPath) {
    if (empty($imgPath)) return '../img/no-image.jpg';
    
    // CHUYỂN ĐỔI ENCODING TRƯỚC
    $imgPath = convertArrayToUTF8($imgPath);
    
    // Case 1: ./img/ -> ../img/
    if (strpos($imgPath, './img/') === 0) {
        return '../img/' . substr($imgPath, 6);
    }
    
    // Case 2: img/ (without ./) -> ../img/
    if (strpos($imgPath, 'img/') === 0 && !str_starts_with($imgPath, '../')) {
        return '../' . $imgPath;
    }
    
    // Case 3: Already has ../, keep unchanged
    if (str_starts_with($imgPath, '../')) {
        return $imgPath;
    }
    
    // Case 4: Any other path, prepend ../
    return '../' . $imgPath;
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