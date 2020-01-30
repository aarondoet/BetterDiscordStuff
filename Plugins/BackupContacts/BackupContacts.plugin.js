//META{"name":"BackupContacts","displayName":"BackupContacts","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/BackupContacts/BackupContacts.plugin.js"}*//

class BackupContacts {
	getName(){return "BackupContacts";}
	getAuthor(){return "l0c4lh057";}
	getVersion(){return "0.0.3";}
	getDescription(){return "Create a backup of all your contacts and blocked users"};
	
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
		else libraryScript.addEventListener("load", () => {this.initialize();});
	}
	initialize(){
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/BackupContacts/BackupContacts.plugin.js");
		this.onSwitch();
	}
	onSwitch(){
		if(document.getElementsByClassName("container-1r6BKw").length > 0 && document.getElementsByClassName("backupContacts backupBtn").length == 0){
			let friendsHeader = $(".container-1r6BKw")[0];
			let buttons = friendsHeader.find(".children-19S4PO .tabBar-ZmDY9v");
			let button1 = $(`<div class="backupContacts backupBtn item-3HknzM da-item item-PXvHYJ da-item" id="backupContacts-exportBtn" role="button" style="background-color: rgb(67, 181, 129); color: rgb(255, 255, 255);"><span aria-hidden="true">Export</span></div>`)[0];
			let button2 = $(`<div class="backupContacts backupBtn item-3HknzM da-item item-PXvHYJ da-item" id="backupContacts-importBtn" role="button" style="background-color: rgb(67, 181, 129); color: rgb(255, 255, 255);"><span aria-hidden="true">Import</span></div>`)[0];
			buttons.append(button1);
			buttons.append(button2);
			button1.on("click", this.exportContacts.bind(this));
			button2.on("click", this.openFile.bind(this));
		}
	}
	stop(){
		$(".backupContacts.backupBtn").remove();
	}
	
	exportContacts(){
		let relationships = ZLibrary.DiscordModules.RelationshipStore.getRelationships();
		let friends = [];
		let pending = [];
		let blocked = [];
		for(let r in relationships){
			if(relationships[r] === 1) friends.push(r);
			else if(relationships[r] === 2) blocked.push(r);
			else if(relationships[r] === 4) pending.push(r);
		}
		let friendsString = friends.join('","');
		let pendingString = pending.join('","');
		let blockedString = blocked.join('","');
		let data = `{"friends":[${friendsString.length > 0 ? `"${friendsString}"` : ""}],"pending":[${pendingString.length > 0 ? `"${pendingString}"` : ""}],"blocked":[${blockedString.length > 0 ? `"${blockedString}"` : ""}]}`;
		this.saveFile(data, "Discord Contacts.json");
	}
	
	async importContacts(data){
		let sendRequest = [];
		let sendPending = [];
		let unfriend = [];
		let unblock = [];
		let block = [];
		let relationships = ZLibrary.DiscordModules.RelationshipStore.getRelationships();
		let relationshipUsers = Object.keys(relationships);
		for(let blocked of data["blocked"]){
			if(relationshipUsers.includes(blocked)){
				if(relationships[blocked] !== 2) block.push(blocked);
			}else
				block.push(blocked);
		}
		for(let friend of data["friends"]){
			if(relationshipUsers.includes(friend)){
				if(relationships[friend] !== 1) sendRequest.push(friend);
			}else
				sendRequest.push(friend);
		}
		for(let pending of data["pending"]){
			if(relationshipUsers.includes(pending)){
				if(relationships[pending] !== 1 && relationships[pending] !== 4) sendPending.push(pending);
			}else
				sendPending.push(pending);
		}
		for(let uId of relationshipUsers){
			if((relationships[uId] === 1 || relationships[uId] === 4) && !data["friends"].includes(uId) && !data["pending"].includes(uId)) unfriend.push(uId);
			if(relationships[uId] === 2 && !data["blocked"].includes(uId)) unblock.push(uId);
		}
		let sendFriendRequest = sendRequest.concat(sendPending);
		let endRelationship = unfriend.concat(unblock);
		let toBlock = block;
		
		
		let cbUnchecked = `<div class="flexChild-faoVW3 da-flexChild switch-3wwwcV da-switch value-2hFrkk sizeDefault-2YlOZr size-3rFEHg themeDefault-24hCdX" tabindex="0" style="flex: 0 0 auto;"><input id="1" class="checkbox-2tyjJg da-checkbox" type="checkbox" tabindex="-1" checked=""></div>`;
		let htmlString = `<table><tr style="font-size:120%;font-weight:bold;"><td>Send Friend Request (Friends)</td></tr>`;
		for(let uId of sendRequest){
			let user = await this.getUserById(uId)
			htmlString += `<tr><td>${user.username}#${user.discriminator} (${uId})</td><td><input type="checkbox" class="backupContacts sendRequest id${uId}" checked></td></tr>`;
		}
		htmlString += `<tr style="font-size:120%;font-weight:bold;"><td>Send Friend Request (Pending)</td></tr>`;
		for(let uId of sendPending){
			let user = await this.getUserById(uId)
			htmlString += `<tr><td>${user.username}#${user.discriminator} (${uId})</td><td><input type="checkbox" class="backupContacts sendRequest id${uId}" checked></td></tr>`;
		}
		htmlString += `<tr style="font-size:120%;font-weight:bold;"><td>Unfriend Users</td></tr>`;
		for(let uId of unfriend){
			let user = await this.getUserById(uId)
			htmlString += `<tr><td>${user.username}#${user.discriminator} (${uId})</td><td><input type="checkbox" class="backupContacts endRelationship id${uId}"></td></tr>`;
		}
		htmlString += `<tr style="font-size:120%;font-weight:bold;"><td>Block Users</td></tr>`;
		for(let uId of block){
			let user = await this.getUserById(uId)
			htmlString += `<tr><td>${user.username}#${user.discriminator} (${uId})</td><td><input type="checkbox" class="backupContacts block id${uId}"></td></tr>`;
		}
		htmlString += `<tr style="font-size:120%;font-weight:bold;"><td>Unblock Users</td></tr>`;
		for(let uId of unblock){
			let user = await this.getUserById(uId)
			htmlString += `<tr><td>${user.username}#${user.discriminator} (${uId})</td><td><input type="checkbox" class="backupContacts endRelationship id${uId}"></td></tr>`;
		}
		
		htmlString += `</table>`;
		let alert = this.alertText("Import Contacts", htmlString, ()=>{
			endRelationship = endRelationship.filter(uId => alert.find(`.backupContacts.endRelationship.id${uId}`).checked);
			sendFriendRequest = sendFriendRequest.filter(uId => alert.find(`.backupContacts.sendRequest.id${uId}`).checked);
			toBlock = toBlock.filter(uId => alert.find(`.backupContacts.block.id${uId}`).checked);
			this.removeRelationships(endRelationship);
			this.addFriends(sendFriendRequest);
			this.blockUsers(toBlock);
		});
	}

	async getUserById(uId){
		let user = ZLibrary.DiscordModules.UserStore.getUser(uId);
		if(user) return user;
		let u = await ZLibrary.DiscordModules.APIModule.get(ZLibrary.DiscordModules.DiscordConstants.Endpoints.USER(uId));
		if(u) return JSON.parse(u.text);
		return {"username": "Could not resolve user", "discriminator": "Could not resolve user"};
	}
	
	/* 1 = friend
	 * 2 = blocked
	 * 3 = incoming
	 * 4 = outgoing */
	getBlockedUsers(){
		let blocked = [];
		for(let uId in ZLibrary.DiscordModules.RelationshipStore.getRelationships()){
			let status = ZLibrary.DiscordModules.RelationshipStore.getRelationships()[uId];
			if(status === 2){
				blocked.push(uId);
			}
		}
		return blocked;
	}
	getFriends(){
		let friends = [];
		for(let uId in ZLibrary.DiscordModules.RelationshipStore.getRelationships()){
			let status = ZLibrary.DiscordModules.RelationshipStore.getRelationships()[uId];
			if(status === 1){
				friends.push(uId);
			}
		}
		return friends;
	}
	getPendingFriends(){
		let pending = [];
		for(let uId in ZLibrary.DiscordModules.RelationshipStore.getRelationships()){
			let status = ZLibrary.DiscordModules.RelationshipStore.getRelationships()[uId];
			if(status === 4){
				pending.push(uId);
			}
		}
		return pending;
	}
	
	
	addFriends(userIds){
		let sendReq = ()=>{
			let uId = userIds[0];
			if(!uId) return;
			ZLibrary.DiscordModules.RelationshipManager.addRelationship(uId, 0, 4).then((res)=>{
				if(res.status >= 200 && res.status < 300){
					userIds.shift();
					sendReq();
				}else{
					let wait = (res.body ? res.body.retry_after + 500 : 1000) || 1000;
					window.setTimeout(()=>{sendReq();}, wait);
				}
			})
		};
		sendReq();
	}
	removeRelationships(userIds){
		let sendReq = ()=>{
			let uId = userIds[0];
			if(!uId) return;
			// does not return anything, idk if it is rate limited but just to make sure i added a delay
			ZLibrary.DiscordModules.RelationshipManager.removeRelationship(uId);
			window.setTimeout(()=>{sendReq();}, 5000);
		};
		sendReq();
	}
	blockUsers(userIds){
		let sendReq = ()=>{
			let uId = userIds[0];
			if(!uId) return;
			ZLibrary.DiscordModules.RelationshipManager.addRelationship(uId, 0, 2).then((res)=>{
				if(res.status >= 200 && res.status < 300){
					userIds.shift();
					sendReq();
				}else{
					let wait = (res.body ? res.body.retry_after + 500 : 1000) || 1000;
					window.setTimeout(()=>{sendReq();}, wait);
				}
			})
		};
		sendReq();
	}
	
	
	saveFile(content, filename){
		let dialog = require("electron").remote.dialog;
		dialog.showSaveDialog({defaultPath: filename, title: "Save Discord Contacts"}, function(sel){
			if(!sel) return;
			let fs = require("fs");
			fs.writeFile(sel, content, (err) => {
				if(err){
					BdApi.alert("Could not save contacts in the file " + err.message);
				}
			});
		});
	}
	
	openFile(){
		let dialog = require("electron").remote.dialog;
		dialog.showOpenDialog({title:"Open backup",filters:[{name:"JSON Files",extensions:["json"]},{name:"All Files",extensions:"*"}]}, (sel)=>{
			if(!sel) return;
			let fs = require("fs");
			fs.readFile(sel[0], (err, content) => {
				if(err){
					BdApi.alert("Could not load contacts from the file " + err.message);
				}else{
					this.importContacts(JSON.parse(content.toString()));
				}
			});
		});
	}
	
	
	
	
	
	
	alertText(e, t, callback) {
		let backdrop = $(`<div class="backdrop-1wrmKB da-backdrop" style="opacity: 0.85; background-color: rgb(0, 0, 0); z-index: 1000; transform: translateZ(0px);"></div>`);
		let a =  $(`<div class="modal-3c3bKg da-modal" style="opacity: 1; transform: scale(1) translateZ(0px); z-index: 9999999">
						<div data-focus-guard="true" tabindex="0" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
						<div data-focus-guard="true" tabindex="1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
						<div data-focus-lock-disabled="false" class="inner-1ilYF7 da-inner">
							<div class="modal-yWgWj- da-modal container-14fypd da-container sizeSmall-1jtLQy">
								<div class="scrollerWrap-2lJEkd firefoxFixScrollFlex-cnI2ix da-scrollerWrap da-firefoxFixScrollFlex content-1EtbQh da-content scrollerThemed-2oenus da-scrollerThemed themeGhostHairline-DBD-2d">
									<div class="scroller-2FKFPG firefoxFixScrollFlex-cnI2ix da-scroller da-firefoxFixScrollFlex systemPad-3UxEGl da-systemPad inner-ZyuQk0 da-inner content-dfabe7 da-content">
										<h2 class="h2-2gWE-o title-3sZWYQ size16-14cGz5 height20-mO2eIN weightSemiBold-NJexzi da-h2 da-title da-size16 da-height20 da-weightSemiBold defaultColor-1_ajX0 da-defaultColor title-18-Ds0 marginBottom20-32qID7 marginTop8-1DLZ1n da-title da-marginBottom20 da-marginTop8">
											${e}
										</h2>
										<div class="body-Mj9Oxz da-body medium-zmzTW- size16-14cGz5 height20-mO2eIN primary-jw0I4K">
											${t}
										</div>
									</div>
								</div>
								<div class="flex-1xMQg5 flex-1O1GKY da-flex da-flex horizontalReverse-2eTKWD horizontalReverse-3tRjY7 flex-1O1GKY directionRowReverse-m8IjIq justifyBetween-2tTqYu alignStretch-DpGPf3 wrap-ZIn9Iy footer-3rDWdC da-footer" style="flex: 0 0 auto;">
									<button class="primaryButton-2BsGPp da-primaryButton button-38aScr da-button lookFilled-1Gx00P colorBrand-3pXr91 sizeXlarge-2yFAlZ grow-q77ONN da-grow">
										<div class="contents-18-Yxp da-contents">Okay</div>
									</button>
								</div>
							</div>
						</div>
						<div data-focus-guard="true" tabindex="0" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
					</div>`);
		a.find(".da-footer button").on("click", () => {
			if(typeof callback === "function") callback();
            a.remove();
            backdrop.remove();
		});
		backdrop.on("click", () => {
            a.remove();
            backdrop.remove();
		});
		let modalRoot = document.querySelector("#app-mount > div[data-no-focus-lock='true'] > div:not([class])");
		backdrop.appendTo(modalRoot);
		a.appendTo(modalRoot);
		return a.find("div.da-modal")[0];
	}
}
