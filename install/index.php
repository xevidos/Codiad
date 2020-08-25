<?php

ini_set( 'display_errors', 1 );
ini_set( 'display_startup_errors', 1 );
error_reporting( E_ALL );

if( is_file( __DIR__ . "/../config.php" ) ) {
	
	echo "Codiad is already installed.";
	exit();
}

require_once( __DIR__ . "/../components/initialize/class.initialize.php" );
require_once( __DIR__ . "/../components/user/class.user.php" );

Initialize::get_instance();

$check_paths = Initialize::PATHS;
$checks_html = "";
$extensions = Initialize::EXTENSIONS;
$extensions_html = "";
$paths_html = "";

if( isset( $_POST["storage"] ) && ! isset( $_POST["username"] ) ) {
	
	$pass = true;
	$return = Common::get_default_return();
	$storage = $_POST["storage"];
	
	if( $pass && ! Initialize::check_extensions() ) {
		
		$return["status"] = "error";
		$return["message"] = "Required PHP extensions are not enabled.";
		$return["value"] = false;
		$pass = false;
	}
	
	if( $pass && ! Initialize::check_paths() ) {
		
		$return["status"] = "error";
		$return["message"] = "Unable to get write permissions for required paths.";
		$return["value"] = false;
		$pass = false;
	}
	
	if( $pass && ! in_array( $storage, array_values( Data::DB_TYPES ), true ) ) {
		
		$return["status"] = "error";
		$return["message"] = "Storage type is not supported.";
		$return["value"] = false;
		$pass = false;
	}
	
	if( $pass ) {
		
		if( $storage === "filesystem" ) {
			
			if( isset( $_POST["override"] ) && $_POST["override"] === "true" ) {
				
				$dir = realpath( __DIR__ . "/../data" );
				$files = scandir( $dir );
				
				foreach( $files as $file ) {
					
					if( $file == "." || $file == ".." || strpos( $file, ".inc" ) === false ) {
						
						continue;
					}
					unlink( "$dir/$file" );
				}
			}
			
			define( "DBTYPE", $_POST["storage"] );
			$data = Data::get_instance();
			$return = $data->install( $_POST["storage"] );
		} else {
			
			$requirements = array(
				"dbhost",
				"dbname",
				"dbuser",
				"dbpass",
				"dbpass1"
			);
			
			foreach( $requirements as $r ) {
				
				if( ! isset( $_POST["$r"] ) ) {
					
					$return["status"] = "error";
					$return["message"] = "$r variable is required but was not provided.";
					$return["value"] = false;
					$pass = false;
					break;
				}
			}
			
			if( $pass && $_POST["dbpass"] !== $_POST["dbpass1"] ) {
				
				$return["status"] = "error";
				$return["message"] = "Database passwords do not match.";
				$return["value"] = false;
				$pass = false;
			}
			
			if( $pass ) {
				
				try {
					
					define( "DBHOST", $_POST["dbhost"] );
					define( "DBTYPE", $_POST["storage"] );
					define( "DBNAME", $_POST["dbname"] );
					define( "DBUSER", $_POST["dbuser"] );
					define( "DBPASS", $_POST["dbpass"] );
					
					$data = Data::get_instance();
					$connection = $data->connect();
				} catch( Throwable $e ) {
					
					$return["status"] = "error";
					$return["message"] = "Unable to connect to database.";
					$return["value"] = $e->getMessage();
					$pass = false;
				}
				
				if( $pass && isset( $_POST["override"] ) && $_POST["override"] === "true" ) {
					
					try {
						
						$data->query( "DROP TABLE access;" );
					} catch( Throwable $e ) {}
					
					try {
						
						$data->query( "DROP TABLE active;" );
					} catch( Throwable $e ) {}
					
					try {
						
						$data->query( "DROP TABLE options;" );
					} catch( Throwable $e ) {}
					
					try {
						
						$data->query( "DROP TABLE projects;" );
					} catch( Throwable $e ) {}
					
					try {
						
						$data->query( "DROP TABLE users;" );
					} catch( Throwable $e ) {}
					
					try {
						
						$data->query( "DROP TABLE user_options;" );
					} catch( Throwable $e ) {}
				}
			}
			
			if( $pass ) {
				
				$return = $data->install( $_POST["storage"] );
			}
		}
	}
	exit( json_encode( $return ) );
}

