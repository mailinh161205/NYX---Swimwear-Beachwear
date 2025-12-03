<?php
include 'db_connect.php';

echo "<h3>Database Collation Info</h3>";

// Kiểm tra collation của database
$result = $conn->query("SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
                       FROM information_schema.SCHEMATA 
                       WHERE SCHEMA_NAME = 'if0_40586459_nyx_store'");
if ($result && $row = $result->fetch_assoc()) {
    echo "Database charset: " . (isset($row['DEFAULT_CHARACTER_SET_NAME']) ? $row['DEFAULT_CHARACTER_SET_NAME'] : 'Unknown') . "<br>";
    echo "Database collation: " . (isset($row['DEFAULT_COLLATION_NAME']) ? $row['DEFAULT_COLLATION_NAME'] : 'Unknown') . "<br><hr>";
} else {
    echo "Cannot get database info<br><hr>";
}

// Kiểm tra collation của các bảng
$tables = ['cart', 'products', 'users'];
foreach ($tables as $table) {
    echo "<h4>Table: $table</h4>";
    $result = $conn->query("SHOW TABLE STATUS LIKE '$table'");
    if ($result && $row = $result->fetch_assoc()) {
        echo "Collation: " . (isset($row['Collation']) ? $row['Collation'] : 'Unknown') . "<br>";
    }
    
    // Kiểm tra các cột
    $result2 = $conn->query("SHOW FULL COLUMNS FROM $table");
    if ($result2) {
        echo "<table border='1'><tr><th>Field</th><th>Collation</th></tr>";
        while ($col = $result2->fetch_assoc()) {
            $collation = isset($col['Collation']) ? $col['Collation'] : 'N/A';
            echo "<tr><td>" . (isset($col['Field']) ? $col['Field'] : '') . "</td><td>$collation</td></tr>";
        }
        echo "</table><br>";
    } else {
        echo "Cannot get column info<br>";
    }
}

$conn->close();
?>