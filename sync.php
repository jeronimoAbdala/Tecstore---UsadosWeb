<?php
// Conexión
$conexion = new mysqli("limegreen-lion-509134.hostingersite.com", "u975065804_jeroabdalala", "TecladoRaton1-", "u975065804_tecstoreDB");

if ($conexion->connect_error) {
    die("Conexión fallida: " . $conexion->connect_error);
}

// Recibir JSON desde Google Sheets
$data = json_decode(file_get_contents("php://input"), true);

// Insertar o actualizar
foreach ($data as $fila) {
    $campo1 = $conexion->real_escape_string($fila['campo1']);
    $campo2 = $conexion->real_escape_string($fila['campo2']);

    $sql = "INSERT INTO mi_tabla (campo1, campo2) VALUES ('$campo1', '$campo2')
            ON DUPLICATE KEY UPDATE campo2 = '$campo2'";

    $conexion->query($sql);
}

echo "Datos recibidos";
$conexion->close();
?>  
