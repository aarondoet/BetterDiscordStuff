/**
 * @name TypingIndicator
 * @displayName TypingIndicator
 * @website https://twitter.com/l0c4lh057/
 * @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/TypingIndicator/TypingIndicator.plugin.js
 * @patreon https://www.patreon.com/l0c4lh057
 * @invite YzzeuJPpyj
 * @authorId 226677096091484160
 */

module.exports = (() => {
	const config = {
		info:{
			name: "TypingIndicator",
			authors: [{name: "l0c4lh057", github_username: "l0c4lh057", twitter_username: "l0c4lh057", discord_id: "226677096091484160"}],
			description: "Shows an indicator in the guild/channel list when someone is typing there",
			version: "0.5.4",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/TypingIndicator/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/TypingIndicator/TypingIndicator.plugin.js"
		},
		defaultConfig: [
			{
				type: "switch",
				id: "channels",
				name: "Show on channels",
				note: "With this option enabled all channels have the typing indicator when someone is typing in them (default: true)",
				value: true
			},
			{
				type: "switch",
				id: "includeMuted",
				name: "Include muted channels/guilds",
				note: "With this option enabled even muted channels have the typing indicator (default: false)",
				value: false
			},
			{
				type: "switch",
				id: "includeBlocked",
				name: "Include blocked users",
				note: "With this option enabled the indicator will also show for users you have blocked (default: false)",
				value: false
			},
			{
				type: "switch",
				id: "guilds",
				name: "Show on guilds",
				note: "With this option enabled the indicator is shown on guild icons when someone is typing in any of the channels of it (default: false)",
				value: false
			},
			{
				type: "switch",
				id: "folders",
				name: "Show on folders",
				note: "With this option enabled the indicator is shown on discord native guild folders when someone is typing in any of the guilds (default: false)",
				value: false
			},
			{
				type: "switch",
				id: "dms",
				name: "Show on home icon",
				note: "With this option enabled the indicator is shown on the home icon above the guild list (default: false)",
				value: false
			}
		],
		changelog:[
			{
				"title": "Fixed",
				"type": "fixed",
				"items": ["Indicator visible again when using light theme (those were the worst two minutes of this year, even with my health issues rn)"]
			}
		]
	};
	
	return !global.ZeresPluginLibrary ? class {
		constructor(){this._config = config;}
		getName(){return config.info.name;}
		getAuthor(){return config.info.authors.map(a => a.name).join(", ");}
		getDescription(){return config.info.description + " **Install [ZeresPluginLibrary](https://betterdiscord.app/Download?id=9) and restart discord to use this plugin!**";}
		getVersion(){return config.info.version;}
		load(){
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
		});
		}
		start(){}
		stop(){}
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { WebpackModules, DiscordModules, Patcher, ReactComponents, PluginUtilities, Utilities, ReactTools, Logger } = Api;
			const { React, ChannelStore, UserStore, UserTypingStore, RelationshipStore, SelectedGuildStore, DiscordConstants, WindowInfo } = DiscordModules;
			const Flux = WebpackModules.getByProps("connectStores");
			const FluxUtils = WebpackModules.getByProps("useStateFromStores");
			const MutedStore = WebpackModules.getByProps("isMuted", "isChannelMuted");
			const Spinner = WebpackModules.getByDisplayName("Spinner");
			const Tooltip = WebpackModules.getByDisplayName("Tooltip");
			
			if(!BdApi.Plugins.get("BugReportHelper") && !BdApi.getData(config.info.name, "didShowIssueHelperPopup")){
				BdApi.saveData(config.info.name, "didShowIssueHelperPopup", true);
				BdApi.showConfirmationModal("Do you want to download a helper plugin?", `Do you want to download a helper plugin that makes it easier for you to report issues? That plugin is not needed to anything else to function correctly but nice to have when reporting iissues, shortening the time until the problem gets resolved by asking you for specific information and also including additional information you did not provide.`, {
					confirmText: "Download",
					cancelText: "Cancel",
					onConfirm: () => {
						require("request").get("https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/BugReportHelper/BugReportHelper.plugin.js", (error, response, body) => {
							if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/BugReportHelper/BugReportHelper.plugin.js");
							else require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "BugReportHelper.plugin.js"), body, ()=>{
								window.setTimeout(()=>BdApi.Plugins.enable("BugReportHelper"), 1000);
							});
						});
					}
				});
			}
			
			const renderElement = ({userIds, opacity, type, isFocused, id})=>{
				userIds = [...new Set(userIds)];
				if(userIds.length === 0) return null;
				const usernames = userIds.map(userId => UserStore.getUser(userId)).filter(user => user).map(user => user.tag);
				const remainingUserCount = userIds.length - usernames.length;
				const text = (()=>{
					if(usernames.length === 0){
						return `${remainingUserCount} user${remainingUserCount > 1 ? "s" : ""}`;
					}else if(userIds.length > 2){
						const otherCount = usernames.length - 1 + remainingUserCount;
						return `${usernames[0]} and ${otherCount} other${otherCount > 1 ? "s" : ""}`;
					}else if(remainingUserCount === 0){
						return usernames.join(", ");
					}else{
						return `${usernames.join(", ")} and ${remainingUserCount} other${remainingUserCount > 1 ? "s" : ""}`;
					}
				})();
				return React.createElement(
					Tooltip,
					{
						text,
						position: type === "channel" ? "top" : "right"
					},
					tooltipProps => React.createElement(Spinner, {
						...tooltipProps,
						type: "pulsingEllipsis",
						className: `ti-indicator typingindicator-${type}`,
						[`data-${type}-id`]: id,
						animated: isFocused,
						style: {
							marginLeft: 5,
							opacity: opacity
						}
					})
				);
			}
			
			return class TypingIndicator extends Plugin {
				onStart(){
					PluginUtilities.addStyle("typingindicator-css", `
						.typingindicator-guild, .typingindicator-dms, .typingindicator-folder {
							position: absolute;
							bottom: 0;
							padding: 3px;
							border-radius: 6px;
							background-color: var(--background-tertiary);
							right: 14px;
						}
						.ti-indicator span.pulsingEllipsisItem-3pNmEc {
							background-color: var(--channels-default);
						}
						.ti-indicator .pulsingEllipsis-3YiXRF {
							width: 22px;
						}
						.ti-indicator .pulsingEllipsisItem-3pNmEc:nth-of-type(3) {
							margin-right: 0;
						}
					`);
					this.promises = {state:{cancelled: false}, cancel(){this.state.cancelled = true;}};
					this.patchChannelList();
					this.patchGuildList(this.promises.state);
					this.patchHomeIcon(this.promises.state);
					this.patchFolders(this.promises.state);
				}
				onStop(){
					PluginUtilities.removeStyle("typingindicator-css");
					this.promises.cancel();
					Patcher.unpatchAll();
				}
				
				getGuildChannels(...guildIds){
					const channels = ChannelStore.getGuildChannels ? Object.values(ChannelStore.getGuildChannels()) : ChannelStore.getMutableGuildChannels ? Object.values(ChannelStore.getMutableGuildChannels()) : [];
					return channels.filter(c => guildIds.includes(c.guild_id) && c.type !== DiscordConstants.ChannelTypes.GUILD_VOICE && c.type !== DiscordConstants.ChannelTypes.GUILD_CATEGORY);
				}
				
				getPrivateChannels(){
					return ChannelStore.getPrivateChannels ? Object.values(ChannelStore.getPrivateChannels()) : ChannelStore.getMutablePrivateChannels ? Object.values(ChannelStore.getMutablePrivateChannels()) : [];
				}
				
				patchChannelList(){
					const ChannelItem = WebpackModules.getModule(m => Object(m.default).displayName==="ChannelItem");
					Patcher.after(ChannelItem, "default", (_, [props], returnValue) => {
						if(props.channel.type!==DiscordConstants.ChannelTypes.GUILD_TEXT) return;
						if(props.selected) return;
						if(props.muted && !this.settings.includeMuted) return;
						const selfId = UserStore.getCurrentUser()?.id;
						if(!selfId) return setTimeout(()=>this.patchChannelList(), 100);
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: Object.keys(UserTypingStore.getTypingUsers(props.channel.id))
							.filter(uId => (uId !== selfId) && (this.settings.includeBlocked || !RelationshipStore.isBlocked(uId)))
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 0.7, type: "channel", isFocused: WindowInfo.isFocused(), id: props.channel.id});
						});
						const itemList = Utilities.getNestedProp(returnValue, "props.children.props.children.1.props");
						if(itemList) itemList.children = [...(Array.isArray(itemList.children) ? itemList.children : [itemList.children]), React.createElement(wrappedCount)];
					});
				}
				
				onAdded(selector, callback) {
					if (document.body.querySelector(selector)) return callback(document.body.querySelector(selector));
					const observer = new MutationObserver((mutations) => {
					for (let m = 0; m < mutations.length; m++) {
						for (let i = 0; i < mutations[m].addedNodes.length; i++) {
							const mutation = mutations[m].addedNodes[i];
							if (mutation.nodeType === 3) continue; // ignore text
							const directMatch = mutation.matches(selector) && mutation;
							const childrenMatch = mutation.querySelector(selector);
							if (directMatch || childrenMatch) {
								observer.disconnect();
								return callback(directMatch ?? childrenMatch);
								}
							}
						}
					});
					observer.observe(document.body, {subtree: true, childList: true});
					return () => {observer.disconnect();};
				}
				
				async forceUpdateGuilds(promiseState) {
					document.getElementsByClassName("scroller-1Bvpku none-2Eo-qx scrollerBase-289Jih")[0]?.dispatchEvent(new CustomEvent("scroll"));
				}
				
				// this still doesnt work but it was an attempt to fix it and im too lazy to undo it for release
				patchGuildList(promiseState){
					const GuildComponents = WebpackModules.getModule(m => m?.default?.displayName === "GuildNode");
					if (!GuildComponents || typeof GuildComponents.default !== "function") return console.error("[TypingIndicator] Could not find Guild components");
					const selfId = UserStore.getCurrentUser()?.id;
					if(!selfId) return setTimeout(()=>this.patchGuildList(promiseState), 100);
					const Indicator = guildId => {
						const props = FluxUtils.useStateFromStoresObject([UserStore, RelationshipStore, WindowInfo, UserTypingStore, MutedStore, UserStore], () => {
							const selfId = UserStore.getCurrentUser().id;
							return {
								userIds: this.getGuildChannels(guildId)
										.filter(channel => this.settings.includeMuted || !MutedStore.isChannelMuted(channel.guild_id, channel.id))
										.flatMap(channel => Object.keys(UserTypingStore.getTypingUsers(channel.id)))
										.filter(userId => (userId !== selfId) && (this.settings.includeBlocked || !RelationshipStore.isBlocked(userId))),
								isFocused: WindowInfo.isFocused()
							};
						});
						return React.createElement(renderElement, {...props, opacity: 1, id: guildId, type: "guild"});
					};
					const PatchedGuild = ({__TI_original, ...props}) => {
						const returnValue = __TI_original(props);
						try{
							if(props.selected) return returnValue;
							if(!this.settings.guilds) return returnValue;
							if(!props.guild) return returnValue;
							if(MutedStore.isMuted(props.guild.id) && !this.settings.includeMuted) return returnValue;
							returnValue.props.children.props.children.push(Indicator({guildId: props.guild.id}));
						}catch(err){
							Logger.error("Error in Guild patch", err);
						}
						return returnValue;
					}
					Patcher.after(GuildComponents, "default", (_, [args], returnValue)=>{
						const original = returnValue.type;
						returnValue.type = PatchedGuild;
						returnValue.props.__TI_original = original;
					});
					this.forceUpdateGuilds(promiseState);
				}
				
				async patchHomeIcon(promiseState){
					const Home = await ReactComponents.getComponentByName("TutorialIndicator", "." + WebpackModules.getByProps("badgeIcon", "circleIcon", "listItem", "pill").listItem.replace(/ /g, "."));
					if(promiseState.cancelled) return;
					const selfId = UserStore.getCurrentUser()?.id;
					if(!selfId) return setTimeout(()=>this.patchHomeIcon(promiseState), 100);
					Patcher.after(Home.component.prototype, "render", (thisObject, _, returnValue) => {
						if(!returnValue.props.children) return;
						let children = returnValue.props.children[0] || returnValue.props.children;
						if(!children.props) return;
						if(!children.props.children || !children.props.className) return;
						if(!children.props.children.props || !children.props.children.props.children) return;
						children = children.props.children.props.children[1];
						if(!children) return;
						if(!this.settings.dms) return;
						if(!SelectedGuildStore.getGuildId()) return;
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: this.getPrivateChannels()
							.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(null, c.id))
							.flatMap(c => Object.keys(UserTypingStore.getTypingUsers(c.id))
									.filter(uId => (uId !== selfId) && (this.settings.includeBlocked || !RelationshipStore.isBlocked(uId)))
							)
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 1, type: "dms", isFocused: WindowInfo.isFocused()});
						});
						children.props.children = React.Children.toArray(children.props.children);
						if(children.props.children.push) children.props.children.push(React.createElement(wrappedCount));
					});
					Home.forceUpdateAll();
				}
				
				async patchFolders(promiseState){
					const Folder = WebpackModules.find(m=>m?.type?.render && (m?.type?.render||m?.type?.__powercordOriginal_render)?.toString()?.indexOf("SERVER_FOLDER")!==-1);
					if(promiseState.cancelled || !Folder) return;
					const selfId = UserStore.getCurrentUser()?.id;
					if(!selfId) return setTimeout(()=>this.patchFolders(promiseState), 100);
					Patcher.after(Folder.type, "render", (_, [props], returnValue) => {
						if(props.expanded) return;
						if(!this.settings.folders) return;
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: this.getGuildChannels(...props.guildIds)
								.filter(c => (this.settings.includeMuted || !MutedStore.isMuted(c.guild_id))
								             && (this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
								             && (SelectedGuildStore.getGuildId() !== c.guild_id))
								.flatMap(c => Object.keys(UserTypingStore.getTypingUsers(c.id))
										.filter(uId => (uId !== selfId) && (this.settings.includeBlocked || !RelationshipStore.isBlocked(uId)))
								)
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 1, type: "folder", isFocused: WindowInfo.isFocused(), id: props.folderId});
						});
						returnValue.props.children.push(React.createElement(wrappedCount));
					});
				}
				
				getSettingsPanel(){
					return this.buildSettingsPanel().getElement();
				}
			};
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
