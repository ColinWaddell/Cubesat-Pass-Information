<?php
include_once("config.php");
ini_set('display_errors', 'On');
ini_set('display_warnings', 'On');
date_default_timezone_set('Africa/Johannesburg');

/*$con=mysqli_connect($db_host, $db_user, $dp_pass, $mybd);*/

//// Check connection
//if (mysqli_connect_errno()) {
  //echo "Failed to connect to MySQL: " . mysqli_connect_error();
//}

////$query = sprintf("SELECT * FROM passes WHERE aos > '%s' ORDER BY aos",  date("Y-m-d H:i:s",(time()-60*30)) );
////$query = sprintf("SELECT * FROM passes WHERE aos > '%s' ORDER BY aos",  date("Y-m-d H:i:s") );
//$query = sprintf("SELECT * FROM passes WHERE los > '%s' ORDER BY los",  date("Y-m-d H:i:s") );

//$sql = mysqli_query($con,$query);

//if (!$sql) {
    //echo mysqli_errno($con) . ": " . mysqli_error($con) . "\n";
    //$message  = "Invalid query: " . mysqli_error($con) . "\nWhole query: " . $query;
    //die($message);
//}

//$row = mysqli_fetch_array($sql);

//while($row = mysqli_fetch_array($sql))
//{
	//$upcoming_start = $row[1];
        //$upcoming_elevation = $row[3];
//}

/*mysqli_close($con);*/


/************

  So since I can't actually retrieve $row from the database
  I'm just creating a fake pre-loaded version.

************/

$row = array (
          "2014-10-06 20:50:39",
          "2014-10-06 02:57:34",
          "2014-10-06 22:20:22",
          "26 degrees above horizon"
        );




// REMOVE THESE COMMENTS. I left the while loop in so you
// can see what to do above.

//while($row = mysqli_fetch_array($sql))
//{
  $upcoming_start = $row[1];
  $upcoming_elevation = $row[3];
//}

echo json_encode(array (
        'message' => "ZACUBE-1 next pass information for Cape Town",
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










