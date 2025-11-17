<?php
session_start();
require_once 'db_connection.php';

// Check authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

header('Content-Type: application/json');

switch ($action) {
    case 'get_messages':
        $filter = $_GET['filter'] ?? 'unread';
        $query = "SELECT * FROM messages WHERE is_archived = 0";
        
        if ($filter === 'unread') {
            $query .= " AND is_read = 0";
        } elseif ($filter === 'archived') {
            $query = "SELECT * FROM messages WHERE is_archived = 1";
        }
        
        $query .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['messages' => $messages]);
        break;
        
    case 'get_message':
        $id = $_GET['id'];
        $stmt = $db->prepare("SELECT * FROM messages WHERE id = ?");
        $stmt->execute([$id]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($message);
        break;
        
    case 'mark_read':
        $id = $_GET['id'];
        $stmt = $db->prepare("UPDATE messages SET is_read = 1 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;
        
    case 'archive_message':
        $id = $_GET['id'];
        $stmt = $db->prepare("UPDATE messages SET is_archived = 1 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;
        
    case 'send_reply':
        $message_id = $_POST['message_id'];
        $to_email = $_POST['to_email'];
        $subject = $_POST['subject'];
        $message_body = $_POST['message'];
        $from_email = "info@springoflife.com";
        
        // Headers for the email
        $headers = "From: Spring of Life Elderly Care <$from_email>\r\n";
        $headers .= "Reply-To: $from_email\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        // Send email
        if (mail($to_email, $subject, $message_body, $headers)) {
            // Mark original message as read
            $stmt = $db->prepare("UPDATE messages SET is_read = 1 WHERE id = ?");
            $stmt->execute([$message_id]);
            
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to send email']);
        }
        break;
        
    case 'get_subscribers':
        $stmt = $db->query("SELECT * FROM newsletter_subscriptions WHERE is_active = 1 ORDER BY subscribed_at DESC");
        $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['subscribers' => $subscribers]);
        break;
        
    case 'download_subscribers':
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="newsletter_subscribers.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Email', 'Subscription Date', 'Status']);
        
        $stmt = $db->query("SELECT email, subscribed_at, is_active FROM newsletter_subscriptions ORDER BY subscribed_at DESC");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, [
                $row['email'],
                $row['subscribed_at'],
                $row['is_active'] ? 'Active' : 'Inactive'
            ]);
        }
        fclose($output);
        exit();
        
    case 'get_analytics':
        // Page visits for last 7 days
        $stmt = $db->query("SELECT page_name, COUNT(*) as count FROM page_visits 
                           WHERE visit_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                           GROUP BY page_name");
        $page_visits = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Recent activity
        $recent_activity = [];
        
        // Recent messages - FIXED: Using CONCAT instead of ||
        $stmt = $db->query("SELECT CONCAT('New message from ', name) as description, created_at as time 
                           FROM messages 
                           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                           ORDER BY created_at DESC 
                           LIMIT 5");
        $recent_activity = array_merge($recent_activity, $stmt->fetchAll(PDO::FETCH_ASSOC));
        
        echo json_encode([
            'page_visits' => $page_visits,
            'recent_activity' => $recent_activity
        ]);
        break;
        
    case 'get_donations':
        $stmt = $db->query("SELECT * FROM donations ORDER BY created_at DESC LIMIT 50");
        $donations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['donations' => $donations]);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>