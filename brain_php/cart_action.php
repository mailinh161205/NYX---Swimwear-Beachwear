<?php
session_start();
include 'db_connect.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CHECK LOGIN
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'You need to log in to perform this action.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = $_SESSION['user_id'];
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON data.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $data['action'] ?? '';

// CHECK VALID ACTION
$valid_actions = ['add', 'remove', 'update'];
if (!in_array($action, $valid_actions)) {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid action.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    if ($action == 'add') {
        $product_id = intval($data['product_id'] ?? 0);
        $quantity = intval($data['quantity'] ?? 1);
        
        // KHÔNG chuyển đổi encoding - để nguyên
        $size = isset($data['size']) ? $data['size'] : 'Freesize';
        $color = isset($data['color']) ? $data['color'] : '';
        
        // CHECK INPUT DATA
        if ($product_id <= 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Invalid product ID.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($quantity < 1 || $quantity > 10) {
            echo json_encode([
                'success' => false, 
                'message' => 'Quantity must be between 1 and 10.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // CHECK IF PRODUCT EXISTS
        $check_product = $conn->prepare("SELECT id, name, price FROM products WHERE id = ?");
        if (!$check_product) {
            throw new Exception("Prepare failed for product check: " . $conn->error);
        }
        
        $check_product->bind_param("i", $product_id);
        
        if (!$check_product->execute()) {
            throw new Exception("Execute failed for product check: " . $check_product->error);
        }
        
        $product_result = $check_product->get_result();
        
        if ($product_result->num_rows === 0) {
            $check_product->close();
            echo json_encode([
                'success' => false, 
                'message' => 'Product does not exist.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $check_product->close();

        // SỬA LỖI COLLATION: THÊM COLLATE utf8mb4_unicode_ci để nhất quán
        $sql = "SELECT id, quantity FROM cart 
                WHERE user_id = ? 
                AND product_id = ? 
                AND (size COLLATE utf8mb4_unicode_ci = ? OR (size IS NULL AND ? IS NULL))
                AND (color COLLATE utf8mb4_unicode_ci = ? OR (color IS NULL AND ? IS NULL))";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        // Bind parameters - cần bind 6 tham số
        $stmt->bind_param("iissss", $user_id, $product_id, $size, $size, $color, $color);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // UPDATE QUANTITY IF ALREADY EXISTS
            $cart_item = $result->fetch_assoc();
            $new_quantity = $cart_item['quantity'] + $quantity;
            
            if ($new_quantity > 10) {
                $new_quantity = 10;
                $stmt->close();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Added to cart! The maximum quantity is 10.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            $stmt_update = $conn->prepare("UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?");
            if (!$stmt_update) {
                $stmt->close();
                throw new Exception("Prepare failed for update: " . $conn->error);
            }
            
            $stmt_update->bind_param("ii", $new_quantity, $cart_item['id']);
            
            if (!$stmt_update->execute()) {
                $stmt_update->close();
                $stmt->close();
                throw new Exception("Execute failed for update: " . $stmt_update->error);
            }
            
            $stmt_update->close();
            $message = 'Product quantity in cart updated!';
        } else {
            // ADD NEW ITEM TO CART
            $stmt_insert = $conn->prepare("INSERT INTO cart (user_id, product_id, quantity, size, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            if (!$stmt_insert) {
                $stmt->close();
                throw new Exception("Prepare failed for insert: " . $conn->error);
            }
            
            $stmt_insert->bind_param("iiiss", $user_id, $product_id, $quantity, $size, $color);
            
            if (!$stmt_insert->execute()) {
                $stmt_insert->close();
                $stmt->close();
                throw new Exception("Execute failed for insert: " . $stmt_insert->error);
            }
            
            $stmt_insert->close();
            $message = 'Product added to cart!';
        }
        
        $stmt->close();
        echo json_encode([
            'success' => true, 
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);

    } elseif ($action == 'remove') {
        $cart_id = intval($data['cart_id'] ?? 0);
        
        if ($cart_id <= 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Invalid cart ID.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("ii", $cart_id, $user_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'Product removed from cart.'
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'Product not found in cart.'
            ], JSON_UNESCAPED_UNICODE);
        }
        $stmt->close();

    } elseif ($action == 'update') {
        $cart_id = intval($data['cart_id'] ?? 0);
        $quantity = intval($data['quantity'] ?? 1);
        
        if ($cart_id <= 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Invalid cart ID.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($quantity < 1 || $quantity > 10) {
            echo json_encode([
                'success' => false, 
                'message' => 'Quantity must be between 1 and 10.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $conn->prepare("UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("iii", $quantity, $cart_id, $user_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'Product quantity updated.'
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'Product not found in cart.'
            ], JSON_UNESCAPED_UNICODE);
        }
        $stmt->close();
    }

} catch (Exception $e) {
    error_log("Error in cart_action.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>