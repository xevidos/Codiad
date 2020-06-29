<?php

/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

//////////////////////////////////////////////////////////////////
// CONFIG
//////////////////////////////////////////////////////////////////

// PATH TO CODIAD
define( "BASE_PATH", "absolute/path/to/codiad" );

// BASE URL TO CODIAD (without trailing slash)
define( "BASE_URL", "domain.tld" );

// THEME : default, modern or clear (look at /themes)
define( "THEME", "default" );

// ABSOLUTE PATH, this is used as whitelist for absolute path projects 
define( "WHITEPATHS", array(
	"/home",
));

// SESSIONS ( e.g. 7200 )
$cookie_lifetime = "0";

// TIMEZONE
date_default_timezone_set( "America/New_York" );

// Allows to overwrite the default language
//define( "LANGUAGE", "en" );

// External Authentification
//define( "AUTH_PATH", "/path/to/customauth.php" );

// Site Name
define( "SITE_NAME", "Codiad" );

define( "DBHOST", "localhost" );
define( "DBNAME", "database" );
define( "DBUSER", "username" );
define( "DBPASS", "password" );
define( "DBTYPE", "mysql" );

//////////////////////////////////////////////////////////////////
// ** DO NOT EDIT CONFIG BELOW **
//////////////////////////////////////////////////////////////////

// PATHS
define( "COMPONENTS", BASE_PATH . "/components" );
define( "PLUGINS", BASE_PATH . "/plugins" );
define( "THEMES", BASE_PATH . "/themes" );
define( "DATA", BASE_PATH . "/data" );
define( "WORKSPACE", BASE_PATH . "/workspace" );

// URLS
define( "WSURL", BASE_URL . "/workspace" );

// Marketplace
//define( "MARKETURL", "http://market.codiad.com/json" );

?>
