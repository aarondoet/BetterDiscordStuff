//META{"name":"ContextMenuFixer","displayName":"ContextMenuFixer"}*//

class ContextMenuFixer {
	getName(){return "ContextMenuFixer";}
	getAuthor(){return "l0c4lh057";}
	getVersion(){return "0.0.2";}
	getDescription(){return "Fixes context menus being off the screen";}
	
	start(){
		$(document).on('contextmenu.' + this.getName(), (e) => {
			this.contextMenuEvent(e);
		});
	}
	stop(){
		$(document).off('contextmenu.' + this.getName());
	}
	
	
	contextMenuEvent(e) {
		process.nextTick(function(){
			let context = document.querySelector('.contextMenu-HLZMGh');
			if(!context) return;
			document.cm = context;
			let chei = context.offsetHeight + 10;
			let whei = window.innerHeight;
			if(chei + context.offsetTop > whei){
				let ypos = whei - chei;
				if(ypos < 0) ypos = 0;
				context.style.top = ypos + "px";
			}
		});
	}
}
