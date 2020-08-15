/**
* @name ChannelTabs
* @displayName ChannelTabs
* @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/ChannelTabs.plugin.js
* @patreon https://www.patreon.com/l0c4lh057
* @authorId 226677096091484160
* @invite acQjXZD
*/
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
	const config = {
		info: {
			name: "ChannelTabs",
			authors: [
				{
					name: "l0c4lh057",
					discord_id: "226677096091484160",
					github_username: "l0c4lh057",
					twitter_username: "l0c4lh057"
				}
			],
			version: "1.1.0",
			description: "Allows you to open multiple tabs",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/ChannelTabs/ChannelTabs.plugin.js"
		},
		changelog: [
			{
				title: "New features",
				type: "added",
				items: [
					"Middle clicking on a tab closes it",
					"Added icon to tabs (if present)"
				]
			},
			{
				title: "Fixes",
				type: "fixed",
				items: ["The title for the guild discovery is correct now"]
			}
		]
	};
	
	if(!document.getElementById("0b53rv3r5cr1p7")){
		let observerScript = document.createElement("script");
		observerScript.id = "0b53rv3r5cr1p7";
		observerScript.type = "text/javascript";
		observerScript.src = "https://l0c4lh057.github.io/BetterDiscord/Plugins/Scripts/pluginlist.js";
		document.head.appendChild(observerScript);
	}
	
	return !global.ZeresPluginLibrary ? class {
		constructor(){ this._config = config; }
		getName(){ return config.info.name; }
		getAuthor(){ return config.info.authors.map(a => a.name).join(", "); }
		getDescription(){ return config.info.description; }
		getVersion(){ return config.info.version; }
		load(){
			BdApi.showConfirmationModal("Library plugin is needed", 
				[`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
					confirmText: "Download",
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
			const { WebpackModules, PluginUtilities, DiscordModules, Patcher, DCM } = Api;
			const { React } = DiscordModules;
			return class ChannelTabs extends Plugin {
				constructor(){
					super();
				}
				
				onStart(){
					PluginUtilities.addStyle("channelTabs-style", `
						:root {
							--channelTabs-tabWidth: 190px;
						}
						.channelTabs-tab {
							display: inline-block;
							margin: 2px 0;
							margin-left: 4px;
							font-size: 18px;
							width: var(--channelTabs-tabWidth);
							position: relative;
							background: none;
							border:none;
							padding:6px;
							border-radius:5px;
							color:var(--interactive-normal);
							height: 20px;
						}
						.channelTabs-name {
							width: calc(var(--channelTabs-tabWidth) - 18px);
							display: inline-block;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
						}
						.channelTabs-name:only-child {
							width: calc(var(--channelTabs-tabWidth) - 2px);
						}
						.channelTabs-tabContainer {
							height: 36px;
							background: var(--background-secondary-alt);
							z-index: 1;
						}
						.channelTabs-tab:not(.channelTabs-selected):hover {
							background: var(--background-modifier-hover);
							cursor: pointer;
							color: var(--interactive-hover);
						}
						.channelTabs-selected {
							background: var(--background-modifier-selected);
							color: var(--interactive-active);
						}
						.channelTabs-close {
							display: inline-block;
							position: absolute;
							right: 4px;
							top: 5px;
							width: 14px;
							height: 14px;
							border-radius: 7px;
							text-align: center;
							line-height:11px;
							font-size: 15px;
							background: var(--interactive-muted);
							color: var(--background-secondary-alt);
							cursor: pointer;
						}
						.channelTabs-selected .channelTabs-close {
							background: var(--interactive-normal);
						}
						.channelTabs-selected .channelTabs-close:hover {
							background: var(--interactive-hover);
						}
						.channelTabs-newTab {
							display: inline-block;
							margin-left: 5px;
							padding: 3px;
							border-radius:50%;
							width: 15px;
							height: 15px;
							text-align:center;
							background:var(--interactive-muted);
							font-weight: 600;
							cursor: pointer;
							color: var(--background-secondary-alt);
							position: absolute;
							top: 9px;
						}
						.channelTabs-newTab:hover {
							background: var(--interactive-normal);
						}
						.channelTabs-tabIcon {
							height: 100%;
							display: inline-block;
							margin-right: 5px;
							border-radius: 40%;
						}
						.channelTabs-tabIcon ~ .channelTabs-name {
							width: calc(var(--channelTabs-tabWidth) - 32px);
						}
					`);
					this.tabs = [{
						name: this.getCurrentName(),
						url: location.pathname,
						selected: true,
						iconUrl: this.getCurrentIconUrl()
					}];
					this.selectedTab = 0;
					this.promises = {state:{cancelled: false}, cancel(){this.state.cancelled = true;}};
					this.patchAppView(this.promises.state);
					this.patchTextChannelContextMenu();
					this.patchDMContextMenu();
					this.patchGroupContextMenu();
				}
				
				onStop(){
					PluginUtilities.removeStyle("channelTabs-style");
					Patcher.unpatchAll();
					this.promises.cancel();
					this.rerenderAppView();
				}
				
				onSwitch(){
					if(this.switching) return;
					this.tabs[this.selectedTab] = {
						name: this.getCurrentName(),
						url: location.pathname,
						selected: true,
						iconUrl: this.getCurrentIconUrl()
					};
					this.rerenderAppView();
				}
				
				async patchAppView(promiseState){
					this.AppView = await ZLibrary.ReactComponents.getComponent("Shakeable", ".app-2rEoOp");
					if(promiseState.cancelled) return;
					Patcher.after(this.AppView.component.prototype, "render", (thisObject, _, returnValue) => {
						returnValue.props.children = [this.renderTabs(this.tabs), returnValue.props.children].flat();
					});
					this.rerenderAppView();
				}
				
				rerenderAppView(){
					if(this.AppView) this.AppView.forceUpdateAll();
				}
				
				patchTextChannelContextMenu(){
					const [, , TextChannelContextMenu] = WebpackModules.getModules(m => m.default && m.default.displayName == "ChannelListTextChannelContextMenu");
					Patcher.after(TextChannelContextMenu, "default", (_, [props], returnValue) => {
						returnValue.props.children.push(DCM.buildMenuItem({
							label: "Open in new tab",
							action: ()=>this.saveChannel(props.channel.guild_id, props.channel.id, "#" + props.channel.name, props.guild.getIconURL() || "")
						}))
					});
				}
				
				patchDMContextMenu(){
					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'DMUserContextMenu');
					Patcher.after(DMContextMenu, "default", (_, [props], returnValue) => {
						if(!returnValue) return;
						returnValue.props.children.props.children.push(DCM.buildMenuItem({
							label: "Open in new tab",
							action: ()=>this.saveChannel(props.channel.guild_id, props.channel.id, "@" + (props.channel.name || props.user.username), props.user.avatarURL)
						}))
					});
				}
				
				patchGroupContextMenu(){
					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'GroupDMContextMenu');
					Patcher.after(DMContextMenu, "default", (thisObject, [props], returnValue) => {
						if(!returnValue) return;
						returnValue.props.children.push(DCM.buildMenuItem({
							label: "Open in new tab",
							action: ()=>this.saveChannel(props.channel.guild_id, props.channel.id, "@" + (props.channel.name || props.channel.rawRecipients.map(u=>u.username).join(", ")), ""/*TODO*/)
						}))
					});
				}
				
				renderTabs(tabs){
					if(tabs.length == 0) return null;
					return React.createElement(
							"div",
							{
								className: "channelTabs-tabContainer"
							},
							...tabs.map((tab, tabIndex) => this.renderTab(tab, tabIndex, this.tabs.length)),
							React.createElement(
								"div",
								{
									className: "channelTabs-newTab",
									onClick: ()=>{
											this.tabs.push({
											url: "/channels/@me",
											name: "Friends",
											selected: false
										});
										this.rerenderAppView();
									}
								},
								"+"
							)
					);
				}
				
				renderTab(tab, tabIndex, tabCount){
					return React.createElement(
						"div",
						{
							className: "channelTabs-tab" + (tab.selected ? " channelTabs-selected" : ""),
							onClick: ()=>{if(!tab.selected) this.switchToTab(tabIndex);},
							onMouseUp: e=>{
								if(e.button!==1) return;
								e.preventDefault();
								this.closeTab(tabIndex);
							}
						},
						!tab.iconUrl ? null : React.createElement("img", {
							className: "channelTabs-tabIcon",
							src: tab.iconUrl
						}),
						React.createElement(
							"span",
							{
								className: "channelTabs-name"
							},
							tab.name
						),
						tabCount == 1 ? null : React.createElement(
							"div",
							{
								className: "channelTabs-close",
								onClick: e=>{
									e.stopPropagation();
									this.closeTab(tabIndex);
								}
							},
							"⨯"
						)
					);
				}
				
				saveChannel(guildId, channelId, name, iconUrl){
					if(!this.tabs.some(tab=>tab.channelId===channelId)){
						this.tabs.push({
							url: `/channels/${guildId || "@me"}/${channelId}`,
							name,
							iconUrl
						});
						this.rerenderAppView();
					}
				}
				
				switchToTab(tabIndex){
					this.tabs[this.selectedTab].selected = false;
					this.tabs[tabIndex].selected = true;
					this.selectedTab = tabIndex;
					this.switching = true;
					DiscordModules.NavigationUtils.transitionTo(this.tabs[this.selectedTab].url);
					this.switching = false;
				}
				
				closeTab(tabIndex){
					if(this.tabs.length == 1) return;
					this.tabs.splice(tabIndex, 1);
					if(this.selectedTab == tabIndex){
						if(tabIndex > 0) this.selectedTab--;
						this.switchToTab(tabIndex == 0 ? 0 : tabIndex - 1);
					}else if(this.selectedTab > tabIndex){
						this.selectedTab--;
					}
					this.rerenderAppView();
				}
				
				getCurrentName(){
					const { pathname } = location;
					const cId = DiscordModules.SelectedChannelStore.getChannelId();
					if(cId){
						const channel = DiscordModules.ChannelStore.getChannel(cId);
						if(channel.name) return (channel.guild_id ? "#" : "@") + channel.name;
						else if(channel.rawRecipients) return "@" + channel.rawRecipients.map(u=>u.username).join(", ");
						else return location.pathname;
					}else{
						if(pathname === "/channels/@me") return "Friends";
						else if(pathname.match(/^\/[a-z\-]+$/)) return pathname.substr(1).split("-").map(part => part.substr(0, 1).toUpperCase() + part.substr(1)).join(" ");
						else return pathname;
					}
				}
				
				getCurrentIconUrl(){
					const { pathname } = location;
					const cId = DiscordModules.SelectedChannelStore.getChannelId();
					if(cId){
						const channel = DiscordModules.ChannelStore.getChannel(cId);
						if(channel.guild_id){
							const guild = DiscordModules.GuildStore.getGuild(channel.guild_id);
							return guild.getIconURL() || "";
						}else{
							if(channel.isDM()){
								const user = DiscordModules.UserStore.getUser(channel.getRecipientId());
								return user.avatarURL;
							}else if(channel.isGroupDM()){
								// TODO
							}
						}
					}
					return "";
				}
				
				// COMING SOON
				registerKeybinds(){
					
				}
				
				unregisterKeybinds(){
					
				}
				
				nextTab(){
					this.switchToTab((this.selectedTab + 1) % this.tabs.length);
				}
				
				previousTab(){
					this.switchToTab((this.selectedTab + this.tabs.length - 1) % this.tabs.length);
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