if( isset( $_POST["username"] ) ) {
	
	define( "DBTYPE", $_POST["storage"] );
	
	if( isset( $_POST["dbhost"] ) ) {
		
		define( "DBHOST", $_POST["dbhost"] );
		define( "DBNAME", $_POST["dbname"] );
		define( "DBUSER", $_POST["dbuser"] );
		define( "DBPASS", $_POST["dbpass"] );
	}
	
	$return = Common::get_default_return();
	$User = User::get_instance();
	
	$return = $User->create_user( array(
		
		"username" => $_POST["username"],
		"password" => $_POST["password"],
		"password1" => $_POST["password1"],
		"access" => Permissions::SYSTEM_LEVELS["admin"],
	));
	
	if( $return["status"] !== "error" ) {
		
		$users = $User->get_users();
		$created = false;
		
		foreach( $users["value"] as $row => $data ) {
			
			if( $data["username"] == $_POST["username"] ) {
				
				$created = true;
				break;
			}
		}
		
		if( $created ) {
			
			copy( __DIR__ . "/../config.example.php", __DIR__ . "/../config.php" );
			
			$Options = Options::get_instance();
			
			$Options->update_config( "BASE_PATH",  "'" . Common::strip_trailing_slash( realpath( __DIR__ . "/../" ) ) . "'" );
			$Options->update_config( "BASE_URL", "'" . Common::strip_trailing_slash( str_replace( "/install/index.php", "", Common::get_url() ) ) . "'" );
			$Options->update_config( "DBTYPE", "'" . $_POST["storage"] . "'" );
			
			if( isset( $_POST["dbname"] ) ) {
				
				$Options->update_config( "DBNAME", "'" . $_POST["dbname"] . "'" );
				$Options->update_config( "DBUSER", "'" . $_POST["dbuser"] . "'" );
				$Options->update_config( "DBPASS", "'" . $_POST["dbpass"] . "'" );
			}
		} else {
			
			$return["status"] = "error";
			$return["message"] = "User could not be found in data storage system.";
		}
	}
	exit( json_encode( $return ) );
}

$components = scandir( COMPONENTS );
unset( $components["."], $components[".."] );

// Theme
$theme = THEME;
if( isset( $_SESSION['theme'] ) ) {
	
	$theme = $_SESSION['theme'];
}

if( Common::is_ssl() ) {
	
	$ssl_html = "<span style='color:green;'>SSL is enabled</span><br>";
} else {
	
	$ssl_html = "<span style='color:gold;'>SSL is not enabled.  This is highly insecure and is not reccommended.</span><br>";
}
$checks_html .= "SSL:<br>$ssl_html<br><br>";

foreach( $extensions as $extension ) {
	
	if( extension_loaded( $extension ) ) {
		
		$extensions_html .= "<span style='color:green;'>$extension</span><br>";
	} else {
		
		$extensions_html .= "<span style='color:red;'>$extension</span><br>";
	}
}
$checks_html .= "Requirements:<br>$extensions_html<br><br>";

foreach( $check_paths as $path ) {
	
	if( is_writable( constant( $path ) ) ) {
		
		$paths_html .= "<span style='color:green;'>" . basename( constant( $path ) ) . "</span><br>";
	} else {
		
		$paths_html .= "<span style='color:red;'>" . basename( constant( $path ) ) . "</span><br>";
	}
}
$checks_html .= "Path Permissions:<br>$paths_html";
$checks_html .= "<span id='data_status'></span>";
?>
<!DOCTYPE HTML>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="
			width=device-width,
			initial-scale=1.0,
			maximum-scale=1.0,
			user-scalable=no">
		<title><?php echo SITE_NAME;?></title>
		<?php
		// Load System CSS Files
		$stylesheets = array(
			"jquery.toastmessage.css",
			"reset.css",
			"fonts.css",
			"screen.css"
		);
		
		foreach( $stylesheets as $sheet ) {
			
			if( file_exists( THEMES . "/". $theme . "/" . $sheet ) ) {
				
				echo( '<link rel="stylesheet" href="../themes/' . $theme . '/' . $sheet . '?v=' . Update::get_version() . '">' );
			}
		}
		
		if( file_exists( THEMES . "/". $theme . "/favicon.ico" ) ) {
			
			echo( '<link rel="icon" href="' . THEMES . '/' . $theme . '/favicon.ico" type="image/x-icon" />' );
		} else {
			
			echo( '<link rel="icon" href="../assets/images/favicon.ico" type="image/x-icon" />' );
		}
		?>
		<style>
			
			#container {
				
				overflow-y: auto;
				position: fixed;
				right: 50%;
				top: 50%;
				transform: translate( 50%,-50% );
				width: 50%;
			}
			
			@media only screen and (max-width: 650px) {
				
				#container {
					
					width: 80%;
				}
			}
		</style>
		<script src="../assets/js/jquery-3.5.1.js"></script>
		<script src="../assets/js/jquery.toastmessage.js"></script>
		<script src="../assets/js/codiad.js"></script>
		<script src="../assets/js/message.js"></script>
		<script src="../assets/js/events.js"></script>
		<script src="../assets/js/loading.js"></script>
		<script src="../assets/js/common.js"></script>
		<script src="../assets/js/forms.js"></script>
	</head>
	<body>
		<div id="container">
			<div>
				<p>Checks:</p>
				<pre id="status"><?php echo $checks_html;?></pre>
			</div>
			<div id="installation"></div>
		</div>
		<script src="./install.js"></script>
	</body>
</html>