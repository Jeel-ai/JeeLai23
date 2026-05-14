<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "muzeum");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "error" => "DB error"]));
}

$conn->set_charset("utf8");

$action = $_GET["action"] ?? "";

/* =========================
   REZERVACE (fetch JSON)
========================= */
if ($action === "rezervace") {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false, "error" => "No data"]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO rezervace
        (jmeno, prijmeni, datum, pocet, email, vstupenka)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssiss",
        $data["jmeno"],
        $data["prijmeni"],
        $data["datum"],
        $data["pocet"],
        $data["email"],
        $data["vstupenka"]
    );

    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* =========================
   RECENZE (FormData + obrázek)
========================= */
if ($action === "recenze") {

    $jmeno = $_POST["jmeno"] ?? "";
    $prijmeni = $_POST["prijmeni"] ?? "";
    $text = $_POST["text"] ?? "";
    $stars = $_POST["stars"] ?? 5;

    $imagePath = "obrazky/profile.webp";

    if (!empty($_FILES["image"]["name"])) {

        $fileName = time() . "_" . basename($_FILES["image"]["name"]);
        $target = "uploads/" . $fileName;

        move_uploaded_file($_FILES["image"]["tmp_name"], $target);

        $imagePath = $target;
    }

    $stmt = $conn->prepare("
        INSERT INTO recenze
        (jmeno, prijmeni, text_recenze, stars, obrazek)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssis",
        $jmeno,
        $prijmeni,
        $text,
        $stars,
        $imagePath
    );

    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* =========================
   NAČTENÍ RECENZÍ (pro frontend)
========================= */
if ($action === "get_recenze") {

    $result = $conn->query("
        SELECT * FROM recenze
        ORDER BY id DESC
    ");

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode($data);
    exit;
}

/* =========================
   DEFAULT
========================= */
echo json_encode([
    "success" => false,
    "message" => "Invalid action"
]);

?>
