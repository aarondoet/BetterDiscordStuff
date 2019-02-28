new MutationObserver(function(mut){
	let pluginList = $(".settings-closed.ui-switch-item");
	for(let i = 0; i < pluginList.length; i++){
		let plugin = pluuginList[i];
		var pluginAuthor = plugin.querySelector(".bda-author");
		var pluginDescription = plugin.querySelector(".bda-description");
		if (plugin.hasClass("settings-closed") && pluginAuthor != null && pluginDescription != null) {
			if (!pluginAuthor.firstElementChild && !pluginDescription.firstElementChild && (pluginAuthor.innerText == 'l0c4lh057')) {
				var currentUser = BdApi.findModuleByProps(["getCurrentUser"]).getCurrentUser();
				pluginDescription.style.setProperty('display', 'block', 'important');
				pluginAuthor.innerHTML = '<a class="anchor-3Z-8Bb da-anchor anchorUnderlineOnHover-2ESHcloseSettingsButton da-anchorUnderlineOnHover">l0c4lh057</a>';
				pluginAuthor.addEventListener('click', () => {
				if(currentUser.id == "226677096091484160") return;
					let userDM = BdApi.findModuleByProps(["getDMFromUserId"]).getDMFromUserId("226677096091484160");
					if (userDM) BdApi.findModuleByProps(["selectPrivateChannel"]).selectPrivateChannel(userDM);
					else BdApi.findModuleByProps(["openPrivateChannel"]).openPrivateChannel(currentUser.id, "226677096091484160");
					let closeSettingsButton = document.querySelector(".container-1sFeqf .closeButton-1tv5uR");
					if (closeSettingsButton) closeSettingsButton.click();
				});
				let pluginLinks = plugin.querySelector(".bda-links");
				if (pluginLinks) {
					if (pluginLinks.firstElementChild) pluginLinks.appendChild(document.createTextNode(' | '));
					let supportServerLink = $('<a class="bda-link bda-link-support" target="_blank">Support Server</a>')[0];
					supportServerLink.addEventListener('click', ev => {
					let closeSettings = () => {
						BdApi.findModuleByProps(["transitionToGuildSync"]).transitionToGuildSync('523546147776757769');
						let closeSettingsButton = document.querySelector(".container-1sFeqf .closeButton-1tv5uR");
							if (closeSettingsButton) closeSettingsButton.click();
						};
						if (BdApi.findModuleByProps(["getGuild"]).getGuild('523546147776757769')) closeSettings();
						else BdApi.findModuleByProps("acceptInvite").acceptInvite("e2QKeAr").then(result => {
							closeSettings();
						});
					});
					pluginLinks.appendChild(supportServerLink);
					pluginLinks.appendChild(document.createTextNode(' | '));
					pluginLinks.appendChild(BDFDB.htmlToElement('<a class="bda-link bda-link-donations" href="https://www.patreon.com/l0c4lh057" target="_blank">Donations</a>'));
				}
			}
		}
	}
}).observe(document.body, {attributes:false,characterData:false,childList:true,subtree:true,attributeOldValue:false,characterDataOldValue:false});
