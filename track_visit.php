<?php
require_once 'db_connection.php';

$page_name = $_GET['page'] ?? 'unknown';

$database = new Database();
$db = $database->getConnection();

$query = "INSERT INTO page_visits (page_name, ip_address, user_agent) VALUES (?, ?, ?)";
$stmt = $db->prepare($query);
$stmt->execute([$page_name, $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT']]);

// Return 1x1 transparent GIF
header('Content-Type: image/gif');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
?>