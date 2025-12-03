<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);

// Database connection
require_once 'db_connect.php';

// Check login status
if (!isset($_SESSION['user_id']) || !$_SESSION['logged_in']) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Please log in!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Kiểm tra kết nối
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Unknown error"));
    }

    // Kiểm tra phương thức gửi dữ liệu
    $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        // Nhận dữ liệu JSON
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON data");
        }
        
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $gender = $data['gender'] ?? '';
        $dob = $data['dob'] ?? '';
        $address = trim($data['address'] ?? '');
        $avatarBase64 = $data['avatar'] ?? ''; // Base64 image data
        
    } elseif (strpos($contentType, 'multipart/form-data') !== false) {
        // Nhận dữ liệu form (cho upload file)
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $gender = $_POST['gender'] ?? '';
        $dob = $_POST['dob'] ?? '';
        $address = trim($_POST['address'] ?? '');
        $avatarBase64 = '';
    } else {
        throw new Exception("Unsupported content type");
    }

    // Validate data
    if (empty($name) || empty($email)) {
        throw new Exception("Please fill in all required fields!");
    }

    // Check valid email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email address!");
    }

    // Check valid name
    if (!preg_match('/^[a-zA-ZÀ-ỹ\s]{2,}$/u', $name)) {
        throw new Exception("Invalid name! Name must contain at least 2 characters and no numbers or special characters.");
    }

    // KHÔNG chuyển đổi encoding mặc định - để nguyên UTF-8
    $email_for_db = $email;
    $name_for_db = $name;
    $phone_for_db = $phone;
    $gender_for_db = $gender;
    $address_for_db = $address;

    // Kiểm tra email có bị trùng với user khác không
    $sql_check = "SELECT id FROM users WHERE email = ? AND id != ?";
    $stmt_check = $conn->prepare($sql_check);
    
    if (!$stmt_check) {
        throw new Exception("Prepare failed for check email: " . $conn->error);
    }
    
    // Thử với UTF-8 trực tiếp
    $stmt_check->bind_param("si", $email_for_db, $user_id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    
    if ($result_check->num_rows > 0) {
        $stmt_check->close();
        throw new Exception("Email is already in use by another user!");
    }
    
    $stmt_check->close();

    // Handle avatar upload/update
    $avatarPath = null;
    
    // Xử lý Base64 avatar (nếu có từ JSON)
    if (!empty($avatarBase64) && strpos($avatarBase64, 'data:image') === 0) {
        // Xóa avatar cũ nếu tồn tại
        $stmt_old = $conn->prepare("SELECT avatar FROM users WHERE id = ?");
        $stmt_old->bind_param("i", $user_id);
        $stmt_old->execute();
        $result_old = $stmt_old->get_result();
        
        if ($row = $result_old->fetch_assoc()) {
            $oldAvatar = $row['avatar'] ?? '';
            if ($oldAvatar && file_exists('../' . $oldAvatar)) {
                unlink('../' . $oldAvatar);
            }
        }
        $stmt_old->close();
        
        // Tạo tên file mới
        $fileName = 'avatar_' . $user_id . '_' . time() . '.jpg';
        $uploadDir = '../uploads/avatars/';
        $filePath = $uploadDir . $fileName;
        
        // Tạo thư mục nếu chưa tồn tại
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                throw new Exception('Could not create upload directory!');
            }
        }
        
        // Decode và lưu Base64 image
        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $avatarBase64));
        if ($imageData !== false) {
            if (file_put_contents($filePath, $imageData)) {
                $avatarPath = 'uploads/avatars/' . $fileName;
            } else {
                throw new Exception('Could not save avatar image.');
            }
        }
    }
    
    // Xử lý file upload (nếu có từ form)
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $avatar = $_FILES['avatar'];
        
        // Check file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!in_array($avatar['type'], $allowedTypes)) {
            throw new Exception('Only JPG, PNG image files are accepted!');
        }
        
        // Check size (max 2MB)
        if ($avatar['size'] > 2 * 1024 * 1024) {
            throw new Exception('Image size must not exceed 2MB!');
        }
        
        // Xóa avatar cũ nếu tồn tại
        $stmt_old = $conn->prepare("SELECT avatar FROM users WHERE id = ?");
        $stmt_old->bind_param("i", $user_id);
        $stmt_old->execute();
        $result_old = $stmt_old->get_result();
        
        if ($row = $result_old->fetch_assoc()) {
            $oldAvatar = $row['avatar'] ?? '';
            if ($oldAvatar && file_exists('../' . $oldAvatar)) {
                unlink('../' . $oldAvatar);
            }
        }
        $stmt_old->close();
        
        // Create new file name
        $fileExtension = pathinfo($avatar['name'], PATHINFO_EXTENSION);
        $fileName = 'avatar_' . $user_id . '_' . time() . '.' . $fileExtension;
        $uploadDir = '../uploads/avatars/';
        $filePath = $uploadDir . $fileName;
        
        // Create directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                throw new Exception('Could not create upload directory!');
            }
        }
        
        // Move the file
        if (move_uploaded_file($avatar['tmp_name'], $filePath)) {
            $avatarPath = 'uploads/avatars/' . $fileName;
        } else {
            throw new Exception('Could not upload avatar image.');
        }
    }

    // Update user information
    if ($avatarPath) {
        // Update với avatar
        $sql_update = "UPDATE users SET name = ?, email = ?, phone = ?, gender = ?, date_of_birth = ?, address = ?, avatar = ?, updated_at = NOW() WHERE id = ?";
        $stmt_update = $conn->prepare($sql_update);
        
        if (!$stmt_update) {
            throw new Exception("Prepare failed for update: " . $conn->error);
        }
        
        $stmt_update->bind_param("sssssssi", $name_for_db, $email_for_db, $phone_for_db, $gender_for_db, $dob, $address_for_db, $avatarPath, $user_id);
    } else {
        // Chỉ update thông tin, giữ avatar cũ
        $sql_update = "UPDATE users SET name = ?, email = ?, phone = ?, gender = ?, date_of_birth = ?, address = ?, updated_at = NOW() WHERE id = ?";
        $stmt_update = $conn->prepare($sql_update);
        
        if (!$stmt_update) {
            throw new Exception("Prepare failed for update: " . $conn->error);
        }
        
        $stmt_update->bind_param("ssssssi", $name_for_db, $email_for_db, $phone_for_db, $gender_for_db, $dob, $address_for_db, $user_id);
    }
    
    if ($stmt_update->execute()) {
        // Cập nhật session với UTF-8
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        
        $stmt_update->close();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Profile updated successfully!'
        ], JSON_UNESCAPED_UNICODE);
        
    } else {
        $error = $stmt_update->error;
        $stmt_update->close();
        
        // Thử lại với latin1 encoding nếu có lỗi encoding
        if (strpos($error, 'incorrect string value') !== false) {
            // Thử với latin1 encoding
            $email_latin1 = mb_convert_encoding($email, 'ISO-8859-1', 'UTF-8');
            $name_latin1 = mb_convert_encoding($name, 'ISO-8859-1', 'UTF-8');
            $phone_latin1 = mb_convert_encoding($phone, 'ISO-8859-1', 'UTF-8');
            $gender_latin1 = mb_convert_encoding($gender, 'ISO-8859-1', 'UTF-8');
            $address_latin1 = mb_convert_encoding($address, 'ISO-8859-1', 'UTF-8');
            
            if ($avatarPath) {
                $stmt_update2 = $conn->prepare($sql_update);
                $stmt_update2->bind_param("sssssssi", $name_latin1, $email_latin1, $phone_latin1, $gender_latin1, $dob, $address_latin1, $avatarPath, $user_id);
            } else {
                $stmt_update2 = $conn->prepare($sql_update);
                $stmt_update2->bind_param("ssssssi", $name_latin1, $email_latin1, $phone_latin1, $gender_latin1, $dob, $address_latin1, $user_id);
            }
            
            if ($stmt_update2->execute()) {
                $_SESSION['user_name'] = $name;
                $_SESSION['user_email'] = $email;
                
                $stmt_update2->close();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Profile updated successfully!'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                throw new Exception("Update with latin1 failed: " . $stmt_update2->error);
            }
        } else {
            throw new Exception($error);
        }
    }

} catch (Exception $e) {
    error_log("Error in update_profile.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>