<?php

namespace FileSystemStorage;

class User {
	
	protected static $instance = null;
	
	function __construct() {}
	
	public static function create_user( $user ) {
		
		return ( \Data::get_instance() )->fss->update_data( "users", array( "FileSystemStorage\\User", "create_user_callback", array( $user ) ) );
	}
	
	public static function create_user_callback( $headers, $d, $user ) {
		
		$new = array();
		foreach( $headers as $h ) {
			
			if( isset( $user[$h] ) ) {
				
				$new[$h] = $user[$h];
			}
		}
		$d[] = $new;
		return $d;
	}
	
	/**
	 * Return an instance of this class.
	 *
	 * @since	${current_version}
	 * @return	object	A single instance of this class.
	 */
	public static function get_instance() {
		
		if( null == self::$instance ) {
			
			self::$instance = new self;
		}
		
		return self::$instance;
	}
	
	public static function get_users() {
		
		return ( \Data::get_instance() )->fss->get_data( "users" );
	}
}

?>