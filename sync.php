<?php
// Conexión
$conexion = new mysqli("limegreen-lion-509134.hostingersite.com", "u975065804_jeroabdalala", "TecladoRaton1-", "u975065804_tecstoreDB");

if ($conexion->connect_error) {
    die("Conexión fallida: " . $conexion->connect_error);
}

echo "Conexión exitosa";
?>  
