/*
 *  Copyright (c) Codiad, Kent Safranski (codiad.com), and Isaac Brown (telaaedifex.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){
	
	// Define core
	var codiad = global.codiad,
	scripts = document.getElementsByTagName('script'),
	path = scripts[scripts.length-1].src.split('?')[0],
	curpath = path.split('/').slice(0, -1).join('/')+'/';
	
	// Instantiates plugin
	$(function() {
		
		amplify.subscribe('settings.changed', function(){
			//React here on changed settings
			//console.log( 'local storage:' + localStorage.getItem('codiad.settings.autosave') );
			//console.log( 'class storage:' + codiad.auto_save.settings.autosave );
			//console.log( 'settings storage:' + settings['codiad.settings.autosave'] );
			
			codiad.auto_save.settings.autosave = localStorage.getItem('codiad.settings.autosave');
			codiad.auto_save.reload_interval();
		});
		
		codiad.auto_save.init();
	});
	
	codiad.auto_save = {
	
		// Allows relative `this.path` linkage
		auto_save_trigger: null,
		invalid_states: [ "", " ", null, undefined ],
		path: curpath,
		saving: false,
		settings: {
			autosave: true,
			toggle: true,
		},
		verbose: false,
		
		init: function() {
			
			this.get_settings();
			//console.log( this.settings.autosave );
			// Check if the auto save setting is true or false
			// Also check to see if the editor is any of the invalid states
			if( this.settings.autosave === false || this.settings.autosave === "false" ) {
				
				window.clearInterval( this.auto_save_trigger );
				
				if( codiad.auto_save.verbose ) {
					console.log( 'Auto save disabled' );
				}
				return;
			}
			
			$(window).focus(function() {
			
				//Turn auto save off if the user leaves the tab.
				codiad.auto_save.settings.toggle = false;
				if( codiad.auto_save.verbose ) {
					console.log( 'Auto save resumed' );
				}
			});
		
			$(window).blur(function() {
				
				//Turn auto save off if the user leaves the tab.
				codiad.auto_save.settings.toggle = false;
				if( codiad.auto_save.verbose ) {
					console.log( 'Auto save paused' );
				}
			});
			
			console.log( 'Auto save Enabled' );
			//let editor = document.getElementsByClassName( 'ace_content' )[0];
			this.auto_save_trigger = setInterval( this.auto_save, 256 );
		},
		
		/**
		* 
		* This is where the core functionality goes, any call, references,
		* script-loads, etc...
		* 
		*/
		
		auto_save: function() {
			
			if( this.settings.toggle === false  || this.settings.autosave === false || codiad.auto_save.invalid_states.includes( codiad.editor.getContent() ) ) {
				
				return;
			}
			
			this.saving = true;
			
			if ( codiad.active.getPath() === null ) {
				
				this.saving = false;
				return;
			}
			
			let tabs = document.getElementsByClassName( "tab-item" );
			let path = codiad.active.getPath();
			let content = codiad.editor.getContent();
			
			codiad.active.save;
			codiad.filemanager.saveFile(path, content, localStorage.removeItem(path), false);
			var session = codiad.active.sessions[path];
			if( typeof session != 'undefined' ) {
				session.untainted = content;
				session.serverMTime = session.serverMTime;
				if (session.listThumb) session.listThumb.removeClass('changed');
				if (session.tabThumb) session.tabThumb.removeClass('changed');
			}
			
			this.saving = false;
		},
		
		get_settings: function() {

            var _this = this;

            $.each(['autosave'], function(idx, key) {
                var localValue = localStorage.getItem('codiad.settings.' + key);
                if (localValue !== null) {
                    _this.settings[key] = localValue;
                    //console.log( `${key}, ${localValue}` );
                }
            });
		},
		
		reload_interval: function() {
			
			try {
				
				window.clearInterval( codiad.autosave.auto_save_trigger );
				window.clearInterval( this.auto_save_trigger );
			} catch( error ) {}
			
			if( codiad.auto_save.settings.autosave === true || codiad.auto_save.settings.autosave === "true" ) {
				
				codiad.auto_save.auto_save_trigger = setInterval( codiad.auto_save.auto_save, 256 );
			}
		}
	};
})(this, jQuery);