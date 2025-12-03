<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'db_connect.php';

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    // Lấy và validate parameters
    $category = $_GET['category'] ?? '';
    $max_price = isset($_GET['max_price']) ? (float)$_GET['max_price'] : 2000000;
    $rating = isset($_GET['rating']) ? (float)$_GET['rating'] : 0;
    $sort = $_GET['sort'] ?? 'newest';
    $status = $_GET['status'] ?? '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
    $on_sale = $_GET['on_sale'] ?? '';
    $search = $_GET['search'] ?? '';

    // Build SQL query - KHÔNG DÙNG COLLATE
    $sql = "SELECT * FROM products WHERE 1=1";
    $params = [];
    $types = "";

    if (!empty($category)) {
        $sql .= " AND category = ?";
        $params[] = $category;
        $types .= "s";
    }
    
    if (!empty($status)) {
        $sql .= " AND status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($on_sale === "true") {
        $sql .= " AND old_price IS NOT NULL AND old_price > price";
    }
    
    if (!empty($search)) {
        $sql .= " AND (name LIKE ? OR category LIKE ?)";
        $search_param = "%" . $search . "%";
        $params[] = $search_param;
        $params[] = $search_param;
        $types .= "ss";
    }
    
    $sql .= " AND price <= ?";
    $params[] = $max_price;
    $types .= "d";

    if ($rating > 0) {
        $sql .= " AND rating >= ?";
        $params[] = $rating;
        $types .= "d";
    }

    // Validate sort parameter
    $valid_sorts = ['newest', 'price-asc', 'price-desc', 'popular'];
    if (!in_array($sort, $valid_sorts)) {
        $sort = 'newest';
    }

    switch ($sort) {
        case 'price-asc': 
            $sql .= " ORDER BY price ASC"; 
            break;
        case 'price-desc': 
            $sql .= " ORDER BY price DESC"; 
            break;
        case 'popular': 
            $sql .= " ORDER BY sold DESC"; 
            break;
        case 'newest':
        default: 
            $sql .= " ORDER BY id DESC"; 
            break;
    }

    if ($limit > 0) {
        $sql .= " LIMIT ?";
        $params[] = $limit;
        $types .= "i";
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();

    $products = [];
    while ($row = $result->fetch_assoc()) {
        // CHUYỂN ĐỔI ENCODING NẾU CẦN
        $row = convertArrayToUTF8($row);
        
        // Fix image path
        if (!empty($row['image_main'])) {
            $row['image_main'] = fixImagePath($row['image_main']);
        }
        
        // Parse JSON arrays
        $row['images'] = parseJsonArray($row['images'] ?? '');
        $row['colors'] = parseJsonArray($row['colors'] ?? '');
        $row['sizes'] = parseJsonArray($row['sizes'] ?? '');
        
        // Calculate discount percentage if on sale
        if (!empty($row['old_price']) && $row['old_price'] > $row['price']) {
            $discount = round((($row['old_price'] - $row['price']) / $row['old_price']) * 100);
            $row['discount_percent'] = $discount;
        }
        
        $products[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "total" => count($products),
        "data" => $products
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
} catch (Exception $e) {
    error_log("Error in get_products.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
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

// FUNCTION TO PARSE JSON ARRAY
function parseJsonArray($jsonString) {
    if (empty($jsonString) || $jsonString === 'null') return [];
    
    if (is_array($jsonString)) {
        return $jsonString;
    }
    
    if (is_string($jsonString)) {
        $jsonString = trim($jsonString);
        
        // Try direct decode
        $decoded = json_decode($jsonString, true);
        
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        // Try handling single quotes
        $jsonString = str_replace("'", '"', $jsonString);
        $decoded = json_decode($jsonString, true);
        
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        // Try comma-separated values
        if (!preg_match('/^\[.*\]$/', $jsonString)) {
            $items = explode(',', $jsonString);
            $items = array_map('trim', $items);
            $items = array_filter($items, function($item) {
                return !empty($item);
            });
            
            if (!empty($items)) {
                return array_values($items);
            }
        }
    }
    
    return [];
}
?>