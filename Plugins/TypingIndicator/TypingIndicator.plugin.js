/**
 * @name TypingIndicator
 * @displayName TypingIndicator
 * @website https://twitter.com/l0c4lh057/
 * @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/TypingIndicator/TypingIndicator.plugin.js
 * @patreon https://www.patreon.com/l0c4lh057
 * @invite YzzeuJPpyj
 * @authorId 226677096091484160
 */

var TypingIndicator = (() => {
	const config = {
		info:{
			name: "TypingIndicator",
			authors: [{name: "l0c4lh057", github_username: "l0c4lh057", twitter_username: "l0c4lh057", discord_id: "226677096091484160"}],
			description: "Shows an indicator in the guild/channel list when someone is typing there",
			version: "0.5.0",
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
				note: "With this option enabled the indicator will also show for users you have blocked",
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
				"title": "New",
				"type": "added",
				"items": ["When hovering over the indicator you now see who is typing in there. If the user(s) is/are not cached the amount of users typing is shown."]
			}
		]
	};
	
	return !global.ZeresPluginLibrary ? class {
		constructor(){this._config = config;}
		getName(){return config.info.name;}
		getAuthor(){return config.info.authors.map(a => a.name).join(", ");}
		getDescription(){return config.info.description;}
		getVersion(){return config.info.version;}
		load(){
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
		});
		}
		start(){}
		stop(){}
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { WebpackModules, DiscordModules, Patcher, ReactComponents, PluginUtilities, Utilities } = Api;
			const { React, ChannelStore, UserStore, UserTypingStore, RelationshipStore, SelectedGuildStore, DiscordConstants, WindowInfo } = DiscordModules;
			const Flux = WebpackModules.getByProps("connectStores");
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
			
			const renderElement = ({userIds, opacity, type, isFocused})=>{
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
							border-radius: 1vh;
							background-color: #888;
							box-shadow: 0px 0px 8px 4px #888;
							right: 14px;
						}
						.typingindicator-guild [class*=pulsingEllipsisItem], .typingindicator-dms [class*=pulsingEllipsisItem], .typingindicator-folder [class*=pulsingEllipsisItem] {
							background-color: white;
						}
						.typingindicator-channel span[class*="pulsingEllipsisItem"] {
							background-color: var(--channels-default);
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
				
				patchChannelList(){
					const ChannelItem = WebpackModules.getModule(m => Object(m.default).displayName==="ChannelItem");
					Patcher.after(ChannelItem, "default", (_, [props], returnValue) => {
						if(props.channel.type!==DiscordConstants.ChannelTypes.GUILD_TEXT) return;
						if(props.selected) return;
						if(props.muted && !this.settings.includeMuted) return;
						const selfId = UserStore.getCurrentUser().id;
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: Object.keys(UserTypingStore.getTypingUsers(props.channel.id))
							.filter(uId => uId !== selfId)
							.filter(uId => this.settings.includeBlocked || !RelationshipStore.isBlocked(uId))
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 0.7, type: "channel", isFocused: WindowInfo.isFocused()});
						});
						const itemList = Utilities.getNestedProp(returnValue, "props.children.props.children.1.props");
						if(itemList) itemList.children = [...(Array.isArray(itemList.children) ? itemList.children : [itemList.children]), React.createElement(wrappedCount)];
					});
				}
				
				async patchGuildList(promiseState){
					const Guild = await ReactComponents.getComponentByName("Guild", "." + WebpackModules.getByProps("badgeIcon", "circleIcon", "listItem", "pill").listItem.replace(" ", "."));
					if(promiseState.cancelled) return;
					const selfId = UserStore.getCurrentUser().id;
					Patcher.after(Guild.component.prototype, "render", (thisObject, _, returnValue) => {
						let guildData = thisObject.props;
						if(guildData.selected) return;
						if(!this.settings.guilds) return;
						if(!guildData.guild) return;
						if(MutedStore.isMuted(guildData.guildId) && !this.settings.includeMuted) return;
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: Object.values(ChannelStore.getGuildChannels())
								.filter(c => c.guild_id == guildData.guildId && c.type != 2)
								.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
								.map(c => Object.keys(UserTypingStore.getTypingUsers(c.id))
										.filter(uId => uId !== selfId)
										.filter(uId => this.settings.includeBlocked || !RelationshipStore.isBlocked(uId))
								)
								.reduce((a,b) => [...a, ...b], [])
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 1, type: "guild", isFocused: WindowInfo.isFocused()});
						});
						returnValue.props.children.props.children.push(React.createElement(wrappedCount));
					});
					Guild.forceUpdateAll();
				}
				
				async patchHomeIcon(promiseState){
					const Home = await ReactComponents.getComponentByName("TutorialIndicator", "." + WebpackModules.getByProps("badgeIcon", "circleIcon", "listItem", "pill").listItem.replace(/ /g, "."));
					if(promiseState.cancelled) return;
					const selfId = UserStore.getCurrentUser().id;
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
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: Object.values(ChannelStore.getPrivateChannels())
							.filter(c => !c.guild_id)
							.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(null, c.id))
							.map(c => Object.keys(UserTypingStore.getTypingUsers(c.id))
									.filter(uId => uId !== selfId)
									.filter(uId => this.settings.includeBlocked || !RelationshipStore.isBlocked(uId))
							)
							.reduce((a,b) => [...a, ...b], [])
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 1, type: "dms", isFocused: WindowInfo.isFocused()});
						});
						children.props.children = React.Children.toArray(children.props.children);
						if(children.props.children.push)
							children.props.children.push(React.createElement(wrappedCount));
					});
					Home.forceUpdateAll();
				}
				
				async patchFolders(promiseState){
					const Folder = await ReactComponents.getComponentByName("GuildFolder", "." + WebpackModules.getByProps("animationDuration", "folder", "guildIcon", "wrapper").wrapper.replace(/ /g, "."));
					if(promiseState.cancelled) return;
					const selfId = UserStore.getCurrentUser().id;
					Patcher.after(Folder.component.prototype, "render", (thisObject, _, returnValue) => {
						if(thisObject.props.expanded) return;
						if(!this.settings.folders) return;
						const fluxWrapper = Flux.connectStores([UserTypingStore, WindowInfo], ()=>({userIds: Object.values(ChannelStore.getGuildChannels())
								.filter(c => thisObject.props.guildIds.includes(c.guild_id))
								.filter(c => c.type != 2)
								.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
								.filter(c => this.settings.includeMuted || !MutedStore.isMuted(c.guild_id))
								.filter(c => SelectedGuildStore.getGuildId() != c.guild_id)
								.map(c => Object.keys(UserTypingStore.getTypingUsers(c.id))
										.filter(uId => uId !== selfId)
										.filter(uId => this.settings.includeBlocked || !RelationshipStore.isBlocked(uId))
								)
								.reduce((a,b) => [...a, ...b], [])
						}));
						const wrappedCount = fluxWrapper(({userIds}) => {
							return React.createElement(renderElement, {userIds, opacity: 1, type: "folder", isFocused: WindowInfo.isFocused()});
						});
						returnValue.props.children.push(React.createElement(wrappedCount));
					});
					Folder.forceUpdateAll();
				}
				
				getSettingsPanel(){
					return this.buildSettingsPanel().getElement();
				}
			};
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
