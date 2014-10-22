<?php
include_once("config.php");
ini_set('display_errors', 'On');
ini_set('display_warnings', 'On');
date_default_timezone_set('Europe/London');

$con=mysqli_connect($db_host, $db_user, $dp_pass, $mybd);

// Check connection
if (mysqli_connect_errno()) {
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
}

$query = sprintf("SELECT * FROM passes WHERE los > '%s' ORDER BY los",  date("Y-m-d H:i:s") );

$sql = mysqli_query($con,$query);

if (!$sql) {
    echo mysqli_errno($con) . ": " . mysqli_error($con) . "\n";
    $message  = "Invalid query: " . mysqli_error($con) . "\nWhole query: " . $query;
    die($message);
}

$row = mysqli_fetch_array($sql);

while($row_up = mysqli_fetch_array($sql))
{
        $upcoming_start = $row_up[1];
        $upcoming_elevation = $row_up[3];
}

mysqli_close($con);

echo json_encode(array (
        'message' => "UKube-1 pass information for Glasgow",
        'current_time' => date("Y-m-d H:i:s"),
        'calculation_details' => $row[0],
        'next_pass' => $row[1],
        'pass_ends' => $row[2],
        'max_elevation' => $row[3],
        'endofpass' => gmdate("H:i:s",strtotime($row[2]) - strtotime(date("Y-m-d H:i:s"))),
        'nextpassstarts' => gmdate("H:i:s",strtotime($row[1]) - strtotime(date("Y-m-d H:i:s"))),
        'upcoming_start' => $upcoming_start,
        'upcoming_elevation' => $upcoming_elevation
      ));




?>


