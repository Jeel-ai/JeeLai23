<?php

// --- Konfigurace ---
define('MUSEUM_EMAIL', 'rezervace@monolith-museum.cz');
define('MUSEUM_NAME',  'MONOLITH Museum');

// Ceny vstupenek (Kč) — musí odpovídat cenám v main.js
const TICKET_PRICES = [
    'standard' => 250,
    'senior'   => 150,
    'student'  => 180,
    'family'   => 700,
    'premium'  => 450,
];

// Nastavení hlaviček — vrátíme JSON
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// Povolíme pouze POST metodu
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda není povolena.']);
    exit;
}

// --- Sanitace vstupů ---

/**
 * Vyčistí a ořízne textový vstup.
 *
 * @param  mixed  $value   Raw hodnota z $_POST
 * @param  int    $maxLen  Maximální povolená délka
 * @return string
 */
function sanitizeString(mixed $value, int $maxLen = 255): string
{
    return mb_substr(trim(strip_tags((string) $value)), 0, $maxLen);
}

// Načtení a vyčištění polí formuláře
$name        = sanitizeString($_POST['name']        ?? '');
$email       = sanitizeString($_POST['email']       ?? '', 200);
$phone       = sanitizeString($_POST['phone']       ?? '', 20);
$date        = sanitizeString($_POST['visit_date']  ?? '', 10);
$time        = sanitizeString($_POST['visit_time']  ?? '', 10);
$ticketType  = sanitizeString($_POST['ticket_type'] ?? '', 20);
$count       = abs((int) ($_POST['count']           ?? 1));
$note        = sanitizeString($_POST['note']        ?? '', 500);

// --- Validace ---
$errors = [];

// Jméno (2–80 znaků)
if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
    $errors[] = 'Jméno musí mít 2–80 znaků.';
}

// E-mail
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Neplatná e-mailová adresa.';
}

// Telefon (volitelný — pokud vyplněn, musí mít správný formát)
if ($phone !== '' && !preg_match('/^[+]?[\d\s\-().]{7,20}$/', $phone)) {
    $errors[] = 'Neplatné telefonní číslo.';
}

// Datum návštěvy (formát YYYY-MM-DD, nesmí být v minulosti)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    $errors[] = 'Neplatný formát data.';
} elseif (strtotime($date) < strtotime('today')) {
    $errors[] = 'Datum návštěvy nemůže být v minulosti.';
}

// Čas
$allowedTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
if (!in_array($time, $allowedTimes, true)) {
    $errors[] = 'Neplatný čas návštěvy.';
}

// Typ vstupenky
if (!array_key_exists($ticketType, TICKET_PRICES)) {
    $errors[] = 'Neplatný typ vstupenky.';
}

// Počet osob (1–20)
if ($count < 1 || $count > 20) {
    $errors[] = 'Počet osob musí být 1–20.';
}

// Pokud existují chyby, vrátíme je klientovi
if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Formulář obsahuje chyby.',
        'errors'  => $errors,
    ]);
    exit;
}

// --- Výpočet ceny ---
$unitPrice  = TICKET_PRICES[$ticketType];
$totalPrice = $unitPrice * $count;

// Mapování typu vstupenky na čitelný název
$typeLabels = [
    'standard' => 'Standardní',
    'senior'   => 'Senior (65+)',
    'student'  => 'Student',
    'family'   => 'Rodinná (2+2)',
    'premium'  => 'Prémiová',
];
$typeLabel = $typeLabels[$ticketType] ?? $ticketType;

// --- Generování čísla rezervace ---
$reservationId = strtoupper(substr(md5(uniqid($email, true)), 0, 8));

// --- Příprava dat rezervace ---
$reservation = [
    'id'          => $reservationId,
    'name'        => $name,
    'email'       => $email,
    'phone'       => $phone,
    'visit_date'  => $date,
    'visit_time'  => $time,
    'ticket_type' => $typeLabel,
    'count'       => $count,
    'unit_price'  => $unitPrice,
    'total_price' => $totalPrice,
    'note'        => $note,
    'created_at'  => date('Y-m-d H:i:s'),
];

// --- Uložení do souboru (simulace DB — jen pro demo) ---
// V produkci nahraďte INSERT INTO databáze
$logDir  = __DIR__ . '/../data/reservations/';
$logFile = $logDir . 'reservations.log';

if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$logLine = json_encode($reservation) . PHP_EOL;
file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);

// --- Simulace odeslání e-mailu ---
// V produkci použijte: composer require phpmailer/phpmailer
$emailSubject = "Potvrzení rezervace #{$reservationId} — " . MUSEUM_NAME;
$emailBody    = generateConfirmationEmail($reservation);

// mail() je pouze pro demonstraci; v produkci použijte SMTP/PHPMailer
// mail($email, $emailSubject, $emailBody, "From: " . MUSEUM_EMAIL);

// --- Úspěšná odpověď ---
http_response_code(201);
echo json_encode([
    'success'        => true,
    'message'        => 'Rezervace byla úspěšně přijata.',
    'reservation_id' => $reservationId,
    'summary'        => [
        'name'        => $name,
        'date'        => $date,
        'time'        => $time,
        'type'        => $typeLabel,
        'count'       => $count,
        'total_price' => number_format($totalPrice, 0, ',', ' ') . ' Kč',
    ],
]);

// ============================================================
// POMOCNÉ FUNKCE
// ============================================================

/**
 * Vygeneruje tělo potvrzovacího e-mailu (prostý text).
 *
 * @param  array $r  Data rezervace
 * @return string
 */
function generateConfirmationEmail(array $r): string
{
    $separator = str_repeat('─', 50);

    return <<<TEXT
MONOLITH Museum
Read the Stone.
{$separator}

Vážená/ý {$r['name']},

Vaše rezervace vstupenek byla úspěšně přijata.

ČÍSLO REZERVACE: {$r['id']}
{$separator}
Datum návštěvy:  {$r['visit_date']}
Čas:             {$r['visit_time']}
Typ vstupenky:   {$r['ticket_type']}
Počet osob:      {$r['count']}
Cena za osobu:   {$r['unit_price']} Kč
CELKEM:          {$r['total_price']} Kč
{$separator}

Prosíme, přineste toto číslo rezervace na pokladnu.
Vstupenky jsou platné pouze pro uvedené datum a čas.

MONOLITH Museum
Staroměstské náměstí 12, 110 00 Praha 1
Tel: +420 222 333 444
E-mail: rezervace@monolith-museum.cz
www.monolith-museum.cz

{$separator}
Tento e-mail byl vygenerován automaticky, neodpovídejte na něj.
TEXT;
}
