<?php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action == 'signup') {
    $user = $_POST['username'] ?? '';
    $pass = $_POST['password'] ?? '';

    if (!$user || !$pass) {
        echo json_encode(['status' => 'error', 'message' => 'Username and password required.']);
        exit;
    }

    $hashedPass = password_hash($pass, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        $stmt->execute([$user, $hashedPass]);
        echo json_encode(['status' => 'success', 'message' => 'Account created! Please login.']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['status' => 'error', 'message' => 'Username already exists.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Registration failed.']);
        }
    }
}

if ($action == 'login') {
    $user = $_POST['username'] ?? '';
    $pass = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT id, password FROM users WHERE username = ?");
    $stmt->execute([$user]);
    $u = $stmt->fetch();

    if ($u && password_verify($pass, $u['password'])) {
        $_SESSION['user_id'] = $u['id'];
        $_SESSION['username'] = $user;
        echo json_encode(['status' => 'success', 'message' => 'Logged in!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid username or password.']);
    }
}

if ($action == 'logout') {
    session_destroy();
    echo json_encode(['status' => 'success']);
}

if ($action == 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'logged_in', 'username' => $_SESSION['username']]);
    } else {
        echo json_encode(['status' => 'logged_out']);
    }
}
?>
