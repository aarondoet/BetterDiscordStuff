//META{"name":"GuildData","displayName":"GuildData","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/GuildData/GuildData.plugin.js"}*//

class GuildData {
	getName(){return "GuildData";}
	getAuthor(){return "l0c4lh057";}
	getDescription(){return "Shows information about guilds, channels and roles by right clicking the guild's icon in the guild list.";};
	getVersion(){return "2.0.3";}
	
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
	stop(){
		$(document.body).off("contextmenu.guilddata");
		$(document.body).off("click.guilddata");
		$("#guilddata-popup").remove();
		ZLibrary.PluginUtilities.removeStyle("guilddata-css");
	}
	onSwitch(){
		
	}
	
	getSettingsPanel(){
		let panel = $(`<form class="form" style="width:100%;"></form>`)[0];
		new ZLibrary.Settings.SettingGroup(this.getName(), {shown:true}).appendTo(panel)
		.append(
			new ZLibrary.Settings.Slider("Emoji Columns", "How many columns are used in the emoji list", 1, 20, this.settings.emojiColCount, (e)=>{
				this.settings.emojiColCount = e;
				this.saveSettings();
			}, {markers:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], stickToMarkers:true})
		)
		.append(
			new ZLibrary.Settings.Textbox("Date format", "How dates are displayed in this plugin", this.settings.dateFormat, (e)=>{
				this.settings.dateFormat = e;
				this.saveSettings();
			})
		).append(
			new ZLibrary.Settings.SettingGroup("Date variables")
			.append($(`<div>
				SSS - milliseconds (e.g. 000, 123, 999)<br>
				ss - seconds with leading zero (e.g. 00, 24, 59)<br>
				s - seconds without leading zero (e.g. 0, 24, 59)<br>
				mm - minutes with leading zero (e.g. 00, 36, 59)<br>
				m - minutes without leading zero (e.g. 0, 36, 59)<br>
				HH - hours with leading zero in 24h format (e.g. 00, 16, 23)<br>
				H - hours without leading zero in 24h format (e.g. 0, 16, 23)<br>
				hh - hours with leading zero in 12h format (e.g. 01, 07, 12)<br>
				h - hours without leading zero in 12h format (e.g. 1, 7, 12)<br>
				dddd - name of the day of the week (e.g. Monday, Wednesday, Sunday)<br>
				ddd - abbreviation of the name of the day of the week (e.g. Mon, Wed, Sun)<br>
				dd - day of the month with leading zero (e.g. 01, 14, 31)<br>
				d - day of the month without leading zero (e.g. 1, 14, 31)<br>
				MMMM - name of the month (e.g. January, August, December)<br>
				MMM - abbreviation of name of the month (e.g. Jan, Aug, Dec)<br>
				MM - month with leading zero (e.g. 01, 08, 12)<br>
				M - month without leading zero (e.g. 1, 8, 12)<br>
				yyyy - full year (1999, 2019, 2104)<br>
				yy - last two digits of the year (99, 19, 04)<br>
				tt - (AM, PM)<br>
				zzz - timezone offset to UTC (e.g. -12:00, +00:00, +12:00)<br>
				zz - timezone offset to UTC (e.g. -12, +00, +12)<br>
				z - timezone offset to UTC (e.g. -12, +0, +12)<br>
				<b>You can escape ONE character at a time by putting a backslash <code>\\</code> in front of it</b>
			</div>`)[0])
		).append(
			new ZLibrary.Settings.Slider("Max shown user count", "max amount of users shown in the member list (more users -> longer loading time), default: 100", 50, 1000, this.settings.maxUsersShown, (e)=>{
				this.settings.maxUsersShown = e;
				this.saveSettings();
			}, {markers:[50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000], stickToMarkers:true})
		).append(
			new ZLibrary.Settings.Dropdown("Language", "The language of this plugin (has no effect yet)", this.settings.language, [{label:"Auto",value:"auto"}, {label:"English",value:"en"}, {label:"German",value:"de"}], (e)=>{
				this.settings.language = e;
				this.saveSettings();
				this.updateLanguage();
			})
		);
		return panel;
	}

	get defaultSettings(){
		return {
			maxUsersShown: 100,
			showUsernamesInMemberlist: true,
			language: "auto",
			emojiColCount: 6,
			dateFormat: "dd/MM/yyyy hh:mm:ss tt"
		}
	}

	get local(){
		// no languages (except english) supported yet
		if(!this.strings) this.strings = JSON.parse(`{
			"en": {
				"settings": {

				},
				"guildInfo": {
					"title": "Guild Information",
					"relationships": {
						"friends": {
							"title": "Friends"
						},
						"blocked": {
							"title": "Blocked Users"
						}
					}
				},
				"userInfo": {
					"title": "User Information"
				},
				"channelInfo": {
					"title": "Channel Information"
				},
				"roleInfo": {
					"title": "Role Information"
				}
			},
			"de": {

			}
		}`);
		return this.strings[this.language] || this.strings["en"];
	}

	initialize(){
		this.loadSettings();
		this.updateLanguage();
		let css = `
			#guilddata-popup {
				position: fixed;
				width: 75%;
				height: 75%;
				left: 12.5%;
				top: 12.5%;
				z-index: 1000;
				background-color: #202225;
				padding: 20px;
				color: #aaa;
				border-radius: 10px;
			}
			#guilddata-inner {
				top: 30px;
				left: 30px;
				width: calc(100% - 60px);
				height: calc(100% - 60px);
				position: absolute;
			}
			.guilddata-closebutton {
				position: absolute;
				top: 10px;
				right: 10px;
			}
			.guilddata-panel .guilddata-closebutton {
				top: 0;
			}
			.guilddata-closebutton:after {
				content: "X";
				color: red;
				font-size: 1.5em;
				font-weight: bold;
			}
			.guilddata-wrapper {
				position: absolute;
				margin: 10px;
				padding-top: 10px;
				width: calc(50% - 20px);
				height: calc(50% - 30px);
				border: 2px #444 solid;
				border-radius: 5px;
			}
			#guilddata-guildwrapper {
				left: 0;
				top: 0;
			}
			#guilddata-userwrapper {
				right: 0;
				top: 0;
			}
			#guilddata-channelwrapper {
				left: 0;
				bottom: 0;
			}
			#guilddata-rolewrapper {
				right: 0;
				bottom: 0;
			}
			.guilddata-panel {
				padding: 0 10px;
				overflow-y: auto;
				background-color: #202225;
				position: absolute;
				width: calc(100% - 20px);
			}
			.guilddata-panel::-webkit-scrollbar {
				width: 0.8em;
				height: 0.8em;
				background-color: #333;
				border-top-left-radius: 0.4em;
			}
			.guilddata-panel::-webkit-scrollbar-track {
				-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
			}
			.guilddata-panel::-webkit-scrollbar-thumb {
				background-color: #666;
				border-radius: 0.4em;
			}
			.guilddata-wrappertitle {
				font-size: 1.7em;
				color: #fff;
				text-align: center;
				margin-bottom: 10px;
			}
			.guilddata-title {
				font-size: 1.5em;
				color: #eee;
				text-align: center;
				margin-bottom: 10px;
			}
			.guilddata-image {
				display: block;
				margin-left: auto;
				margin-right: auto;
				margin-bottom: 10px;
			}
			.guilddata-table, #guilddata-channellist, #guilddata-rolelist, .guilddata-compareroleslist {
				border-collapse: collapse;
				width: 100%;
				margin-bottom: 10px;
			}
			.guilddata-tr:nth-child(odd) {
				background: rgba(0, 0, 0, 0.15);
			}
			.guilddata-tr:nth-child(even) {
				background: rgba(90, 90, 90, 0.15);
			}
			.guilddata-td {
				padding: 1px 4px;
			}
			.guilddata-th {
				font-size: 110%;
				font-weight: 500;
				border: 1px #666 solid;
			}
			#guilddata-usersearchinput {
				background-color: #444;
				color: #ddd;
				width: 75%;
				border: none;
			}
			#guilddata-usersearchbutton {
				position: relative;
				left: 5px;
				width: calc(25% - 5px);
				background-color: #444;
				color: #ddd;
			}
			#guilddata-usersearchresults {
				margin-top: 10px;
			}
			.guilddata-categorychannels {
				margin-left: 20px;
			}
			.guilddata-comparerolesheader, .guilddata-emojirolesheader {
				font-size: 125%;
				font-weight: bold;
			}
			.guilddata-comparerolesitem, .guilddata-emojirole {
				margin-left: 10px;
			}
			#guilddata-exportusers, #guilddata-exportroles, .guilddata-openprivatechat, .guilddata-openchannel, .guilddata-exportemojis {
				right: 5px;
				bottom: 5px;
				position: absolute;
				background-color: #444;
				color: #eee;
			}
			#guilddata-forceloadusers {
				left: 5px;
				bottom: 5px;
				position: absolute;
				background-color: #444;
				color: #eee;
			}
			.guilddata-relationshipuser {
				position: relative;
			}
			.guilddata-relationshippfp {
				width: 30px;
				height: 30px;
				margin-right: 10px;
			}
			.guilddata-relationshipname {
				position: absolute;
				top: 50%;
				transform: translateY(-50%);
			}
			.guilddata-emojiwrapper {
				margin: 0 5px 5px 0;
				display: inline-block;
			}
			.guilddata-emojiimg {
				width: 100%;
			}
			.guilddata-emojis {
				margin-bottom: 25px;
			}
			.guilddata-emojiname {
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.guilddata-notviewable {
				color: #f33;
			}
			.guilddata-channelicon {
				margin-right: 3px;
			}
			.guilddata-permission {
				margin-left: 10px;
			}
		`;
		ZLibrary.PluginUtilities.addStyle("guilddata-css", css);
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/GuildData/GuildData.plugin.js");
		$(document.body).on("contextmenu.guilddata", (e)=>{
			let el = e.target.parentElement;
			if(!el.href) el = e.target;
			if(!el.href) return;
			if(el.href.includes('/channels/@me/')) return; /* return if it's a private channel/group channel */
			if(!el.href.match(/\/channels\/[0-9]+\/[0-9]+/)) return; /* return if it's not a guild link */
			let gId = (el.href.match(/\d+/) || [])[0];
			if(!gId) return;
			process.nextTick(()=>{
				let contextmenu = document.querySelector(".menu-3sdvDG");
				if(!contextmenu) return;
				let subMenu = $(`<div><div role="separator" class="separator-2I32lJ"></div><div role="group"><div role="menuitem" class="item-1tOPte labelContainer-1BLJti colorDefault-2K3EoJ" id="show-guild-data" tabindex="-1"><div class="label-22pbtT">Show Guild Data</div></div></div></div>`)[0];
				subMenu.querySelector(".item-1tOPte").on("click", ()=>{
					$(contextmenu).hide();
					this.showPopup(gId);
				});
				contextmenu.querySelector(".scroller-2FKFPG").appendChild(subMenu);
			});
		});
		$(document.body).on("click.guilddata", (e)=>{
			if(e.target.hasClass)
				if(e.target.hasClass("guilddata-closebutton"))
					e.target.parentElement.outerHTML = "";
		});
		$(document.body).on("click.guilddata", (e)=>{
			if(!e.target.hasClass) return;
			if(e.target.parents(".guilddata-copy").length == 0 && !e.target.hasClass("guilddata-copy")) return;
			let toCopy = e.target.getAttribute("copyText");
			if(e.target.hasClass("guilddata-image") && !toCopy) toCopy = e.target.src;
			if(!toCopy) toCopy = e.target.innerText;
			DiscordNative.clipboard.copy(toCopy);
			ZLibrary.Toasts.success(`Copied "${this.escapeHtml(toCopy)}"`);
		});
		$(document.body).on("click.guilddata", (e)=>{
			if(!e.target.hasClass || !e.target.parentNode) return;
			if(!e.target.parentNode.hasClass) return;
			if(!e.target.hasClass("container-2Rl01u") && !e.target.parentNode.hasClass("container-2Rl01u"))
				if((e.target.parentsUntil(".container-2Rl01u").reverse()[0] || {nodeName:"HTML"}).nodeName == "HTML")
					return;
			window.setTimeout(()=>{
				let menu = $(".menu-3sdvDG")[0];
				if(!menu) return;
				let separator = $(`<div role="separator" class="separator-2I32lJ da-separator"></div>`)[0];
				menu.querySelector(".scroller-2FKFPG").appendChild(separator);
				let el = $(`<div role="group"><div class="item-1tOPte labelContainer-1BLJti colorDefault-2K3EoJ" role="menuitem" id="show-guild-data" tabindex="-1"><div class="label-22pbtT">Show Guild Data</div><div class="iconContainer-2-XQPY"><div class="icon-LYJorE" style="background-image:url('/assets/50f8ef2cdb4e7697a4202fb9c6d0e1fc.svg');"></div></div></div>`)[0];
				el.on("click", (e)=>{
					this.showPopup(ZLibrary.DiscordModules.SelectedGuildStore.getGuildId());
					$(".header-2o-2hj").click()
				});
				menu.querySelector(".scroller-2FKFPG").appendChild(el);
				menu.parentNode.css("height", `${menu.parentNode.clientHeight + separator.offsetHeight + el.offsetHeight}px`);
			}, 350);
		});


		if(!this.settings.lastUsedVersion){ // started the first time
			this.showWelcomeMessage();
			this.settings.lastUsedVersion = this.getVersion();
			this.saveSettings();
		}else if(this.settings.lastUsedVersion != this.getVersion()){ // updated
			this.showChangelog(this.settings.lastUsedVersion, this.getVersion());
			this.settings.lastUsedVersion = this.getVersion();
			this.saveSettings();
		}
	}
	
	showPopup(gId){
		let { GuildStore, GuildMemberStore, RelationshipStore, ChannelStore, UserStore, EmojiUtils, MemberCountStore } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let o = UserStore.getUser(g.ownerId);
		let members = GuildMemberStore.getMembers(g.id);
		let relationships = RelationshipStore.getRelationships();
		let friends = members.filter(m => relationships[m.userId] ? relationships[m.userId] == 1 : false);
		let blocked = members.filter(m => relationships[m.userId] ? relationships[m.userId] == 2 : false);
		let popup = $(
		   `<div id="guilddata-popup"><div class="guilddata-closebutton"></div><div id="guilddata-inner">
				<div class="guilddata-wrapper" id="guilddata-guildwrapper">
					<div class="guilddata-wrappertitle">${this.local.guildInfo.title}</div>
					<div class="guilddata-panel" id="guilddata-guildinfo">
						<div class="guilddata-title guilddata-copy"><span class="guilddata-guildname">${this.escapeHtml(g.name)}</span> (<span class="guilddata-guildid">${g.id}</span>)</div>
						<img class="guilddata-image guilddata-copy" id="guilddata-guildicon" src="${g.icon ? "https://cdn.discordapp.com/icons/" + g.id + "/" + g.icon + ".webp" : ""}">
						<table class="guilddata-table">
							<tr class="guilddata-tr">
								<td class="guilddata-td">Owner</td>
								<td class="guilddata-td" id="guilddata-guildowner">${o ? `${o.tag} (${o.id})` : `unknown`}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Acronym</td>
								<td class="guilddata-td guilddata-copy">${this.escapeHtml(g.acronym)}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Created at</td>
								<td class="guilddata-td guilddata-copy">${this.formatDate(this.getSnowflakeCreationDate(g.id), this.settings.dateFormat)}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Joined at</td>
								<td class="guilddata-td guilddata-copy">${this.formatDate(g.joinedAt, this.settings.dateFormat)}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Verification level</td>
								<td class="guilddata-td guilddata-copy"><span>${g.verificationLevel}</span> (<span>${this.getVerificationLevel(g.verificationLevel)}</span>)</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Explicit content filter</td>
								<td class="guilddata-td guilddata-copy"><span>${g.explicitContentFilter}</span> (<span>${this.getExplicitContentFilter(g.explicitContentFilter)}</span>)</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Default message notifications</td>
								<td class="guilddata-td guilddata-copy"><span>${g.defaultMessageNotifications}</span> (<span>${this.getDefaultMessageNotifications(g.defaultMessageNotifications)}</span>)</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Region</td>
								<td class="guilddata-td guilddata-copy">${g.region}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Features</td>
								<td class="guilddata-td guilddata-copy">${g.features.size ? Array.from(g.features).join(", ") : "No features"}</td>
							</tr>
							<tr class="guilddata-tr" id="guilddata-vanityurl">
								<td class="guilddata-td">Vanity URL</td>
								<td class="guilddata-td guilddata-copy">https://discord.gg/${g.vanityURLCode}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">System channel</td>
								<td class="guilddata-td" id="guilddata-systemchannel">${g.systemChannelId ? this.escapeHtml(ChannelStore.getChannel(g.systemChannelId).name) + " (" + g.systemChannelId + ")" : "No system channel"}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">AFK channel</td>
								<td class="guilddata-td" id="guilddata-afkchannel">${g.afkChannelId ? this.escapeHtml(ChannelStore.getChannel(g.afkChannelId).name) + " (" + g.afkChannelId + ")" : "No afk channel"}</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">AFK timeout</td>
								<td class="guilddata-td guilddata-copy">${g.afkTimeout / 60} minutes</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Emojis</td>
								<td class="guilddata-td" id="guilddata-guildemojis">${EmojiUtils.getGuildEmoji(g.id).length} emojis</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Member count</td>
								<td class="guilddata-td guilddata-copy">${MemberCountStore.getMemberCount(g.id)} members</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Channel count</td>
								<td class="guilddata-td guilddata-copy">${Object.values(ChannelStore.getChannels()).filter(c => c.guild_id == g.id && c.type != 4).length} channels</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Role count</td>
								<td class="guilddata-td guilddata-copy">${Object.values(g.roles).length} roles</td>
							</tr>
							<tr id="guilddata-serverboosting">
								<td class="guilddata-td">Premium member count</td>
								<td class="guilddata-td">${g.premiumSubscriberCount} members boosting (tier ${g.premiumTier})</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Friends</td>
								<td class="guilddata-td" id="guilddata-guildfriends">${friends.length} friends</td>
							</tr>
							<tr class="guilddata-tr">
								<td class="guilddata-td">Blocked users</td>
								<td class="guilddata-td" id="guilddata-guildblockedusers">${blocked.length} blocked users</td>
							</tr>
						</table>
					</div>
				</div>
				<div class="guilddata-wrapper" id="guilddata-userwrapper">
					<div class="guilddata-wrappertitle">${this.local.userInfo.title}</div>
					<div class="guilddata-panel" id="guilddata-usersinfo">
						<input id="guilddata-usersearchinput"><button id="guilddata-usersearchbutton">Search</button>
						<div id="guilddata-usersearchresults"></div>
					</div>
				</div>
				<div class="guilddata-wrapper" id="guilddata-channelwrapper">
					<div class="guilddata-wrappertitle">${this.local.channelInfo.title}</div>
					<div class="guilddata-panel" id="guilddata-channelsinfo">
						<div id="guilddata-channellist"></div>
					</div>
				</div>
				<div class="guilddata-wrapper" id="guilddata-rolewrapper">
					<div class="guilddata-wrappertitle">${this.local.roleInfo.title}</div>
					<div class="guilddata-panel" id="guilddata-rolesinfo">
						<div id="guilddata-rolelist"></div>
					</div>
				</div>
			</div></div>
		`)[0];
		if(document.getElementById("guilddata-popup")) document.getElementById("guilddata-popup").outerHTML = "";
		if(!o){
			ZLibrary.DiscordModules.APIModule.get(ZLibrary.DiscordModules.DiscordConstants.Endpoints.USER(g.ownerId)).then((result)=>{
				let u = JSON.parse(result.text);
				o = {tag: u.username + "#" + u.discriminator, id: u.id, username: u.username, discriminator: u.discriminator};
				popup.find("#guilddata-guildowner").innerText = `${o.tag} (${g.ownerId})`;
			});
		}
		
		popup.find("#guilddata-guildowner").on("click", ()=>{this.showUser(g.id, o.id);});
		if(g.systemChannelId) popup.find("#guilddata-systemchannel").on("click", ()=>{this.showChannel(g.systemChannelId);});
		if(g.afkChannelId) popup.find("#guilddata-afkchannel").on("click", ()=>{this.showChannel(g.afkChannelId);});
		popup.find("#guilddata-guildemojis").on("click", ()=>{this.showEmojis(g.id);});
		popup.find("#guilddata-guildfriends").on("click", ()=>{this.showRelationships(g.id, friends, "friends");});
		popup.find("#guilddata-guildblockedusers").on("click", ()=>{this.showRelationships(g.id, blocked, "blocked");});
		popup.find("#guilddata-usersearchbutton").on("click", ()=>{this.showUsers(g.id, popup.find("#guilddata-usersearchinput").value);});
		popup.find("#guilddata-usersearchinput").on("keydown", (e)=>{if(e.which == 13)this.showUsers(g.id, popup.find("#guilddata-usersearchinput").value);})
		popup.find("#guilddata-serverboosting").on("click", ()=>{this.showUsers(g.id, "#boosting:true")});
		
		document.querySelector(".appMount-3lHmkl").appendChild(popup);
		this.makeDraggable();
		
		if(!g.icon) popup.find("#guilddata-guildicon").outerHTML = "";
		if(!g.vanityURLCode) popup.find("#guilddata-vanityurl").outerHTML = "";
		$(".guilddata-panel").css("height", `calc(100% - ${document.querySelector(".guilddata-panel").offsetTop}px)`);
		this.showUsers(g.id, "");
		this.showChannels(g.id);
		this.showRoles(g.id);
	}

	showUsers(gId, query=""){
		let { GuildStore, GuildMemberStore, UserStore, UserStatusStore } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let members = GuildMemberStore.getMembers(gId);
		document.getElementById("guilddata-usersearchinput").value = query;
		$("#guilddata-userwrapper .guilddata-closebutton").click();
		if(query.match(/#(?![0-9])/)){
			for(let arg of query.split("#")){
				if(!arg.includes(":")) continue;
				let k = arg.split(":")[0];
				let vA = arg.split(":"); vA.shift();
				let v = vA.join(":");
				if(k == "nick") members = members.filter(m => (m.nick || UserStore.getUser(m.userId).username).toLowerCase().includes(v.toLowerCase()));
				if(k == "name") members = members.filter(m => UserStore.getUser(m.userId).username.toLowerCase().includes(v.toLowerCase()));
				if(k == "nicked") members = members.filter(m => v.toLowerCase() == "true" ? m.nick : !m.nick);
				if(k == "id") members = members.filter(m => m.userId.includes(v));
				if(k == "discriminator") members = members.filter(m => UserStore.getUser(m.userId).discriminator.includes(v));
				if(k == "status") members = members.filter(m => UserStatusStore.getStatus(m.userId).includes(v.toLowerCase()));
				if(k == "role") members = members.filter(m => Object.values(g.roles).filter(r => m.roles.includes(r.id) && r.name.toLowerCase().includes(v.toLowerCase())).length > 0);
				if(k == "roleid") members = members.filter(m => m.roles.filter(r => r.includes(v)).length > 0 || g.id.includes(v));
				if(k == "bot") members = members.filter(m => UserStore.getUser(m.userId).bot == (v.toLowerCase() == "true"));
				if(k == "boosting") members = members.filter(m => !!m.premiumSince == (v.toLowerCase() == "true"));


				if(k == "nick!") members = members.filter(m => !(m.nick || UserStore.getUser(m.userId).username).toLowerCase().includes(v.toLowerCase()));
				if(k == "name!") members = members.filter(m => !UserStore.getUser(m.userId).username.toLowerCase().includes(v.toLowerCase()));
				if(k == "nicked!") members = members.filter(m => v.toLowerCase() == "true" ? !m.nick : m.nick);
				if(k == "id!") members = members.filter(m => !m.userId.includes(v));
				if(k == "discriminator!") members = members.filter(m => !UserStore.getUser(m.userId).discriminator.includes(v));
				if(k == "status!") members = members.filter(m => !UserStatusStore.getStatus(m.userId).includes(v.toLowerCase()));
				if(k == "role!") members = members.filter(m => !(Object.values(g.roles).filter(r => m.roles.includes(r.id) && r.name.toLowerCase().includes(v.toLowerCase())).length > 0));
				if(k == "roleid!") members = members.filter(m => !(m.roles.filter(r => r.includes(v)).length > 0 || g.id.includes(v)));
				if(k == "bot!") members = members.filter(m => UserStore.getUser(m.userId).bot != (v.toLowerCase() == "true"));
				if(k == "boosting!") members = members.filter(m => !m.premiumSince == (v.toLowerCase() == "true"));
			}
		}else{
			members = members.filter(m => UserStore.getUser(m.userId).username.toLowerCase().includes(query.toLowerCase()) || (m.nick || UserStore.getUser(m.userId).tag).toLowerCase().includes(query.toLowerCase()));
		}
		let list = document.getElementById("guilddata-usersearchresults");
		list.innerHTML = `Found ${members.length} users for "${this.escapeHtml(query)}"<br><br>`;
		if(members.length > this.settings.maxUsersShown){
			list.innerHTML += `There are ${members.length} users matching your search. Please specify further.`;
		}else{
			if(this.settings.showUsernamesInMemberlist){
				for(let m of members){
					let el = $(`<div class="guilddata-usersearchresult" id="guilddata-usersearchresult u${m.userId}">${this.escapeHtml(UserStore.getUser(m.userId).tag)}</div>`)[0];
					el.on("click", ()=>{
						this.showUser(g.id, m.userId);
					});
					list.appendChild(el);
				}
			}else{
				for(let m of members){
					let el = $(`<div class="guilddata-usersearchresult" id="guilddata-usersearchresult u${m.userId}">${this.escapeHtml(m.nick || UserStore.getUser(m.userId).name)}#${UserStore.getUser(m.userId).discriminator}</div>`)[0];
					el.on("click", ()=>{
						this.showUser(g.id, m.userId);
					});
					list.appendChild(el);
				}
			}
		}
		$("#guilddata-exportusers").remove();
		$("#guilddata-forceloadusers").remove();
		let btn = $(`<button id="guilddata-exportusers">Export Users</button>`)[0];
		btn.on("click", ()=>{
			this.alertText("Export users", "You are exporting all users that match the current search.<br>In which format do you want to export the users?<br><br>%name% - username<br>%nick% - nickname or username if no nick is set<br>%discriminator% - the discriminator of the user<br>%id% - the user id<br><input id='guilddata-exportusersformat' value='%name%#%discriminator% (%id%)' style='width:90%;'>", ()=>{
				let format = document.getElementById("guilddata-exportusersformat").value;
				let formatMember = (m)=>{
					let u = UserStore.getUser(m.userId);
					return format.replace(/%name%/g, u.username).replace(/%nick%/g, m.nick || u.username).replace(/%discriminator%/g, u.discriminator).replace(/%id%/, m.userId);
				};
				this.downloadFile(members.map(m=>formatMember(m)).join("\r\n"), `users of ${g.name} - ${query}.txt`, `Export users of  ${g.name} that match ${query}`)
			})
		});
		let btn2 = $(`<button id="guilddata-forceloadusers">Load All Users</button>`)[0];
		btn2.on("click", ()=>{
			ZLibrary.DiscordModules.GuildActions.requestMembers(gId, '', 0);
		});
		document.getElementById("guilddata-userwrapper").appendChild(btn);
		document.getElementById("guilddata-userwrapper").appendChild(btn2);
	}

	async showUser(gId, uId){
		let { GuildStore, UserStore, UserStatusStore, GuildMemberStore, PrivateChannelActions } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let u = UserStore.getUser(uId);
		let m = GuildMemberStore.getMember(gId, uId);
		let a = UserStatusStore.getPrimaryActivity(uId);
		if(!u){
			let us = await ZLibrary.DiscordModules.APIModule.get(ZLibrary.DiscordModules.DiscordConstants.Endpoints.GUILD_MEMBER(gId, uId));
			us = JSON.parse(us.text);
			u = {tag: us.user.username + "#" + us.user.discriminator, username: us.user.username, discriminator: us.user.discriminator, id: us.user.id, avatarURL: `https://cdn.discordapp.com/avatars/${us.user.id}/${us.user.avatar}.png?size=128`, nick: us.nick, roles: us.roles};
			m = u;
		}
		let wrapper = document.getElementById("guilddata-userwrapper");
		let panel = $(`<div class="guilddata-panel" id="guilddata-userinfo"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title guilddata-copy"><span class="guilddata-username">${this.escapeHtml(u.tag)}</span> (<span class="guilddata-userid">${u.id}</span>)</div>
			<img class="guilddata-image guilddata-copy guilddata-usericon" style="border:3px ${this.getStatusColor(UserStatusStore.getStatus(u.id))} solid" src="${u.avatarURL}">
			<table class="guilddata-table">
				<tr class="guilddata-tr" id="guilddata-usernick">
					<td class="guilddata-td">Nick</td>
					<td class="guilddata-td guilddata-copy">${this.escapeHtml(m.nick || "")}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Color</td>
					<td class="guilddata-td guilddata-copy">${m.colorString ? `<span>${m.colorString}</span> <span style="color:${m.colorString}">(Example)</span>` : "No color set"}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Hoist role</td>
					<td class="guilddata-td" id="guilddata-hoistrole">${m.hoistRoleId ? `${this.escapeHtml(g.roles[m.hoistRoleId].name)} (${m.hoistRoleId})` : "No hoist role"}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Roles</td>
					<td class="guilddata-td">${m.roles.sort((r1, r2) => g.roles[r2].position - g.roles[r1].position).map(rId => `<div class="guilddata-memberrole r${rId}">${this.escapeHtml(g.roles[rId].name)} (${rId})</div>`).join("")}<div class="guilddata-memberrole r${g.id}">${this.escapeHtml(g.roles[g.id].name)} (${g.id})</div></td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Created at</td>
					<td class="guilddata-td guilddata-copy">${this.formatDate(u.createdAt, this.settings.dateFormat)}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Is bot</td>
					<td class="guilddata-td guilddata-copy">${u.bot}</td>
				</tr>
				<tr class="guilddata-tr" id="guilddata-boostingsince">
					<td class="guilddata-td">Boosting since</td>
					<td class="guilddata-td guilddata-copy">${this.formatDate(m.premiumSince, this.settings.dateFormat)}</td>
				</tr>
			</table>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-channelsinfo").offsetHeight}px`);

		if(!m.nick) panel.find("#guilddata-usernick").outerHTML = "";
		if(!m.premiumSince) panel.find("#guilddata-boostingsince").outerHTML = "";
		if(m.hoistRoleId) panel.find("#guilddata-hoistrole").on("click", ()=>{this.showRole(g.id, m.hoistRoleId);});

		let chatBtn = $(`<button class="guilddata-openprivatechat">Open Chat</button>`)[0];
		chatBtn.on("click", ()=>{
			PrivateChannelActions.ensurePrivateChannel(UserStore.getCurrentUser().id, u.id).then(()=>{
				PrivateChannelActions.openPrivateChannel(UserStore.getCurrentUser().id, u.id);
			});
		});

		for(let rId of m.roles){
			panel.find(`.guilddata-memberrole.r${rId}`).on("click", ()=>{this.showRole(g.id, rId)});
		}
		panel.find(`.guilddata-memberrole.r${g.id}`).on("click", ()=>{this.showRole(g.id, g.id)});
		panel.find(".guilddata-closebutton").on("click", ()=>{chatBtn.outerHTML = ""});

		wrapper.appendChild(panel);
		wrapper.appendChild(chatBtn);
	}

	showChannels(gId){
		let { GuildStore, ChannelStore, DiscordPermissions, GuildPermissions } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let channels = Object.values(ChannelStore.getChannels()).filter(c => c.guild_id == g.id);
		let categories = channels.filter(c => c.type == 4);
		let textchannels = channels.filter(c => c.type == 0 || c.type == 5 || c.type == 6);
		let voicechannels = channels.filter(c => c.type == 2);
		let compare = function(c1, c2){
			return c2.position - c1.position;
		}
		categories.sort(compare);
		textchannels.sort(compare);
		voicechannels.sort(compare);
		let list = document.getElementById("guilddata-channellist");
		list.innerHTML = "";
		for(let i = textchannels.length - 1; i >= 0; i--){
			let c = textchannels[i];
			if(!c.parent_id){
				let el = $(`<div class="guilddata-channel guilddata-textchannel guilddata-noparentchannel ${GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId:c.id}) ? "guilddata-viewable" : "guilddata-notviewable"}"><span class="guilddata-channelicon">${this.getChannelIcon(c.type, c.nsfw, false, c.id)}</span><span class="guilddata-channelname">${this.escapeHtml(c.name)}</span></div>`)[0];
				el.find(".guilddata-channelname").on("click", ()=>{this.showChannel(c.id);});
				list.appendChild(el);
				textchannels.splice(i, 1);
			}
		}
		for(let i = voicechannels.length - 1; i >= 0; i--){
			let c = voicechannels[i];
			if(!c.parent_id){
				let el = $(`<div class="guilddata-channel guilddata-voicechannel guilddata-noparentchannel ${GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId:c.id}) ? "guilddata-viewable" : "guilddata-notviewable"}"><span class="guilddata-channelicon">${this.getChannelIcon(c.type, c.nsfw, false, c.id)}</span><span class="guilddata-channelname">${this.escapeHtml(c.name)}</span></div>`)[0];
				el.find(".guilddata-channelname").on("click", ()=>{this.showChannel(c.id);});
				list.appendChild(el);
				voicechannels.splice(i, 1);
			}
		}
		for(let i = categories.length - 1; i >= 0; i--){
			let c = categories[i];
			let el = $(`<div class="guilddata-channelcollection guilddata-category"><div class="guilddata-channel guilddata-category ${GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId:c.id}) ? "guilddata-viewable" : "guilddata-notviewable"}"><span class="guilddata-channelicon">${this.getChannelIcon(c.type, c.nsfw, false, c.id)}</span><span class="guilddata-channelname">${this.escapeHtml(c.name)}</span></div><div class="guilddata-categorychannels"></div></div>`)[0];
			el.find(".guilddata-channelname").on("click", ()=>{this.showChannel(c.id);});
			el.find(".guilddata-channelicon").on("click", ()=>{
				let el2 = el.find(".guilddata-categorychannels");
				if(el2.style.display == "none"){
					el2.style.display = "block";
					el.find(".guilddata-channelicon").innerHTML = this.getChannelIcon(c.type, c.nsfw, false, c.id);
				}else{
					el2.style.display = "none";
					el.find(".guilddata-channelicon").innerHTML = this.getChannelIcon(c.type, c.nsfw, true, c.id);
				}
			});
			for(let j = textchannels.length - 1; j >= 0; j--){
				let c2 = textchannels[j];
				if(c2.parent_id == c.id){
					let el2 = $(`<div class="guilddata-channel guilddata-textchannel guilddata-parentchannel ${GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId:c2.id}) ? "guilddata-viewable" : "guilddata-notviewable"}"><span class="guilddata-channelicon">${this.getChannelIcon(c2.type, c2.nsfw, false, c2.id)}</span><span class="guilddata-channelname">${this.escapeHtml(c2.name)}</span></div>`)[0];
					el2.find(".guilddata-channelname").on("click", ()=>{this.showChannel(c2.id);});
					el.find(".guilddata-categorychannels").appendChild(el2);;
					textchannels.splice(j, 1);
				}
			}
			for(let j = voicechannels.length - 1; j >= 0; j--){
				let c2 = voicechannels[j];
				if(c2.parent_id == c.id){
					let el2 = $(`<div class="guilddata-channel guilddata-textchannel guilddata-parentchannel ${GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId:c2.id}) ? "guilddata-viewable" : "guilddata-notviewable"}"><span class="guilddata-channelicon">${this.getChannelIcon(c2.type, c2.nsfw, false, c2.id)}</span><span class="guilddata-channelname">${this.escapeHtml(c2.name)}</span></div>`)[0];
					el2.find(".guilddata-channelname").on("click", ()=>{this.showChannel(c2.id);});
					el.find(".guilddata-categorychannels").appendChild(el2);;
					voicechannels.splice(j, 1);
				}
			}
			list.appendChild(el);
			categories.splice(i, 1);
		}
	}

	showChannel(cId){
		let { GuildStore, DiscordPermissions, GuildPermissions, UserStore, ChannelStore, ChannelSelector, ChannelActions } = ZLibrary.DiscordModules;
		let c = ChannelStore.getChannel(cId);
		let g = GuildStore.getGuild(c.guild_id);
		let canSee = GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId:c.id});
		let wrapper = document.getElementById("guilddata-channelwrapper");
		let panel = $(`<div class="guilddata-panel" id="guilddata-channelinfo"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title guilddata-copy"><span class="guilddata-channelname">${this.escapeHtml(c.name)}</span> (<span class="guilddata-channelid">${c.id}</span>)</div>
			<table class="guilddata-table">
				<tr class="guilddata-tr">
					<td class="guilddata-td">Channel type</td>
					<td class="guilddata-td guilddata-copy"><span>${c.type}</span> (<span>${this.getChannelType(c.type)}</span>)</td>
				</tr>
				<tr class="guilddata-tr" id="guilddata-topic">
					<td class="guilddata-td">Topic</td>
					<td class="guilddata-td guilddata-copy">${this.escapeHtml(c.topic)}</td>
				</tr>
				<tr class="guilddata-tr" id="guilddata-userlimit">
					<td class="guilddata-td">User limit</td>
					<td class="guilddata-td guilddata-copy">${c.userLimit} users</td>
				</tr>
				<tr class="guilddata-tr" id="guilddata-bitrate">
					<td class="guilddata-td">Bitrate</td>
					<td class="guilddata-td guilddata-copy">${c.bitrate} kbps</td>
				</tr>
				<tr class="guilddata-tr" id="guilddata-slowmode">
					<td class="guilddata-td">Slowmode</td>
					<td class="guilddata-td guilddata-copy">${c.rateLimitPerUser} seconds</td>
				</tr>
				<tr class="guilddata-tr" id="guilddata-nsfw">
					<td class="guilddata-td">NSFW</td>
					<td class="guilddata-td guilddata-copy">${c.nsfw}</td>
				</tr>
			</table>
			<div id="guilddata-channelpermissionoverwrites"></div>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-channelsinfo").offsetHeight}px`);

		if(c.type != 0 && c.type != 5){
			panel.find("#guilddata-slowmode").outerHTML = "";
			panel.find("#guilddata-nsfw").outerHTML = "";
		}
		if(c.type != 2){
			panel.find("#guilddata-userlimit").outerHTML = "";
			panel.find("#guilddata-bitrate").outerHTML = "";
		}
		if(c.type != 0 && c.type != 2){
			panel.find("#guilddata-topic").outerHTML = "";
		}
		if(c.type == 5){
			panel.find("#guilddata-slowmode").outerHTML = "";
		}

		let list = panel.find("#guilddata-channelpermissionoverwrites");
		for(let po of Object.values(c.permissionOverwrites)){
			if(po.type == "member"){
				let el = $(`<div>Member: ${this.escapeHtml(UserStore.getUser(po.id).tag)} (${po.id})</div>`)[0];
				el.on("click", ()=>{this.showPermissionOverwrite(c.id, po.id, po.type);});
				list.appendChild(el);
			}else if(po.type == "role"){
				let el = $(`<div>Role: ${this.escapeHtml(g.roles[po.id].name)} (${po.id})</div>`)[0];
				el.on("click", ()=>{this.showPermissionOverwrite(c.id, po.id, po.type);});
				list.appendChild(el);
			}
		}

		wrapper.appendChild(panel);

		if(canSee && (c.type == 0 || c.type == 2 || c.type == 5)){
			let openBtn;
			if(c.type == 0 || c.type == 5){
				openBtn = $(`<button class="guilddata-openchannel">Open Channel</button>`)[0];
				openBtn.on("click", ()=>ChannelSelector.selectChannel(g.id, c.id));
			}else{
				openBtn = $(`<button class="guilddata-openchannel">Connect</button>`)[0];
				openBtn.on("click", ()=>ChannelActions.selectVoiceChannel(g.id, c.id));
			}
			panel.find(".guilddata-closebutton").on("click", ()=>openBtn.outerHTML = "");
			wrapper.appendChild(openBtn);
		}
	}

	showPermissionOverwrite(cId, pId, type){
		let { GuildStore, UserStore, ChannelStore } = ZLibrary.DiscordModules;
		let c = ChannelStore.getChannel(cId);
		let g = GuildStore.getGuild(c.guild_id);
		let p = c.permissionOverwrites[pId];
		let allowed = this.getPermissions(p.allow);
		let denied = this.getPermissions(p.deny);
		let wrapper = document.getElementById("guilddata-channelwrapper");
		let panel = $(`<div class="guilddata-panel" id="guilddata-channelpermissionoverwrite"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title guilddata-copy"><span class="guilddata-channelname">${this.escapeHtml(c.name)}</span> (<span class="guilddata-channelid">${c.id}</span>)</div>
			<div class="guilddata-title guilddata-permissionoverwrite"><span class="guilddata-permissionname">${this.escapeHtml(type == "member" ? UserStore.getUser(pId).tag : g.roles[pId].name)}</span> (<span class="guilddata-permissionid">${pId}</span>)</div>
			<table class="guilddata-table">
				<tr class="guilddata-tr">
					<td class="guilddata-td">Type</td>
					<td class="guilddata-td guilddata-copy">${type}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Allow</td>
					<td class="guilddata-td guilddata-copy">${p.allow}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td"> </td>
					<td class="guilddata-td guilddata-copy"><strong class="guilddata-permissiontitle">General</strong>${allowed.general.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}${c.type == 0 ? `<strong class="guilddata-permissiontitle">Text Permissions</strong>${allowed.text.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}` : c.type == 2 ? `<strong class="guilddata-permissiontitle">Voice Permissions</strong>${allowed.voice.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}` : `<strong class="guilddata-permissiontitle">Text Permissions</strong>${allowed.text.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}<strong class="guilddata-permissiontitle">Voice Permissions</strong>${allowed.voice.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}`}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Deny</td>
					<td class="guilddata-td guilddata-copy">${p.deny}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td"> </td>
					<td class="guilddata-td guilddata-copy"><strong class="guilddata-permissiontitle">General</strong>${denied.general.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}${c.type == 0 ? `<strong class="guilddata-permissiontitle">Text Permissions</strong>${denied.text.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}` : c.type == 2 ? `<strong class="guilddata-permissiontitle">Voice Permissions</strong>${denied.voice.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}` : `<strong class="guilddata-permissiontitle">Text Permissions</strong>${denied.text.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}<strong class="guilddata-permissiontitle">Voice Permissions</strong>${denied.voice.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}`}</td>
				</tr>
			</table>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-channelsinfo").offsetHeight}px`);

		panel.find(".guilddata-permissionoverwrite").on("click", ()=>{if(type == "member") this.showUser(g.id, pId); else this.showRole(g.id, pId);});

		wrapper.appendChild(panel);
	}

	showRoles(gId){
		let { GuildStore, GuildMemberStore } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let roles = Object.values(g.roles);
		let compare = function(c1, c2){
			return c2.position - c1.position;
		}
		roles.sort(compare);
		let list = document.getElementById("guilddata-rolelist");
		list.innerHTML = "";
		for(let r of roles){
			let el = $(`<div class="guilddata-role">${this.escapeHtml(r.name)} (${r.id})</div>`)[0];
			el.on("click", ()=>{this.showRole(g.id, r.id);});
			list.appendChild(el);
		}
		if(document.getElementById("guilddata-exportroles")) document.getElementById("guilddata-exportroles").outerHTML = "";
		let btn = $(`<button id="guilddata-exportroles">Export Roles</button>`)[0];
		btn.on("click", ()=>{
			this.alertText("Export roles", "You are exporting all rolles of this server.<br>In which format do you want to export the roles?<br><br>%name% - name of the role<br>%id% - the role id<br>%userscount% - the count of users with that role<br><input id='guilddata-exportrolesformat' value='%name% (%id%)' style='width:90%;'>", ()=>{
				let members = GuildMemberStore.getMembers(g.id);
				let format = document.getElementById("guilddata-exportrolesformat").value;
				let formatRole = (r)=>{
					return format.replace(/%name%/g, r.name).replace(/%id%/, r.id).replace(/%usercount%/g, members.filter(m=>m.roles.includes(r.id)).length);
				};
				this.downloadFile(roles.map(r=>formatRole(r)).join("\r\n"), `roles of ${g.name}.txt`, `Export roles of  ${g.name}`)
			})
		});
		document.getElementById("guilddata-rolewrapper").appendChild(btn);
	}

	showRole(gId, rId){
		let { GuildStore, GuildMemberStore, Permissions } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let r = g.roles[rId];
		let members = GuildMemberStore.getMembers(g.id);
		let perms = this.getPermissions(r.permissions);
		let notPerms = this.getPermissions(Permissions.ALL - r.permissions);
		let wrapper = document.getElementById("guilddata-rolewrapper");
		let panel = $(`<div class="guilddata-panel" id="guilddata-roleinfo"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title guilddata-copy"><span class="guilddata-rolename">${this.escapeHtml(r.name)}</span> (<span class="guilddata-roleid">${r.id}</span>)</div>
			<table class="guilddata-table">
				<tr class="guilddata-tr">
					<td class="guilddata-td">Permissions</td>
					<td class="guilddata-td guilddata-copy">${r.permissions}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td"> </td>
					<td class="guilddata-td guilddata-copy"><strong class="guilddata-permissiontitle">General</strong>${perms.general.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}<strong class="guilddata-permissiontitle">Text Permissions</strong>${perms.text.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}<strong class="guilddata-permissiontitle">Voice Permissions</strong>${perms.voice.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Not allowed</td>
					<td class="guilddata-td guilddata-copy">${Permissions.ALL - r.permissions}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td"> </td>
					<td class="guilddata-td guilddata-copy"><strong class="guilddata-permissiontitle">General</strong>${notPerms.general.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}<strong class="guilddata-permissiontitle">Text Permissions</strong>${notPerms.text.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}<strong class="guilddata-permissiontitle">Voice Permissions</strong>${notPerms.voice.map(perm => `<div class="guilddata-permission">${perm}</div>`).join("")}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Color</td>
					<td class="guilddata-td guilddata-copy">${r.color ? `${r.colorString} <span style="color:${r.colorString}">(Example)</span>` : `No color set`}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Mentionable</td>
					<td class="guilddata-td guilddata-copy">${r.mentionable}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Managed</td>
					<td class="guilddata-td guilddata-copy">${r.managed}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Hoist role</td>
					<td class="guilddata-td guilddata-copy">${r.hoist}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">User count</td>
					<td class="guilddata-td" id="guilddata-rolemembers">${members.filter(m => m.roles.filter(mr => mr == r.id).length > 0 || r.id == g.id).length} members</td>
				</tr>
			</table>
			<br>
			<!--
			planned feature
			<div class="guilddata-compareroleslist"><div class="guilddata-comparerolesheader">Compare to</div></div>
			-->
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-rolesinfo").offsetHeight}px`);

		// planned feature
		/*for(let r2 of Object.values(g.roles).filter(role => role.id != r.id)){
			let el = $(`<div class="guilddata-comparerolesitem">${this.escapeHtml(r2.name)} (${r2.id})</div>`)[0];
			el.on("click", ()=>{this.compareRoles(g.id, r.id, r2.id);});
			panel.find(".guilddata-compareroleslist").appendChild(el);
		}*/

		panel.find("#guilddata-rolemembers").on("click", ()=>{this.showUsers(g.id, `#roleid:${r.id}`);});

		wrapper.appendChild(panel);
	}

	compareRoles(gId, rId1, rId2){
		let { GuildStore, GuildMemberStore, Permissions } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let r1 = g.roles[rId1];
		let r2 = g.roles[rId2];
		let wrapper = document.getElementById("guilddata-rolewrapper");
		let panel = $(`<div class="guilddata-panel guilddata-rolecomparison"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title">Role Comparison</div>
			<table class="guilddata-table">
				<tr class="guilddata-tr">
					<th class="guilddata-th"> </th>
					<th class="guilddata-th" colspan="2">Equal</th>
				</tr>
				<tr class="guilddata-tr">
					<th class="guilddata-th">Permissions</th>
					<td class="guilddata-td guilddata-copy" colspan="2">Perms here</td>
				</tr>
				<tr class="guilddata-tr">
					<th class="guilddata-th">Not allowed</th>
					<td class="guilddata-td guilddata-copy" colspan="2">Perms here</td>
				</tr>
				<tr class="guilddata-tr">
					<th class="guilddata-th"> </th>
					<th class="guilddata-th">${this.escapeHtml(r1.name)}</th>
					<th class="guilddata-th">${this.escapeHtml(r2.name)}</th>
				</tr>
				<tr class="guilddata-tr">
					<th class="guilddata-th">Permissions</th>
					<td class="guilddata-td">Perms1 here</td>
					<td class="guilddata-td guilddata-copy">Perms2 here</td>
				</tr>
				<tr class="guilddata-tr">
					<th class="guilddata-th">Not allowed</th>
					<td class="guilddata-td">Perms1 here</td>
					<td class="guilddata-td guilddata-copy">Perms2 here</td>
				</tr>
			</table>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-rolesinfo").offsetHeight}px`);

		wrapper.appendChild(panel);
	}

	showEmojis(gId){
		let { EmojiUtils } = ZLibrary.DiscordModules;
		let emojis = EmojiUtils.getGuildEmoji(gId);
		
		let wrapper = document.getElementById("guilddata-guildwrapper");
		let panel = $(`<div class="guilddata-panel guilddata-guildemojis"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title">Emojis</div>
			<div class="guilddata-emojis"></div>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-guildinfo").offsetHeight}px`);

		let list = panel.find(".guilddata-emojis");
		let colCnt = this.settings.emojiColCount;
		for(let e of emojis){
			let el = $(`<div class="guilddata-emojiwrapper"><img src="${e.url}" class="guilddata-emojiimg">${colCnt < 10 ? `<div class="guilddata-emojiname">${this.escapeHtml(e.name)}</div></div>` : ""}`)[0];
			el.on("click", ()=>this.showEmoji(gId, e.id))
			el.css("width", `calc(${100 / colCnt}% - 5px)`);
			list.appendChild(el);
		}
		if(emojis.length == 0){
			let el = $(`<div class="guilddata-noelement">This guild has no emojis.</div>`)[0];
		}

		let btn = $(`<button class="guilddata-exportemojis">Save Emojis</button>`)[0];
		btn.on("click", ()=>this.downloadEmojis(emojis));
		panel.find(".guilddata-closebutton").on("click", ()=>btn.outerHTML = "");

		wrapper.appendChild(panel);
		wrapper.appendChild(btn);
	}

	showEmoji(gId, eId){
		let { GuildStore, EmojiUtils } = ZLibrary.DiscordModules;
		let g = GuildStore.getGuild(gId);
		let e = EmojiUtils.getGuildEmoji(g.id).filter(emoji => emoji.id == eId)[0];
		
		let wrapper = document.getElementById("guilddata-guildwrapper");
		let panel = $(`<div class="guilddata-panel guilddata-emoji"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title guilddata-copy"><span>${this.escapeHtml(e.name)}</span> (<span>${e.id}</span>)</div>
			${e.url ? `<img class="guilddata-image guilddata-copy guilddata-emojiimage" src="${e.url}">` : ""}
			<table class="guilddata-table">
				<tr class="guilddata-tr">
					<td class="guilddata-td">Animated</td>
					<td class="guilddata-td guilddata-copy">${e.animated}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Managed</td>
					<td class="guilddata-td guilddata-copy">${e.managed}</td>
				</tr>
				<tr class="guilddata-tr">
					<td class="guilddata-td">Require Colons</td>
					<td class="guilddata-td guilddata-copy">${e.require_colons}</td>
				</tr>
			</table>
			<div class="guilddata-emojiroles"></div>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-guildinfo").offsetHeight}px`);

		let list = panel.find(".guilddata-emojiroles");
		if(e.roles.length > 0){
			list.appendChild($(`<div class="guilddata-emojirolesheader">Whitelisted Roles</div>`)[0]);
		}
		for(let rId of e.roles){
			let r = g.roles[rId];
			let el = $(`<div class="guilddata-emojirole">${this.escapeHtml(r.name)} (${r.id})</div>`)[0];
			el.on("click", ()=>this.showRole(g.id, r.id))
			list.appendChild(el);
		}

		wrapper.appendChild(panel);
	}

	showRelationships(gId, members, type){
		let { UserStore } = ZLibrary.DiscordModules;

		let wrapper = document.getElementById("guilddata-guildwrapper");
		let panel = $(`<div class="guilddata-panel" id="guilddata-guildrelationships"><div class="guilddata-closebutton"></div>
			<div class="guilddata-title guilddata-copy">${this.local.guildInfo.relationships[type].title}</div>
			<div id="guilddata-relationships"></div>
		</div>`)[0];
		$(panel).css("height", `${document.getElementById("guilddata-guildinfo").offsetHeight}px`);

		let userList = panel.find("#guilddata-relationships");
		for(let m of members){
			let u = UserStore.getUser(m.userId);
			let el = $(`<div class="guilddata-relationshipuser"><img src="${u.avatarURL}" class="guilddata-relationshippfp"> <span class="guilddata-relationshipname">${this.escapeHtml(u.tag)}</span></div>`)[0];
			el.on("click", ()=>this.showUser(gId, m.userId))
			userList.appendChild(el);
		}

		wrapper.appendChild(panel);
	}












	getVerificationLevel(level){
		if(level == 0)
			return "Unrestricted";
		else if(level == 1)
			return "Verified email needed";
		else if(level == 2)
			return "Registered for more than 5 minutes";
		else if(level == 3)
			return "Guild member for at least 10 minutes";
		else if(level == 4)
			return "Verified phone number";
	}
	
	getExplicitContentFilter(level){
		if(level == 0)
			return "Disabled";
		else if(level == 1)
			return "Members without role";
		else if(level == 2)
			return "All messages";
	}
	
	getDefaultMessageNotifications(defMesNot){
		if(defMesNot == 0)
			return "All messages"
		else if(defMesNot == 1)
			return "Mentions only";
	}

	getChannelIcon(type, isNsfw = false, collapsed = false, cId){
		let { GuildPermissions, DiscordPermissions } = ZLibrary.DiscordModules;
		let canSee = GuildPermissions.can(DiscordPermissions.VIEW_CHANNEL, {channelId: cId});
		if(type==0){
			// text channel
			if(isNsfw) return `<svg style="display:inline;color:inherit;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="colorDefaultText-oas-QM icon-sxakjD da-colorDefaultText da-icon"><path class="foreground-2W-aJk da-foreground" fill="currentColor" d="M2.27333333,12 L2.74666667,9.33333333 L0.08,9.33333333 L0.313333333,8 L2.98,8 L3.68666667,4 L1.02,4 L1.25333333,2.66666667 L3.92,2.66666667 L4.39333333,0 L5.72666667,0 L5.25333333,2.66666667 L9.25333333,2.66666667 L9.72666667,0 L11.06,0 L10.5866667,2.66666667 L13.2533333,2.66666667 L13.02,4 L10.3533333,4 L9.64666667,8 L12.3133333,8 L12.08,9.33333333 L9.41333333,9.33333333 L8.94,12 L7.60666667,12 L8.08,9.33333333 L4.08,9.33333333 L3.60666667,12 L2.27333333,12 L2.27333333,12 Z M5.02,4 L4.31333333,8 L8.31333333,8 L9.02,4 L5.02,4 L5.02,4 Z" transform="translate(1.333 2)"></path><path class="foreground-2W-aJk da-foreground" fill="currentColor" fill-rule="nonzero" d="M9.75,8 L15.25,8 L15.25,8 C15.6642136,8 16,7.66421356 16,7.25 L16,6.71660919 L16,6.71660919 C16,6.57385832 15.9694372,6.43276186 15.9103665,6.30280625 L13.7664532,1.58619706 L13.7664532,1.58619706 C13.6041831,1.22920277 13.2482302,1 12.8560867,1 L12.1439133,1 L12.1439133,1 C11.7517698,1 11.3958169,1.22920277 11.2335468,1.58619706 L9.08963352,6.30280625 L9.08963352,6.30280625 C9.03056279,6.43276186 9,6.57385832 9,6.71660919 L9,7.25 L9,7.25 C9,7.66421356 9.33578644,8 9.75,8 Z M13,7 L12,7 L12,6 L13,6 L13,7 Z M13,4.96118197 L12,4.96118197 L12,3 L13,3 L13,4.96118197 Z"></path></svg>`;
			return `<svg style="display:inline;color:inherit;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="colorDefaultText-oas-QM icon-sxakjD da-colorDefaultText da-icon"><path class="foreground-2W-aJk da-foreground" fill="currentColor" d="M2.27333333,12 L2.74666667,9.33333333 L0.08,9.33333333 L0.313333333,8 L2.98,8 L3.68666667,4 L1.02,4 L1.25333333,2.66666667 L3.92,2.66666667 L4.39333333,0 L5.72666667,0 L5.25333333,2.66666667 L9.25333333,2.66666667 L9.72666667,0 L11.06,0 L10.5866667,2.66666667 L13.2533333,2.66666667 L13.02,4 L10.3533333,4 L9.64666667,8 L12.3133333,8 L12.08,9.33333333 L9.41333333,9.33333333 L8.94,12 L7.60666667,12 L8.08,9.33333333 L4.08,9.33333333 L3.60666667,12 L2.27333333,12 L2.27333333,12 Z M5.02,4 L4.31333333,8 L8.31333333,8 L9.02,4 L5.02,4 L5.02,4 Z" transform="translate(1.333 2)"></path></svg>`;
		}else if(type==2){
			// voice channel
			return `<svg name="Speaker" style="display:inline;color:inherit;" class="colorDefaultVoice-3wYlhb icon-sxakjD da-colorDefaultVoice da-icon" background="background-2OVjk_ da-background" width="16" height="16" viewBox="0 0 16 16"><path class="foreground-2W-aJk da-foreground" fill="currentColor" d="M9.33333333,2 L9.33333333,3.37333333 C11.26,3.94666667 12.6666667,5.73333333 12.6666667,7.84666667 C12.6666667,9.96 11.26,11.74 9.33333333,12.3133333 L9.33333333,13.6933333 C12,13.0866667 14,10.7 14,7.84666667 C14,4.99333333 12,2.60666667 9.33333333,2 L9.33333333,2 Z M11,7.84666667 C11,6.66666667 10.3333333,5.65333333 9.33333333,5.16 L9.33333333,10.5133333 C10.3333333,10.04 11,9.02 11,7.84666667 L11,7.84666667 Z M2,5.84666667 L2,9.84666667 L4.66666667,9.84666667 L8,13.18 L8,2.51333333 L4.66666667,5.84666667 L2,5.84666667 L2,5.84666667 Z"></path></svg>`;
		}else if(type==4){
			// category
			if(collapsed) return `<svg style="display:inline;position:inherit;color:inherit;" class="iconCollapsed-3hFp_8 da-iconCollapsed iconTransition-2pOJ7l da-iconTransition directionRight-O8AY4M" width="20" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 10L12 15 17 10"></path></svg>`;
			return `<svg style="display:inline;position:inherit;color:inherit;" class="iconDefault-3Gr8d2 da-iconDefault iconTransition-2pOJ7l da-iconTransition directionDown-26e7eE" width="20" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 10L12 15 17 10"></path></svg>`;
		}else if(type==5){
			// news channel
			return `<svg style="display:inline;color:inherit;width:16px;height:16px;margin:0;" name="Newspaper" class="icon-1_QxNX da-icon" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M22 7H19V3C19 2.448 18.553 2 18 2H2C1.447 2 1 2.448 1 3V21C1 21.552 1.447 22 2 22H20C20.266 22 20.52 21.895 20.707 21.707L22.707 19.707C22.895 19.519 23 19.265 23 18.999V7.999C23 7.448 22.553 7 22 7ZM9 18.999H3V16.999H9V18.999ZM9 15.999H3V13.999H9V15.999ZM9 13H3V11H9V13ZM16 18.999H10V16.999H16V18.999ZM16 15.999H10V13.999H16V15.999ZM16 13H10V11H16V13ZM16 8H3V5H16V8ZM21 18.585L20.586 18.999H19V8.999H21V18.585Z"></path></svg>`;
		}else if(type==6){
			return ``;
		}
	}

	getChannelType(type){
		if(type==0) return "Text channel";
		else if(type==2) return "Voice channel";
		else if(type==4) return "Category";
		else if(type==5) return "News Channel";
		else if(type==6) return "Guild Store";
	}
	
	getStatusColor(s){
		if(s == "online") return "#43b581";
		else if(s == "dnd") return "#f04747";
		else if(s == "idle") return "#faa61a";
		return "#747f8d";
	}

	getPermissions(permNumber){
		let perms = ZLibrary.DiscordModules.Permissions.generatePermissionSpec();
		let p = {
			"general": [],
			"text": [],
			"voice": []
		};
		let generalPerms = perms[0].permissions.map(pe => pe.flag);
		let textPerms = perms[1].permissions.map(pe => pe.flag);
		let voicePerms = perms[2].permissions.map(pe => pe.flag);
		let allPerms = generalPerms.concat(textPerms).concat(voicePerms).sort((a, b) => a - b);
		for(let i = allPerms.length - 1; i >= 0; i--){
			let pe = allPerms[i];
			if(permNumber >= pe){
				permNumber -= pe;
				if(generalPerms.includes(pe)) p["general"].push(perms[0].permissions.filter(per => per.flag == pe)[0].title);
				if(textPerms.includes(pe)) p["text"].push(perms[1].permissions.filter(per => per.flag == pe)[0].title);
				if(voicePerms.includes(pe)) p["voice"].push(perms[2].permissions.filter(per => per.flag == pe)[0].title);
			}
		}
		return p;
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	saveSettings() {
		ZLibrary.PluginUtilities.saveSettings(this.getName(), this.settings);
	}
	loadSettings() {
		this.settings = ZLibrary.PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
	}

	updateLanguage(){
		// no languages (except english) supported yet
		this.language = "en";
	}
	
	makeDraggable(){
		let posX = 0, posY = 0;
		$("#guilddata-popup").on("mousedown", (e)=>{
			if(e.target.id != "guilddata-popup" && e.target.id != "guilddata-inner") return;
			e.preventDefault();
			posX = e.clientX;
			posY = e.clientY;
			document.body.on("mousemove.guilddatadrag", (e2)=>{
				e2.preventDefault();
				$("#guilddata-popup").css("top", ($("#guilddata-popup").offset().top - posY + e2.clientY) + "px");
				$("#guilddata-popup").css("left", ($("#guilddata-popup").offset().left - posX + e2.clientX) + "px");
				posX = e2.clientX;
				posY = e2.clientY;
			});
			document.body.on("mouseup.guilddatadrag", (e2)=>{
				document.body.off("mousemove.guilddatadrag");
				document.body.off("mouseup.guilddatadrag");
			});
		});
	}
	
	escapeHtml(txt){
		return txt.replace(/&/g, "&amp;")
				  .replace(/</g, "&lt;")
				  .replace(/>/g, "&gt;")
				  .replace(/"/g, "&quot;")
				  .replace(/'/g, "&#039;");
	}
	
	formatDate(date, format){
		if(typeof date === "string") date = new Date(date);
		if(!date) return "unknown";
		return format
			.replace(/(?<!\\)SSS/g, date.getMilliseconds().pad(3))
			.replace(/(?<!\\)ss/g, date.getSeconds().pad())
			.replace(/(?<!\\)s/g, date.getSeconds())
			.replace(/(?<!\\)mm/g, date.getMinutes().pad())
			.replace(/(?<!\\)m/g, date.getMinutes())
			.replace(/(?<!\\)HH/g, date.getHours().pad())
			.replace(/(?<!\\)H/g, date.getHours())
			.replace(/(?<!\\)hh/g, (date.getHours() % 12 || 12).pad())
			.replace(/(?<!\\)h/g, date.getHours() % 12 || 12)
			.replace(/(?<!\\)dddd/g, date.toLocaleDateString(-1, {weekday:"long"}))
			.replace(/(?<!\\)ddd/g, date.toLocaleDateString(-1, {weekday:"short"}))
			.replace(/(?<!\\)dd/g, date.getDate().pad())
			.replace(/(?<!\\)d/g, date.getDate())
			.replace(/(?<!\\)MMMM/g, date.toLocaleDateString(-1, {month:"long"}))
			.replace(/(?<!\\)MMM/g, date.toLocaleDateString(-1, {month:"short"}))
			.replace(/(?<!\\)MM/g, (date.getMonth() + 1).pad())
			.replace(/(?<!\\)M/g, date.getMonth() + 1)
			.replace(/(?<!\\)yyyy/g, date.getFullYear())
			.replace(/(?<!\\)yy/g, ('' + date.getFullYear()).substr(2))
			.replace(/(?<!\\)tt/g, (date.getHours() > 11) ? "PM" : "AM")
			.replace(/(?<!\\)zzz/g, (date.getTimezoneOffset() < 0 ? '-' : '+') + Math.floor(Math.abs(date.getTimezoneOffset() / 60)).pad() + ':' + Math.floor(Math.abs(date.getTimezoneOffset() % 60)).pad())
			.replace(/(?<!\\)zz/g, (date.getTimezoneOffset() < 0 ? '-' : '+') + Math.floor(Math.abs(date.getTimezoneOffset() / 60)).pad())
			.replace(/(?<!\\)z/g, (date.getTimezoneOffset() < 0 ? '-' : '+') + Math.floor(Math.abs(date.getTimezoneOffset() / 60)))
			.replace(/\\(?=[SsmHhdMytz])/g, "");
	}

	formatString(input, ...args){
		for(let i = 0; i < args.length; i++){
			input = input.replace(`{${i}}`, args[i]);
		}
		return input;
	}

	alertText(title, content, callbackOk, callbackCancel) {
		let a = $(`<div class="bd-modal-wrapper theme-dark" style="z-index:9999;">
						<div class="bd-backdrop backdrop-1wrmKB"></div>
						<div class="bd-modal modal-1UGdnR">
							<div class="bd-modal-inner inner-1JeGVc" style="width:auto;max-width:70%;max-height:100%;">
								<div class="header header-1R_AjF">
									<div class="title">${title}</div>
								</div>
								<div class="bd-modal-body">
									<div class="scroller-wrap fade">
										<div class="scroller">
											${content}
										</div>
									</div>
								</div>
								<div class="footer footer-2yfCgX">
									<button type="button">Okay</button>
								</div>
							</div>
						</div>
					</div>`);
		a.find(".footer button").on("click", () => {
			if(typeof callbackOk === "function") callbackOk();
			a.addClass("closing"), setTimeout(() => {
				a.remove()
			}, 300)
		}), a.find(".bd-backdrop").on("click", () => {
			if(typeof callbackCancel === "function") callbackCancel();
			a.addClass("closing"), setTimeout(() => {
				a.remove()
			}, 300)
		}), a.appendTo("#app-mount");
		if(a.find("input")){
			a.find("input").on("keydown", e => {
				if(e.which == 13) a.find(".footer button").click();
				else if(e.which == 27) a.find(".bd-backdrop").click();
			});
			a.find("input").focus();
		}
		return a.find(".bd-modal-inner")[0];
	}

	downloadFile(content, filename, title){
		let dialog = require("electron").remote.dialog;
		dialog.showSaveDialog({defaultPath: filename, title: title}, function(sel){
			if(!sel) return;
			let fs = require("fs");
			fs.writeFile(sel, content, (err) => {
				if(err){
					BdApi.alert("Could not save the users in the file " + err.message)
				}
			});
		});
	}
	downloadEmojis(emojis){
		let dialog = require("electron").remote.dialog;
		dialog.showOpenDialog({properties:["openDirectory"]}, (sel) => {
			let request = require("request");
			let fs = require("fs");
			for(let e of emojis){
				if(!e.url) continue;
				request(e.url).pipe(fs.createWriteStream(`${sel}\\${e.id} - ${e.name}.${e.url.split(".").reverse()[0].split("?")[0]}`));
			}
		});
	}

	downloadFile(content, filename, title){
		var dialog = require("electron").remote.dialog;
		dialog.showSaveDialog({defaultPath: filename, title: title}, function(sel){
			if(!sel) return;
			var fs = require("fs");
			fs.writeFile(sel, content, (err) => {
				if(err){
					BdApi.alert("Could not save the users in the file " + err.message)
				}
			});
		});
	}

	/**
	 * @author Metalloriff (at least i copied it from him, idk if he really wrote this code)
	 */
	getSnowflakeCreationDate(id) {
		const epoch = 1420070400000;
		const toBinary = sf => {
			let binary = "",
				high = parseInt(sf.slice(0, -10)) || 0,
				low = parseInt(sf.slice(-10));
			while (low > 0 || high > 0) {
				binary = String(low & 1) + binary;
				low = Math.floor(low / 2);
				if (high > 0) {
					low += 5000000000 * (high % 2);
					high = Math.floor(high / 2);
				}
			}
			return binary;
		};
		return new Date(parseInt(toBinary(id).padStart(64).substring(0, 42), 2) + epoch);
	}









	get changelog(){
		return {
			"2.0.1": [
				{
					"title": "Added",
					"type": "added",
					"items": [
						"Added support for news channels (text channels with a different icon)",
						"Added a &quot;not&quot; operator &quot;!&quot; for user search"
					]
				}
			],
			"2.0.2": [
				{
					"title": "Added",
					"type": "added",
					"items": [
						"Added a button to force load all users",
						"Now showing information about guilds the owner is not cached from"
					]
				}
			],
			"2.0.3": [
				{
					"title": "Added",
					"type": "added",
					"items": [
						"Added support for nitro boosting"
					]
				}
			]
		};
	}
	get colors(){
		return {
			"added": "lightgreen",
			"fixed": "orange",
			"changed": "green",
			"request": "#ff1818",
			"planned": "#7289da"
		};
	}
	showWelcomeMessage(){
		let popup = this.alertText('Welcome', `<p>GuildData is a plugin that displays the Guild Information such as the owner, when the server was created, when you joined, their verification level, etc. As well as user, channel, and role information which is very detailed.</p>
		<p>To use this plugin, rigth click a guild in the guild list and click on the item "Show Guild Data" in the context menu. You can also click on the name of a guild above the channel list and click the button with the text "Show Guild Data" there.</p>
		<button class="guilddata-welcome guilddata-openchangelog" style="position:absolute;bottom:5px;right:5px;background-color:#677bc4;color:#fff">Show Changelog</button>`);
		$(popup.find("button.guilddata-welcome.guilddata-openchangelog")).on("click", ()=>this.showChangelog());
	}
	// probably have to rewrite it since it is just copied from the old version of this plugin, but i'm too lazy rn
	showChangelog(oldVersion, newVersion){
		var c = ``;
		var t = "Changelog";
		if(oldVersion && newVersion){
			c = `<p style="font-size:150%;font-weight:700;text-align:center;">You updated from version ${oldVersion} to version ${newVersion}<br>`;
			t = "Version updated - Changelog";
		}
		for(const v in this.changelog){
			c += `<div`
			if(v == this.getVersion()) c += ` style="background-color:#2d2d31;border:2px #a7a7a7;border-style:solid;border-radius:7px;padding:5px;"`;
			c += `><div style="font-size:140%;padding-bottom:10px;font-weight:900;">v${v}</div><div style="padding-left:10px;">`;
			for(const v2 of this.changelog[v]){
				c += `<div style="padding-bottom:7px;"><div style="color:${v2.color ? v2.color : this.colors[v2.type]};padding-bottom:3px;font-weight:600;">${v2.title}</div><ul style="list-style:none;">`;
				for(const v3 of v2.items){
					c += `<li><div style="padding-left:10px;padding-top:3px;">- ${v3}</div></li>`;
				}
				c += `</ul></div>`;
			}
			c += `</div></div>`;
		}
		
		this.alertText(t, c);
	}

}

Number.prototype.pad = function(size) {
	return String(this).padStart(size || 2, "0");
}
