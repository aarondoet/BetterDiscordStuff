/**
* @name ChannelTabs
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
			version: "0.1.0",
			description: "Allows you to open multiple tabs",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/ChannelTabs/ChannelTabs.plugin.js"
		},
		changelog: [
			{
				title: "Release",
				type: "added",
				items: ["Initial release"]
			},
			{
				title: "Added",
				type: "progress",
				items: ["Right clicking guild channels, user DMs and group DMs has a `Open in new tab` context menu item"]
			},
			{
				title: "Fixes",
				type: "fixed",
				items: ["Closing tabs now works properly"]
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
			const { WebpackModules, PluginUtilities, DiscordModules, ReactComponents, Patcher, DCM } = Api;
			const { React } = DiscordModules;
			return class ChannelTabs extends Plugin {
				constructor(){
					super();
				}
				
				onStart(){
					PluginUtilities.addStyle("channelTabs-style", `
						.channelTabs-tabContainer {
							z-index: 1;
							height: 30px;
						}
						.channelTabs-tab {
							display: inline-block;
							margin: 2px 0;
							margin-left: 4px;
							padding: 3px;
							font-size: 18px;
							border: 1px solid black;
							border-radius: 6px;
							width: 110px;
							position: relative;
						}
						.channelTabs-selected {
							background-color: rgba(0, 0, 0, 0.2);
						}
						.channelTabs-name {
							width: 90px;
							display: inline-block;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
						}
						.channelTabs-close {
							display: inline-block;
							position: absolute;
							right: 4px;
							top: 5px;
							font-size: 14px;
							background-color: #b00;
							color: white;
							width: 14px;
							height: 14px;
							border-radius: 7px;
							text-align: center;
						}
						.channelTabs-newTab {
							display: inline-block;
							margin-left: 5px;
							border: 1px solid black;
							padding: 3px;
							border-radius: 6px;
						}
					`);
					this.tabs = [{
						name: this.getCurrentName(),
						url: location.pathname,
						selected: true
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
						selected: true
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
					Patcher.after(TextChannelContextMenu, "default", (thisObject, [props], returnValue) => {
						returnValue.props.children.push(DCM.buildMenuItem({
							label: "Open in new tab",
							action: ()=>this.saveChannel(props.channel.guild_id, props.channel.id, props.channel.name)
						}))
					});
				}
				
				patchDMContextMenu(){
					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'DMUserContextMenu');
					Patcher.after(DMContextMenu, "default", (thisObject, [props], returnValue) => {
						if(!returnValue) return;
						returnValue.props.children.props.children.push(DCM.buildMenuItem({
							label: "Open in new tab",
							action: ()=>this.saveChannel(props.channel.guild_id, props.channel.id, props.channel.name || props.user.username)
						}))
					});
				}
				
				patchGroupContextMenu(){
					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'GroupDMContextMenu');
					Patcher.after(DMContextMenu, "default", (thisObject, [props], returnValue) => {
						if(!returnValue) return;
						returnValue.props.children.push(DCM.buildMenuItem({
							label: "Open in new tab",
							action: ()=>this.saveChannel(props.channel.guild_id, props.channel.id, props.channel.name || props.channel.rawRecipients.map(u=>u.username).join(", "))
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
							...tabs.map((tab, tabIndex) => this.renderTab(tab, tabIndex)),
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
				
				renderTab(tab, tabIndex){
					return React.createElement(
						"div",
						{
							className: "channelTabs-tab" + (tab.selected ? " channelTabs-selected" : "")
						},
						React.createElement(
							"span",
							{
								className: "channelTabs-name",
								onClick: ()=>this.switchToTab(tabIndex)
							},
							tab.name
						),
						React.createElement(
							"div",
							{
								className: "channelTabs-close",
								onClick: ()=>this.closeTab(tabIndex)
							},
							"X"
						)
					);
				}
				
				saveChannel(guildId, channelId, channelName){
					if(!this.tabs.some(tab=>tab.channelId===channelId)){
						this.tabs.push({
							url: `/channels/${guildId || "@me"}/${channelId}`,
							name: channelName
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
						if(channel.name) return channel.name;
						else if(channel.rawRecipients) return channel.rawRecipients.map(u=>u.username).join(", ");
						else return location.pathname;
					}else{
						if(pathname === "/channels/@me") return "Friends";
						else if(pathname.match(/^\/[a-z]+$/)) return pathname.substr(1, 1).toUpperCase() + pathname.substr(2);
						else return pathname;
					}
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
