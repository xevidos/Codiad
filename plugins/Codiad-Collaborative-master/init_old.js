/*
*  Copyright (c) Codiad (codiad.com) & Isaac Brown (telaaedifex.com),
*  distributed as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/

(function (global, $) {
	
	var codiad = global.codiad,
	scripts = document.getElementsByTagName('script'),
	path = scripts[scripts.length-1].src.split('?')[0],
	curpath = path.split( '/' ).slice( 0, -1 ).join( '/ ') + '/';
	
	var buffer_dumped = false;
	var collaborator = null;
	var current_editor = codiad.active.getPath();
	var cursor = null;
	var editor = null;
	var initial = false;
	var just_cleared_buffer = null;
	var just_opened = false;
	var last_applied_change = null;
	var loaded = false;
	var loading = true;
	var session_id = codiad.system.session_id;
	var site_id = codiad.system.site_id;
	
	function Collaborator( file_path, session_id ) {
		

		this.collaboration_socket = null
		let file_id = btoa( current_editor );
		this.collaboration_socket = io.connect( "https://local.telaaedifex.com:1337", {'forceNew': true, query:'?session=' + session_id + "&file=" + site_id + current_editor} );
		
		this.collaboration_socket.on( "change", function(delta) {
			
			if( current_editor !== codiad.active.getPath() || editor === null ) {
				return;
			}
			
			delta = JSON.parse( delta ) ;
			last_applied_change = delta ;
			editor.getSession().getDocument().applyDeltas( [delta] ) ;
		}.bind() );
		
		this.collaboration_socket.on( "clear_buffer", function() {
			just_cleared_buffer = true ;
			console.log( "setting editor contents" ) ;
			editor.setValue( "" ) ;
		}.bind() );
		
		this.collaboration_socket.on( "recieve_init", function(delta) {
			
			delta = JSON.parse( delta ) ;
			
			console.log( 'Recieved dump buffer JSON', delta.message, delta.initial );
			initial = delta.initial;
			
			if ( delta.initial === true ) {
				
				console.log( 'Setting initial content...' );
				//codiad.editor.setContent( '' );
				codiad.editor.setContent( delta.content )
				inital = false;
			}
			
			setTimeout(function(){
				if( cursor !== null ) {
					console.log( 'Going to position: '  + cursor.row + ", " + cursor.column );
					editor.gotoLine( cursor.row, cursor.column, true );
				}
			}, 256);
			
		}.bind() );
		
		this.collaboration_socket.on( "recieve_content", function( ) {
				
			console.log( 'Someone is joining ...' );
			console.log( 'Cursor is at '  + cursor.row + ", " + cursor.column  );
			
			// Remove change callback
			editor.removeEventListener( "change", handle_change );
			codiad.editor.disableEditing();
			codiad.editor.setContent( '' );
			collaborator.dump_buffer()
			// registering change callback
			editor.addEventListener( "change", handle_change );
		}.bind() );
		
		this.collaboration_socket.on( "unlock", function( ) {
				
			console.log( 'Unlocking editors and going to ' + cursor.row + ", " + cursor.column );
			
			codiad.editor.enableEditing();
			setTimeout(function(){
				if( cursor !== null ) {
					console.log( 'Going to position: '  + cursor.row + ", " + cursor.column );
					editor.gotoLine( cursor.row, cursor.column, true );
				}
			}, 256);
		}.bind() );
		
		window.collaboration_socket = this.collaboration_socket;
	}
	
	Collaborator.prototype.change = function( delta ) {
		
		this.collaboration_socket.emit( "change", delta );
	}
	
	Collaborator.prototype.clear_buffer = function() {
		this.collaboration_socket.emit( "clear_buffer" );
	}
	
	Collaborator.prototype.disconnect = function() {
		this.collaboration_socket.emit( "disconnect" );
	}
	
	Collaborator.prototype.dump_buffer = function() {
		this.collaboration_socket.emit( "dump_buffer" );
	}
	
	Collaborator.prototype.send_init = function( content ) {
		this.collaboration_socket.emit( "send_init", content );
	}
	
	function handle_change( e ) {
		
		// TODO, we could make things more efficient and not likely to conflict by keeping track of change IDs
		coords = editor.getCursorPosition();
		if( coords.row !== 0 && coords.column !== 0 ) {
			cursor = editor.getCursorPosition();
			cursor.row = cursor.row + 1
			console.log( 'Cursor at: '  + cursor.row + ", " + cursor.column );
		}
		
		if( last_applied_change!=e && !just_cleared_buffer ) {
			
			collaborator.change( JSON.stringify(e) );
		}
		
		just_cleared_buffer = false;
	}
	
	function close() {
		
		if( typeof window.collaboration_socket === 'undefined' ) {
			
			return;
		}
		
		if( window.collaboration_socket !== null ) {
			
			window.collaboration_socket.disconnect();
		}
		
		if( editor !== null ) {
			
			editor.removeEventListener( "change", handle_change );
		}
		
		editor = null;
		loaded = false;
		//current_editor = null;
		window.collaboration_socket = null;
		console.log( 'Cleared buffer and closed editor.' );
	}
	
	function body_loaded() {
		
		if( collaborator !== null && editor !== null && initial === false ) {
			
			if( last_applied_change !== null ) {
				
				editor.setValue( "" )
				collaborator.dump_buffer()
			}
			//document.getElementsByTagName('textarea')[0].focus() ;
			last_applied_change = null ;
			just_cleared_buffer = false ;
			return;
		}
		
		current_editor = codiad.active.getPath();
		editor = ace.edit( codiad.editor.getActive() );
		
		if( editor === null ) {
			
			return;
		}
		
		let content = null;
		
		collaborator = new Collaborator( session_id );
		
		//codiad.editor.disableEditing();
		//collaborator.open_file(  )
		content = codiad.editor.getContent()
		codiad.editor.setContent( '' )
		collaborator.send_init( content )
		
		// registering change callback
		editor.addEventListener( "change", handle_change );
		
		//editor.setTheme( "ace/theme/monokai") ;
		editor.$blockScrolling = Infinity;
		
		//collaborator.dump_buffer();
		let dumped_content = null;
		
		
		dumped_content = codiad.editor.getContent()
		collaborator.dump_buffer();
		loaded = true;
	}
	
	collaborator = new Collaborator( session_id );
	collaborator.send_init()
	
	if( window.collaboration_socket !== null ) {
		
		window.collaboration_socket.disconnect();
	}
		
	/* Subscribe to know when a file is being closed. */
	amplify.subscribe('active.onClose', function (path) {
		
		close()
	});
	
	$(window).blur(function() {
		
		if( editor !== null ) {
			coords = editor.getCursorPosition();
			if( coords.row !== 0 && coords.column !== 0 ) {
				cursor = editor.getCursorPosition();
				cursor.row = cursor.row + 1
				console.log( 'Cursor at: '  + cursor.row + ", " + cursor.column );
			}
		}
		close();
	});
	
	/* When the window is clicked get the cursor position. 
	$(window).click(function () {
		
		coords = editor.getCursorPosition();
		if( coords.row !== 0 && coords.column !== 0 ) {
			//cursor = editor.getCursorPosition();
			//cursor.row = cursor.row + 1
			//console.log( 'Cursor at: '  + cursor.row + ", " + cursor.column );
		}
	});*/
	
	/* Subscribe to know when a file become active. */
	amplify.subscribe('active.onFocus', function (path) {
		
		just_opened = true;
		
		if( current_editor !== codiad.active.getPath() && current_editor !== null ) {
		
			cursor = null;
			console.log( 'Closing Socket' );
			close();
		}
		console.log( 'Last Editor: ' + current_editor );
		
		if( loaded === false ) {
			
			console.log( 'Loading Body' );
			body_loaded();
		}
		console.log( 'Focused Editor: ' + codiad.active.getPath() );
		
		coords = editor.getCursorPosition();
		if( coords.row !== 0 && coords.column !== 0 ) {
			cursor = editor.getCursorPosition();
			cursor.row = cursor.row + 1
			console.log( 'Cursor at: '  + cursor.row + ", " + cursor.column );
		}
	});
	
	//////////////////////////////////////////////////////////////////
	//
	// Collaborative Component for Codiad
	// ---------------------------------
	// Displays in real time the selection position and
	// the changes when concurrently editing files.
	//
	//////////////////////////////////////////////////////////////////
	
	codiad.collaborative = {
		
		
	};
	
})(this, jQuery);