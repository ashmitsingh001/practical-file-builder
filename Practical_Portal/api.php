<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

if ($action == 'save') {
    $v_name = $_POST['version_name'] ?? 'Untitled';
    $data   = $_POST['html_content'] ?? '';
    $theme  = $_POST['theme'] ?? 'default';
    $zoom   = $_POST['zoom'] ?? 1.0;

    // Check if version name already exists for this user
    $stmt = $pdo->prepare("SELECT id FROM practicals WHERE user_id = ? AND version_name = ?");
    $stmt->execute([$user_id, $v_name]);
    $existing = $stmt->fetch();

    if ($existing) {
        // Update existing version
        $stmt = $pdo->prepare("UPDATE practicals SET html_content = ?, theme = ?, zoom = ? WHERE id = ?");
        $stmt->execute([$data, $theme, $zoom, $existing['id']]);
        echo json_encode(['status' => 'success', 'message' => 'Version updated!']);
    } else {
        // Create new version
        $stmt = $pdo->prepare("INSERT INTO practicals (user_id, version_name, html_content, theme, zoom) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $v_name, $data, $theme, $zoom]);
        echo json_encode(['status' => 'success', 'message' => 'New version saved!']);
    }
}

if ($action == 'list') {
    $stmt = $pdo->prepare("SELECT id, version_name, updated_at FROM practicals WHERE user_id = ? ORDER BY updated_at DESC");
    $stmt->execute([$user_id]);
    $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'versions' => $list]);
}

if ($action == 'load') {
    $v_id = $_GET['id'] ?? 0;
    $stmt = $pdo->prepare("SELECT html_content, theme, zoom FROM practicals WHERE id = ? AND user_id = ?");
    $stmt->execute([$v_id, $user_id]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
        echo json_encode(['status' => 'success', 'data' => $data]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Version not found.']);
    }
}

if ($action == 'delete') {
    $v_id = $_GET['id'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM practicals WHERE id = ? AND user_id = ?");
    $stmt->execute([$v_id, $user_id]);
    echo json_encode(['status' => 'success', 'message' => 'Version deleted.']);
}
?>
