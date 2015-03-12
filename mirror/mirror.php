<?php

  $url = $_GET['url'];

  if ( !$url ) {
    echo "No URL Specified";
  }
  else{
    echo file_get_contents($url);
  }

?>
