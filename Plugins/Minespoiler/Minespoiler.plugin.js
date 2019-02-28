//META{"name":"Minespoiler","displayName":"Minespoiler","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/Minespoiler/Minespoiler.plugin.js"}*//

class Minespoiler {
	
	initConstructor(){}
	getName () {return "Minespoiler";}
	getDescription () {return "Send a game of minesweeper using spoilers. Write a message in the format: 'minesweeper:width height bombCount'. You can also write 'minesweeper:width height bombCount and here some text, %GAME% will put the field in the text.'";}
	getVersion () {return "0.0.6";}
	getAuthor () {return "l0c4lh057";}
	
	start(){
		var self = this;
		var libraryScript = document.getElementById("ZLibraryScript");
		if (!libraryScript || !window.ZLibrary) {
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://rauenzi.github.io/BDPluginLibrary/release/ZLibrary.js");
			libraryScript.setAttribute("id", "ZLibraryScript");
			document.head.appendChild(libraryScript);
		}
		if (window.ZLibrary) this.initialize();
		else libraryScript.addEventListener("load", () => {self.initialize();});
	}
	
	initialize(){
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/Minespoiler/Minespoiler.plugin.js");
		var self = this;
		this.prefix = "minesweeper:";
		this.intToEmoji = JSON.parse('{"-1":":boom:","0":":zero:","1":":one:","2":":two:","3":":three:","4":":four:","5":":five:","6":":six:","7":":seven:","8":":eight:"}');
		this.onChatInput = e => {
			const chatbox = e.target;
			if(e.which == 13 && !e.shiftKey && !e.ctrlKey && chatbox.value){
				let chatboxValue = chatbox.value.trim();
				if(chatboxValue.toLowerCase().startsWith(self.prefix)){
					chatboxValue = chatboxValue.substr(self.prefix.length).trim();
					let cbA = chatboxValue.split(" ");
					try{
						let wid = parseInt(cbA[0]);
						let hei = parseInt(cbA[1]);
						let cnt = parseInt(cbA[2]);
						if(cnt > wid * hei) cnt = wid * hei;
						
						let field = this.generate(wid, hei, cnt);
						
						let fieldText = "**Minesweeper** _(" + wid + "x" + hei + " with " + cnt + " bombs)_\n";
						
						for(let y = 1; y < hei + 1; y++){
							for(let x = 1; x < wid + 1; x++){
								fieldText += "||" + self.intToEmoji[field[y][x]] + "||";
							}
							if(y < hei) fieldText += "\n";
						}
						
						cbA.shift();cbA.shift();cbA.shift();
						let toSend;
						if(cbA.length == 0) toSend = fieldText;
						else toSend = cbA.join(" ").replace("%GAME%", fieldText);
						
						chatbox.select();
						document.execCommand("insertText", false, toSend);
					}catch(ex){}
				}
			}
		}
		document.lostGame = false;
		this.css = `
			.hidden-HHr2R9:not(.flaggedAsMine) img.emoji {
				opacity: 0;
			}
			.flaggedAsMine img.emoji {
				content: url("/assets/a1f0c106b0a0f68f6b11c2dc0cc8d249.svg");
			}
			span.spoilerText-3p6IlD.hidden-HHr2R9.flaggedAsMine .inlineContent-3ZjPuv {
				opacity: 1;
			}
		`;
		ZLibrary.PluginUtilities.addStyle("minespoiler-css", this.css);
		$(document).on("click.minespoiler", this.revealField);
		$(document).on("contextmenu.minespoiler", this.flagMine);
		this.onSwitch();
	}
	
	onSwitch(){
		const chatbox = this.getChatbox();
		if(chatbox) chatbox.addEventListener("keydown", this.onChatInput);
	}
	
	stop(){
		const chatbox = this.getChatbox();
		if(chatbox) chatbox.removeEventListener("keydown", this.onChatInput);
		$(document).off("click.minespoiler");
		$(document).off("contextmenu.minespoiler");
		ZLibrary.PluginUtilities.removeStyle("minespoiler-css");
	}
	
	getChatbox(){
		let chat = document.getElementsByClassName("chat-3bRxxu")[0];
		return chat ? chat.getElementsByTagName("textarea")[0] : null;
	}
	
	
	generate(width, height, bombs){
		var field = new Array(height + 2);
		for(var i = 0; i < height + 2; i++){
			field[i] = new Array(width + 2).fill(0);
		}
		
		if(bombs > width * height) bombs = width * height;
		
		while(bombs > 0){
			let x = this.random(width) + 1;
			let y = this.random(height) + 1;
			if(field[y][x] == 0){
				field[y][x] = -1;
				bombs -= 1;
			}
		}
		
		for(var x = 1; x < width + 1; x++){
			for(var y = 1; y < height + 1; y++){
				if(field[y][x] == 0){
					var sum = 0;
					for(var xn = x - 1; xn < x + 2; xn++)
						for(var yn = y - 1; yn < y + 2; yn++)
							if(field[yn][xn] == -1) sum++;
					field[y][x] = sum;
				}
			}
		}
		
		return field;
	}
	
	random(max){
		return Math.floor(Math.random() * max);
	}
	
	
	
	
	
	
	
	
	
	
	revealField(e){
		if(document.lostGame) return;
		if(!e.target.hasClass) return;
		if(e.target.hasClass("spoilerText-3p6IlD")){
			let message = e.target.parentsUntil(".message-1PNnaP").reverse()[0];
			if(!message.find(".markup-2BOw-j").innerHTML.includes("Minesweeper")) return;
			let isEmoji = false;
			for(let emoji of [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":boom:"]){
				if(e.target.innerHTML.includes(emoji)) isEmoji = true;
			}
			if(!isEmoji) return;
			
			// check if it is flagged -> add hidden-HHr2R9 and da-hidden again
			if(false /* is flagged */){
				// prevent spoiler from being shown
			}else{
				if(e.target.innerHTML.includes(":boom:")){
					document.lostGame = true;
					for(let spoiler of message.findAll(".hidden-HHr2R9")){
						spoiler.click();
					}
					document.lostGame = false;
				}
			}
			
			let revealedAllFields = true;
			for(let spoiler of message.findAll(".hidden-HHr2R9")){
				if(!spoiler.innerHTML.includes(":boom:")) revealedAllFields = false;
			}
			if(revealedAllFields) for(let spoiler of message.findAll(".hidden-HHr2R9")) spoiler.addClass("flaggedAsMine");
		}
	}
	
	flagMine(e){
		if(!e.target.hasClass) return;
		if(e.target.hasClass("spoilerText-3p6IlD") && e.target.hasClass("hidden-HHr2R9")){
			let message = e.target.parentsUntil(".message-1PNnaP").reverse()[0];
			if(!message.find(".markup-2BOw-j").innerHTML.includes("Minesweeper")) return;
			let isEmoji = false;
			for(let emoji of [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":boom:"]){
				if(e.target.innerHTML.includes(emoji)) isEmoji = true;
			}
			if(!isEmoji) return;
			$(".contextMenu-HLZMGh").hide();
			$(e.target).toggleClass("flaggedAsMine");
			
			
		}
	}
	
}
