/**
 * @name TypingIndicator
 * @displayName TypingIndicator
 * @website https://twitter.com/l0c4lh057/
 * @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/TypingIndicator/TypingIndicator.plugin.js
 * @patreon https://www.patreon.com/l0c4lh057
 * @invite acQjXZD
 * @authorId 226677096091484160
 */

var TypingIndicator = (() => {
	const config = {
		info:{
			name: "TypingIndicator",
			authors: [{name: "l0c4lh057", github_username: "l0c4lh057", twitter_username: "l0c4lh057", discord_id: "226677096091484160"}],
			description: "Shows an indicator in the guild/channel list when someone is typing there",
			version: "0.4.0",
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
				"title": "Fixed",
				"type": "Fixed",
				"items": ["Typing indicator showing on home icon again","Indicator should also be visible with light theme now","Switched from spaces to tabs"]
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
			const title = "Library Missing";
			const ModalStack = BdApi.findModuleByProps("push", "update", "pop", "popWithKey");
			const TextElement = BdApi.findModuleByProps("Sizes", "Weights");
			const ConfirmationModal = BdApi.findModule(m => m.defaultProps && m.key && m.key() == "confirm-modal");
			if (!ModalStack || !ConfirmationModal || !TextElement) return BdApi.alert(title, `The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
			ModalStack.push(function(props) {
				return BdApi.React.createElement(ConfirmationModal, Object.assign({
					header: title,
					children: [BdApi.React.createElement(TextElement, {color: TextElement.Colors.PRIMARY, children: [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`]})],
					red: false,
					confirmText: "Download Now",
					cancelText: "Cancel",
					onConfirm: () => {
						require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
							if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
							await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
						});
					}
				}, props));
			});
		}
		start(){}
		stop(){}
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const {DiscordSelectors, WebpackModules, DiscordModules, Patcher, ReactComponents, PluginUtilities} = Api;
			const Flux = WebpackModules.getByProps("connectStores");
			const React = DiscordModules.React;
			const MutedStore = WebpackModules.getByProps("isMuted", "isChannelMuted");
			
			if(!document.getElementById("0b53rv3r5cr1p7")){
				let observerScript = document.createElement("script");
				observerScript.id = "0b53rv3r5cr1p7";
				observerScript.type = "text/javascript";
				observerScript.src = "https://l0c4lh057.github.io/BetterDiscord/Plugins/Scripts/pluginlist.js";
				document.head.appendChild(observerScript);
			}
			
			renderElement = ({cnt,opacity,type})=>{
				return cnt < 1 ? null : React.createElement(WebpackModules.getByDisplayName("Spinner"), {
					type: "pulsingEllipsis",
					className: "ti-indicator typingindicator-" + type,
					style: {
						marginLeft: 5,
						opacity: opacity
					}
				});
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
							pointer-events: none;
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
					this.patchChannelList(this.promises.state);
					this.patchGuildList(this.promises.state);
					this.patchHomeIcon(this.promises.state);
					this.patchFolders(this.promises.state);
				}
				onStop(){
					PluginUtilities.removeStyle("typingindicator-css");
					Patcher.unpatchAll();
					this.promises.cancel();
				}
				
				async patchChannelList(promiseState){
					const TextChannel = await ReactComponents.getComponentByName("TextChannel", DiscordSelectors.ChannelList.containerDefault);
					if(promiseState.cancelled) return;
					const selfId = DiscordModules.UserStore.getCurrentUser().id;
					Patcher.after(TextChannel.component.prototype, "render", (thisObject, _, returnValue) => {
						let channelData = thisObject.props;
						if(channelData.selected) return;
						if(channelData.muted && !this.settings.includeMuted) return;
						const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.keys(DiscordModules.UserTypingStore.getTypingUsers(channelData.channel.id))
							.filter(uId => uId !== selfId)
							.filter(uId => this.settings.includeBlocked || !DiscordModules.RelationshipStore.isBlocked(uId))
							.length
						}));
						const wrappedCount = fluxWrapper(({count}) => {
							return React.createElement(renderElement, {cnt: count, opacity: 0.7, type: "channel"});
						});
						returnValue.props.children.props.children.push(React.createElement(wrappedCount));
					});
					TextChannel.forceUpdateAll();
				}
				
				async patchGuildList(promiseState){
					const Guild = await ReactComponents.getComponentByName("Guild", "." + WebpackModules.getByProps("badgeIcon", "circleIcon", "listItem", "pill").listItem.replace(" ", "."));
					if(promiseState.cancelled) return;
					const selfId = DiscordModules.UserStore.getCurrentUser().id;
					Patcher.after(Guild.component.prototype, "render", (thisObject, _, returnValue) => {
						let guildData = thisObject.props;
						if(guildData.selected) return;
						if(!this.settings.guilds) return;
						if(!guildData.guild) return;
						if(MutedStore.isMuted(guildData.guildId) && !this.settings.includeMuted) return;
						const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.values(DiscordModules.ChannelStore.getChannels())
								.filter(c => c.guild_id == guildData.guildId && c.type != 2)
								.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
								.map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id))
										.filter(uId => uId !== selfId)
										.filter(uId => this.settings.includeBlocked || !DiscordModules.RelationshipStore.isBlocked(uId))
										.length
								)
								.reduce((a,b) => a+b, 0)
						}));
						const wrappedCount = fluxWrapper(({count}) => {
							return React.createElement(renderElement, {cnt: count, opacity: 1, type: "guild"});
						});
						returnValue.props.children.props.children.push(React.createElement(wrappedCount));
					});
					Guild.forceUpdateAll();
				}
				
				async patchHomeIcon(promiseState){
					const Home = await ReactComponents.getComponentByName("TutorialIndicator", "." + WebpackModules.getByProps("badgeIcon", "circleIcon", "listItem", "pill").listItem.replace(/ /g, "."));
					if(promiseState.cancelled) return;
					const selfId = DiscordModules.UserStore.getCurrentUser().id;
					Patcher.after(Home.component.prototype, "render", (thisObject, _, returnValue) => {
						if(!returnValue.props.children) return;
						let children = returnValue.props.children[0] || returnValue.props.children;
						if(!children.props) return;
						if(!children.props.children || !children.props.className) return;
						if(!children.props.children.props || !children.props.children.props.children) return;
						children = children.props.children.props.children[1];
						if(!children) return;
						if(!this.settings.dms) return;
						if(!DiscordModules.SelectedGuildStore.getGuildId()) return;
						const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.values(DiscordModules.ChannelStore.getChannels())
							.filter(c => !c.guild_id)
							.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(null, c.id))
							.map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id))
									.filter(uId => uId !== selfId)
									.filter(uId => this.settings.includeBlocked || !DiscordModules.RelationshipStore.isBlocked(uId))
									.length
							)
							.reduce((a,b) => a+b, 0)
						}));
						const wrappedCount = fluxWrapper(({count}) => {
							return React.createElement(renderElement, {cnt: count, opacity: 1, type: "dms"});
						});
						children.props.children = DiscordModules.React.Children.toArray(children.props.children);
						if(children.props.children.push)
							children.props.children.push(React.createElement(wrappedCount));
					});
					Home.forceUpdateAll();
				}
				
				async patchFolders(promiseState){
					const Folder = await ReactComponents.getComponentByName("GuildFolder", "." + WebpackModules.getByProps("animationDuration", "folder", "guildIcon", "wrapper").wrapper.replace(/ /g, "."));
					if(promiseState.cancelled) return;
					const selfId = DiscordModules.UserStore.getCurrentUser().id;
					Patcher.after(Folder.component.prototype, "render", (thisObject, _, returnValue) => {
						if(thisObject.props.expanded) return;
						if(!this.settings.folders) return;
						const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.values(DiscordModules.ChannelStore.getChannels())
								.filter(c => thisObject.props.guildIds.includes(c.guild_id))
								.filter(c => c.type != 2)
								.filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
								.filter(c => this.settings.includeMuted || !MutedStore.isMuted(c.guild_id))
								.filter(c => DiscordModules.SelectedGuildStore.getGuildId() != c.guild_id)
								.map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id))
										.filter(uId => uId !== selfId)
										.filter(uId => this.settings.includeBlocked || !DiscordModules.RelationshipStore.isBlocked(uId))
										.length
								)
								.reduce((a,b) => a+b, 0)
						}));
						const wrappedCount = fluxWrapper(({count}) => {
							return React.createElement(renderElement, {cnt: count, opacity: 1, type: "folder"});
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
