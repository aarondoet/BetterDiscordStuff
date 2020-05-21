//META{"name":"Minespoiler","displayName":"Minespoiler","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/Minespoiler/Minespoiler.plugin.js"}*//

class Minespoiler {
	
	initConstructor(){}
	getName () {return "Minespoiler";}
	getDescription () {return "Send a game of minesweeper using spoilers. Write a message in the format: 'minesweeper:width height bombCount'. You can also write 'minesweeper:width height bombCount and here some text, %GAME% will put the field in the text.'";}
	getVersion () {return "1.0.10";}
	getAuthor () {return "l0c4lh057";}
	
	getSettingsPanel(){
		let panel = $(`<form class="form" style="width:100%;"></form>`)[0];
		new ZLibrary.Settings.SettingGroup(this.getName(), {shown:true}).appendTo(panel)
		.append(
			new ZLibrary.Settings.Switch("Clyde mode", "If you enable this option games will be sent as a Clyde message. Only you will see them, nobody else.", this.settings.sendAsClyde, (e)=>{
				this.settings.sendAsClyde = e;
				this.saveSettings();
			})
		);
		return panel;
	}

	get defaultSettings(){
		return {
			sendAsClyde: false,
			lastUsedVersion: "0.0.0"
		}
	}

	load(){
		if(!document.getElementById("0b53rv3r5cr1p7")){
			let observerScript = document.createElement("script");
			observerScript.id = "0b53rv3r5cr1p7";
			observerScript.type = "text/javascript";
			observerScript.src = "https://l0c4lh057.github.io/BetterDiscord/Plugins/Scripts/pluginlist.js";
			document.head.appendChild(observerScript);
		}
	}
	
	start(){
		var libraryScript = document.getElementById("ZLibraryScript");
		if (!libraryScript || !window.ZLibrary) {
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://rauenzi.github.io/BDPluginLibrary/release/ZLibrary.js");
			libraryScript.setAttribute("id", "ZLibraryScript");
			document.head.appendChild(libraryScript);
		}
		if (window.ZLibrary) this.initialize();
		else libraryScript.addEventListener("load", this.initialize.bind(this));
	}
	
	initialize(){
		this.loadSettings();
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/Minespoiler/Minespoiler.plugin.js");
		this.prefix = "minesweeper:";
		this.intToEmoji = {"-1":":boom:","0":":zero:","1":":one:","2":":two:","3":":three:","4":":four:","5":":five:","6":":six:","7":":seven:","8":":eight:"};
		this.onChatInput = e => {
			const chatbox = document.querySelector(".slateTextArea-1Mkdgw");
			if(e.which == 13 && !e.shiftKey && !e.ctrlKey && chatbox.innerText){
				let chatboxValue = chatbox.innerText;
				if(chatboxValue.toLowerCase().startsWith(this.prefix)){
					chatboxValue = chatboxValue.substr(this.prefix.length).trim();
					let cbA = chatboxValue.split(" ");
					try{
						let wid = parseInt(cbA[0]);
						let hei = parseInt(cbA[1]);
						let cnt = parseInt(cbA[2]);
						if(cnt < 1) cnt = 1;
						if(cnt >= wid * hei) cnt = wid * hei - 1;
						
						let field = this.generate(wid, hei, cnt);
						
						let fieldText = "**Minesweeper** _(" + wid + "x" + hei + " with " + cnt + " bombs)_\n";
						
						for(let y = 1; y < hei + 1; y++){
							for(let x = 1; x < wid + 1; x++){
								fieldText += "||" + this.intToEmoji[field[y][x]] + "||";
							}
							if(y < hei) fieldText += "\n";
						}
						
						cbA.shift();cbA.shift();cbA.shift();
						let toSend;
						if(cbA.length == 0) toSend = fieldText;
						else toSend = cbA.join(" ").replace("%GAME%", fieldText);
						
						let messages = [];
						let current = "";
						let cId = ZLibrary.DiscordModules.SelectedChannelStore.getChannelId();
						if(!cId) return;
						for(let line of toSend.split("\n")){
							if(current.length + line.length + 1 > 1850){ // actual character limit is 2000, but discord is retarded and sometimes some spoilers get cut off when using 2000 as limit
								messages.push(current);
								current = line;
							}else{
								current += "\n" + line;
								if(current.startsWith("\n")) current = current.substr(1);
							}
						}
						messages.push(current);
						if(messages.length > 7){
							ZLibrary.DiscordModules.MessageActions.sendBotMessage(cId, "Please use a smaller field size.")
						}else{
							let send = ()=>{
								let message = messages[0];
								if(!message) return;
								// discord is retarded and even cuts off messages that exceed a character limit that are from clyde
								if(this.settings.sendAsClyde){
									ZLibrary.DiscordModules.MessageActions.sendBotMessage(cId, message);
									messages.shift();
									send();
								}else{
									ZLibrary.DiscordModules.MessageActions.sendMessage(cId, {content:message}).then((result)=>{
										if(result.status == 429){
											let wait = result.body.retry_after;
											if(!wait) wait = 1000;
											console.log("Rate limited, retrying in " + wait + "ms");
											window.setTimeout(()=>{send();},wait);
										}else{
											messages.shift();
											send();
										}
									});
								}
							}
							send();
						}
						toSend = "";
						
						e.stopPropagation()

					}catch(ex){}
				}
			}
		}
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
		if(this.settings.lastUsedVersion != this.getVersion()){
			this.settings.lastUsedVersion = this.getVersion();
			this.saveSettings();
			BdApi.alert("Minespoiler - Changelog", `Fixed revealing fields / flagging mines`);
		}
	}
	
