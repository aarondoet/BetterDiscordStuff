//META{"name":"BackupContacts","displayName":"BackupContacts","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/BackupContacts/BackupContacts.plugin.js"}*//

class BackupContacts {
	getName(){return "BackupContacts";}
	getAuthor(){return "l0c4lh057";}
	getVersion(){return "0.0.2";}
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
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/BackupContacts/BackupContacts.plugin.js");
		this.onSwitch();
	}
	onSwitch(){
		if(document.getElementsByClassName("friendsTable-133bsv").length > 0 && document.getElementsByClassName("backupContacts backupBtn").length == 0){
			let self  = this;
			let friendsHeader = $(".friendsTable-133bsv")[0].previousSibling;
			let buttons = friendsHeader.find(".tabBar-1E2ExX");
			let button1 = $(`<div class="backupContacts backupBtn iconMargin-2YXk4F tabBar-1E2ExX primary-3j8BhM item-3HpYcP topPill-30KHOu item-PXvHYJ da-headerBar da-tabBar da-itemDefault" id="backupContacts exportBtn">Export</div>`)[0];
			let button2 = $(`<div class="backupContacts backupBtn iconMargin-2YXk4F tabBar-1E2ExX primary-3j8BhM item-3HpYcP topPill-30KHOu item-PXvHYJ da-headerBar da-tabBar da-itemDefault" id="backupContacts importBtn">Import</div>`)[0];
			buttons.append(button1);
			buttons.append(button2);
			button1.on("click", function(){
				self.exportContacts();
			});
			button2.on("click", function(){
				self.openFile();
			});
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
		let self = this;
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
		let alert = this.alertText("Import Contacts", htmlString, function(){
			endRelationship = endRelationship.filter(uId => alert.find(`.backupContacts.endRelationship.id${uId}`).checked);
			sendFriendRequest = sendFriendRequest.filter(uId => alert.find(`.backupContacts.sendRequest.id${uId}`).checked);
			toBlock = toBlock.filter(uId => alert.find(`.backupContacts.block.id${uId}`).checked);
			self.removeRelationships(endRelationship);
			self.addFriends(sendFriendRequest);
			self.blockUsers(toBlock);
		});
	}

	async getUserById(uId){
		let user = ZLibrary.DiscordModules.UserStore.getUser(uId);
		if(user) return user;
		let u = await ZLibrary.WebpackModules.getByProps("getAPIBaseURL").get(ZLibrary.WebpackModules.getByProps("Permissions", "ActivityTypes", "StatusTypes").Endpoints.USER(uId));
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
			window.setTimeout(()=>{sendReq();}, 2000);
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
		let self = this;
		let dialog = require("electron").remote.dialog;
		dialog.showOpenDialog({title:"Open backup",filters:[{name:"JSON Files",extensions:["json"]},{name:"All Files",extensions:"*"}]}, function(sel){
			if(!sel) return;
			let fs = require("fs");
			fs.readFile(sel[0], (err, content) => {
				if(err){
					BdApi.alert("Could not load contacts from the file " + err.message);
				}else{
					self.importContacts(JSON.parse(content.toString()));
				}
			});
		});
	}
	
	
	
	
	
	
	alertText(e, t, callback) {
		let a = $(`<div class="bd-modal-wrapper theme-dark" style="z-index:9999;">
						<div class="bd-backdrop backdrop-1wrmKB"></div>
						<div class="bd-modal modal-1UGdnR">
							<div class="bd-modal-inner inner-1JeGVc" style="width:auto;max-width:70%;max-height:100%;">
								<div class="header header-1R_AjF">
									<div class="title">${e}</div>
								</div>
								<div class="bd-modal-body">
									<div class="scroller-wrap fade">
										<div class="scroller">
											${t}
										</div>
									</div>
								</div>
								<div class="footer footer-2yfCgX">
									<button type="button" class="backupContacts okButton">Okay</button>
								</div>
							</div>
						</div>
					</div>`);
		a.find(".footer button").on("click", () => {
			callback();
			a.addClass("closing"), setTimeout(() => {
				a.remove()
			}, 300)
		}), a.find(".bd-backdrop").on("click", () => {
			a.addClass("closing"), setTimeout(() => {
				a.remove()
			}, 300)
		}), a.appendTo("#app-mount");
		return a.find(".bd-modal-inner")[0];
	}
}
