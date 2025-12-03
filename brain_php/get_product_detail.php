<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0); // Tắt hiển thị lỗi trên trình duyệt

require_once 'db_connect.php';

$product_id = $_GET['id'] ?? null;

if (!$product_id || !is_numeric($product_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing product ID or invalid ID'], JSON_UNESCAPED_UNICODE);
    exit;
}

$product_id = (int)$product_id;

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    // Sử dụng chuẩn UTF-8 trực tiếp, không dùng COLLATE
    $stmt = $conn->prepare("
        SELECT 
            id, 
            name, 
            category,
            price, 
            old_price, 
            sold, 
            rating, 
            date_added,
            image_main, 
            images, 
            colors, 
            sizes, 
            status
        FROM products 
        WHERE id = ?
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $product_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Product does not exist'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $product = $result->fetch_assoc();
    
    // CHUYỂN ĐỔI ENCODING TỪ latin1 SANG UTF-8 (nếu cần)
    $product = convertArrayToUTF8($product);
    
    $allowed_statuses = ['normal','hot','bestseller','new','promo','sale'];
    if (!in_array($product['status'], $allowed_statuses)) {
        http_response_code(404);
        echo json_encode(['error' => 'Product is not available'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ADVANCED JSON PROCESSING FUNCTION - PROPERLY HANDLE DATA FROM DATABASE
    function parseJsonData($jsonString) {
        if (empty($jsonString) || $jsonString === 'null') return [];
        
        // If it's already an array, return it immediately
        if (is_array($jsonString)) {
            return $jsonString;
        }
        
        // If it's a JSON string, decode it
        if (is_string($jsonString)) {
            // Remove redundant whitespace
            $jsonString = trim($jsonString);
            
            // Try direct decode
            $decoded = json_decode($jsonString, true);
            
            // If decode succeeds and it's an array, return the result
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
            
            // If it fails, try handling special cases
            
            // Case 1: String has single quotes instead of double quotes
            $jsonString = str_replace("'", '"', $jsonString);
            $decoded = json_decode($jsonString, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
            
            // Case 2: String lacks brackets - treat as a simple array
            if (!preg_match('/^\[.*\]$/', $jsonString)) {
                // Try separating by comma
                $items = explode(',', $jsonString);
                $items = array_map('trim', $items);
                
                // Remove empty elements
                $items = array_filter($items, function($item) {
                    return !empty($item);
                });
                
                if (!empty($items)) {
                    return array_values($items);
                }
            }
            
            // Case 3: Handle malformed JSON string - try fixing syntax
            if (preg_match('/^\[.*\]$/', $jsonString)) {
                // Add double quotes for values missing them
                $fixedString = preg_replace('/(\w+)/', '"$1"', $jsonString);
                $decoded = json_decode($fixedString, true);
                
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    return $decoded;
                }
            }
        }
        
        // If all attempts fail, return empty array
        return [];
    }

    // Process JSON data - IMPORTANT: ENSURE CORRECT DATA
    $product['images'] = parseJsonData($product['images']);
    $product['colors'] = parseJsonData($product['colors']);
    $product['sizes'] = parseJsonData($product['sizes']);

    // Function to fix image path
    function fixImagePath($imgPath) {
        if (empty($imgPath)) return '../img/no-image.jpg';
        
        // CHUYỂN ĐỔI ENCODING TRƯỚC (nếu cần)
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

    // Apply path fix for main image
    if (!empty($product['image_main'])) {
        $product['image_main'] = fixImagePath($product['image_main']);
    }

    // Apply path fix for all images in the images array
    if (!empty($product['images']) && is_array($product['images'])) {
        $product['images'] = array_map('fixImagePath', $product['images']);
    }

    // Date formatting
    if ($product['date_added']) {
        $product['date_added_formatted'] = date('d/m/Y', strtotime($product['date_added']));
    } else {
        $product['date_added_formatted'] = 'N/A';
    }

    $product['sold'] = $product['sold'] ?? 0;
    $product['rating'] = $product['rating'] ?? 0;

    echo json_encode($product, JSON_UNESCAPED_UNICODE);
    $stmt->close();

} catch (Exception $e) {
    error_log("Error in get_product_detail.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
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