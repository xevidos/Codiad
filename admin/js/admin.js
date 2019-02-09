( function( global, $ ) {
	
	// Define core
	let codiad = global.codiad,
	scripts = document.getElementsByTagName( 'script' ),
	path = scripts[scripts.length-1].src.split( '?' )[0],
	curpath = path.split( '/' ).slice( 0, -1 ).join( '/' ) + '/';
	
	$( function() {
		
		codiad.admin.init();
	});
	
	codiad.admin = {
		
		path: curpath,
		
		init: function() {
			
		},
	};
})( this, jQuery );