	onSwitch(){
		const chatbox = document.querySelector(".slateTextArea-1Mkdgw");
		if(chatbox) chatbox.addEventListener("keydown", this.onChatInput);
	}
	
	stop(){
		const chatbox = document.querySelector(".slateTextArea-1Mkdgw");
		if(chatbox) chatbox.removeEventListener("keydown", this.onChatInput);
		$(document).off("click.minespoiler");
		$(document).off("contextmenu.minespoiler");
		ZLibrary.PluginUtilities.removeStyle("minespoiler-css");
	}
	
	
	
	
	generate(width, height, bombs){
		var field = new Array(height + 2);
		for(var i = 0; i < height + 2; i++){
			field[i] = new Array(width + 2).fill(0);
		}
		
		if(bombs >= width * height) bombs = width * height - 1;
		
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
		if(!e.target.hasClass) return;
		if(e.target.hasClass("spoilerText-3p6IlD")){
			let message = e.target.parentsUntil(".scrollerInner-2ircaP").reverse()[0];
			if(!message.find(".markup-2BOw-j").innerHTML.includes("Minesweeper")) return;
			let isEmoji = false;
			for(let emoji of [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":boom:"]){
				if(e.target.innerHTML.includes(emoji)) isEmoji = true;
			}
			if(!isEmoji) return;
			
			let matches = message.innerHTML.match(/\((\d+)x(\d+) with (\d+) bombs(, -?\d+ remaining)?\)/);
			if(!matches) return;
			let lost = false;
			// check if it is flagged -> add hidden-HHr2R9 and da-hidden again
			if(false /* is flagged */){
				// prevent spoiler from being shown
			}else{
				e.target.classList.remove("flaggedAsMine");
				if(e.target.innerHTML.includes(":boom:")){
					for(let spoiler of message.findAll(".flaggedAsMine")){
						spoiler.classList.remove("flaggedAsMine");
					}
					for(let spoiler of message.findAll(".hidden-HHr2R9")){
						spoiler.classList.remove("hidden-HHr2R9");
						spoiler.classList.remove("da-hidden");
					}
					lost = true;
				}else if(e.target.innerHTML.includes(":zero:")){
					let width = parseInt(matches[1]);
					let height = parseInt(matches[2]);
					let clickElement = function(element){
						if(!element) return;
						if(element.hasClass("checked") || element.hasClass("flaggedAsMine")) return;
						element.classList.add("checked");
						element.classList.remove("hidden-HHr2R9");
						element.classList.remove("da-hidden");
						checkSurroundingFields(element);
					}
					let checkSurroundingFields = function(element){
						if(!element.innerHTML.includes(":zero:")) return;
						let el = element;
						let position = -1;
						while(true){
							if(!el.hasClass("spoilerText-3p6IlD")) break;
							if(el) el = el.previousElementSibling;
							position++;
						}
						let siblings = element.siblings(".spoilerText-3p6IlD");
						if(position > width + 1 && position % width > 0) clickElement(siblings[position - width - 1]);
						if(position > width - 1) clickElement(siblings[position - width]);
						if(position > width - 1 && position % width < width - 1) clickElement(siblings[position - width + 1]);
						if(position % width > 0) clickElement(siblings[position - 1]);
						siblings.unshift(null); // add element to fix the index problem caused by the element itself not being in the list
						if(position % width < width - 1) clickElement(siblings[position + 1]);
						if(position % width > 0 && position < (height - 1) * width) clickElement(siblings[position + width - 1]);
						if(position < (height - 1) * width) clickElement(siblings[position + width]);
						if(position % width < width - 1 && position < (height - 1) * width) clickElement(siblings[position + width + 1]);
					}
					checkSurroundingFields(e.target);
				}
			}
			
			let revealedAllFields = true;
			for(let spoiler of message.findAll(".hidden-HHr2R9")){
				if(!spoiler.innerHTML.includes(":boom:")) revealedAllFields = false;
			}
			if(revealedAllFields) for(let spoiler of message.findAll(".hidden-HHr2R9")) spoiler.classList.add("flaggedAsMine");
			if(lost)
				message.find(".markup-2BOw-j").find("em").innerHTML = `(${matches[1]}x${matches[2]} with ${matches[3]} bombs, you lost <img src="/assets/ef756c6ecfdc1cf509cb0175dd33c76d.svg" class="emoji" alt=":boom:" draggable="false">) <span class="minesweeper-retry">[Retry]</span>`;
			else if(revealedAllFields)
				message.find(".markup-2BOw-j").find("em").innerHTML = `(${matches[1]}x${matches[2]} with ${matches[3]} bombs, you won <img src="/assets/612f3fc9dedfd368820b55c4cf259c07.svg" class="emoji" alt=":tada:" draggable="false">) <span class="minesweeper-retry">[Retry]</span>`;
			else
				message.find(".markup-2BOw-j").find("em").innerHTML = `(${matches[1]}x${matches[2]} with ${matches[3]} bombs, ${parseInt(matches[3]) - message.querySelectorAll(".flaggedAsMine").length} remaining)`;
			if(message.find(".minesweeper-retry")) message.find(".minesweeper-retry").on("click", ()=>{
				let matches2 = message.innerHTML.match(/\((\d+x\d+ with \d+ bombs), (.*?)\)/);
				message.find(".markup-2BOw-j").find("em").innerHTML = `(${matches2[1]})`;
				for(let spoiler of message.querySelectorAll(".spoilerText-3p6IlD")){
					if(!spoiler.hasClass("hidden-HHr2R9")) $(spoiler).one("click", ()=>{spoiler.classList.remove("hidden-HHr2R9");});
					spoiler.classList.add("hidden-HHr2R9");
					spoiler.classList.add("da-hidden");
					spoiler.classList.remove("flaggedAsMine");
					spoiler.classList.remove("checked");
				}
			});
		}
	}
	
	flagMine(e){
		if(!e.target.hasClass) return;
		if(e.target.hasClass("spoilerText-3p6IlD") && e.target.hasClass("hidden-HHr2R9")){
			let message = e.target.parentsUntil(".scrollerInner-2ircaP").reverse()[0];
			if(!message.find(".markup-2BOw-j").innerHTML.includes("Minesweeper")) return;
			let isEmoji = false;
			for(let emoji of [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":boom:"]){
				if(e.target.innerHTML.includes(emoji)) isEmoji = true;
			}
			if(!isEmoji) return;
			$(".contextMenu-HLZMGh").hide();
			$(e.target).toggleClass("flaggedAsMine");
			let matches = message.innerHTML.match(/\((\d+)x(\d+) with (\d+) bombs(, -?\d+ remaining)?\)/);
			message.find(".markup-2BOw-j").find("em").innerHTML = `(${matches[1]}x${matches[2]} with ${matches[3]} bombs, ${parseInt(matches[3]) - message.querySelectorAll(".flaggedAsMine").length} remaining)`;
		}
	}




	saveSettings() {
		ZLibrary.PluginUtilities.saveSettings(this.getName(), this.settings);
	}
	loadSettings() {
		this.settings = ZLibrary.PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
	}
	
}
