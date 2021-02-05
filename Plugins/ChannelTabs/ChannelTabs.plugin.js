/**
* @name ChannelTabs
* @displayName ChannelTabs
* @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/ChannelTabs.plugin.js
* @patreon https://www.patreon.com/l0c4lh057
* @authorId 226677096091484160
* @invite YzzeuJPpyj
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
			version: "2.4.1",
			description: "Allows you to have multiple tabs and bookmark channels",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/ChannelTabs/ChannelTabs.plugin.js"
		},
		changelog: [
			{
				"title": "Fixed",
				"type": "fixed",
				"items": ["Should not cause crashes on PTB and Canary anymore"]
			}
		]
	};
	
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
				}
			);
		}
		start(){}
		stop(){}
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { WebpackModules, PluginUtilities, DiscordModules, DiscordClassModules, Patcher, DCM, ReactComponents, Settings } = Api;
			const { React, DiscordConstants, NavigationUtils, SelectedChannelStore, SelectedGuildStore, ChannelStore, GuildStore, UserStore } = DiscordModules;
			const Textbox = WebpackModules.find(m => m.defaultProps && m.defaultProps.type == "text");
			const UnreadStateStore = WebpackModules.getByProps("getMentionCount", "hasUnread");
			const Flux = WebpackModules.getByProps("connectStores");
			const MutedStore = WebpackModules.getByProps("isMuted", "isChannelMuted");
			const PermissionUtils  = WebpackModules.getByProps("can", "canManageUser");
			const Permissions = DiscordModules.DiscordConstants.Permissions;
			
			var switching = false;
			var patches = [];
			
			if(!BdApi.Plugins.get("BugReportHelper") && !BdApi.getData(config.info.name, "didShowIssueHelperPopup")){
				BdApi.saveData(config.info.name, "didShowIssueHelperPopup", true);
				BdApi.showConfirmationModal("Do you want to download a helper plugin?", 
					[`Do you want to download a helper plugin that makes it easier for you to report issues? That plugin is not needed to anything else to function correctly but nice to have when reporting iissues, shortening the time until the problem gets resolved by asking you for specific information and also including additional information you did not provide.`],
					{
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
					}
				);
			}
			
			
			const getGuildChannels = (...guildIds)=>{
				const channels = ChannelStore.getGuildChannels ? Object.values(ChannelStore.getGuildChannels()) : ChannelStore.getMutableGuildChannels ? Object.values(ChannelStore.getMutableGuildChannels()) : [];
				return channels.filter(c => guildIds.includes(c.guild_id) && c.type !== DiscordConstants.ChannelTypes.GUILD_VOICE && c.type !== DiscordConstants.ChannelTypes.GUILD_CATEGORY);
			}
			
			const mergeLists = (...items)=>items.filter(item => item.include===undefined||item.include).flatMap(item => item.values);
			
			const TabIcon = props=>!props.iconUrl ? null : React.createElement(
				"img",
				{
					className: "channelTabs-tabIcon",
					src: props.iconUrl
				}
			);
			const TabName = props=>React.createElement(
				"span",
				{
					className: "channelTabs-tabName"
				},
				props.name
			);
			const TabClose = props=>props.tabCount < 2 ? null : React.createElement(
				"div",
				{
					className: "channelTabs-closeTab",
					onClick: e=>{
						e.stopPropagation();
						props.closeTab();
					}
				},
				"⨯"
			);
			const TabUnreadBadge = props=>!props.hasUnread ? null : React.createElement("div", {
				className: "channelTabs-unreadBadge"
			}, props.unreadCount === 0 ? (props.mentionCount||1) + "+" : (props.unreadCount + (props.unreadEstimated ? "+" : "")));
			const TabMentionBadge = props=>props.mentionCount === 0 ? null : React.createElement("div", {
				className: "channelTabs-mentionBadge"
			}, props.mentionCount);
			const Tab = props=>React.createElement(
				"div",
				{
					className: "channelTabs-tab"
									+ (props.selected ? " channelTabs-selected" : "")
									+ (props.hasUnread ? " channelTabs-unread" : "")
									+ (props.mentionCount > 0 ? " channelTabs-mention" : ""),
					"data-mention-count": props.mentionCount,
					"data-unread-count": props.unreadCount,
					"data-unread-estimated": props.unreadEstimated,
					onClick: ()=>{if(!props.selected) props.switchToTab(props.tabIndex);},
					onMouseUp: e=>{
						if(e.button !== 1) return;
						e.preventDefault();
						props.closeTab(props.tabIndex);
					},
					onContextMenu: e=>{
						DCM.openContextMenu(
							e,
							DCM.buildMenu([
								{
									type: "group",
									items: mergeLists(
										{
											values: [
												{
													label: "Duplicate",
													action: props.openInNewTab
												},
												{
													label: "Add to favourites",
													action: ()=>props.addToFavs(props.name, props.iconUrl, props.url, props.channelId)
												}
											]
										},
										{
											include: props.tabCount > 1,
											values: [
												{
													label: "Move left",
													action: props.moveLeft
												},
												{
													label: "Move right",
													action: props.moveRight
												}
											]
										},
										{
											values: [
												{
													label: "Close",
													action: ()=>props.closeTab(props.tabIndex),
													danger: true
												}
											]
										}
									)
								}
							]),
							{
								position: "right",
								align: "top"
							}
						)
					}
				},
				React.createElement(TabIcon, {iconUrl: props.iconUrl}),
				React.createElement(TabName, {name: props.name}),
				!props.showTabUnreadBadges ? null : React.createElement(
					React.Fragment,
					{},
					React.createElement(TabMentionBadge, {mentionCount: props.mentionCount}),
					!props.channelId || (ChannelStore.getChannel(props.channelId)?.isPrivate() ?? true) ? null : React.createElement(TabUnreadBadge, {unreadCount: props.unreadCount, unreadEstimated: props.unreadEstimated, hasUnread: props.hasUnread, mentionCount: props.mentionCount})
				),
				React.createElement(TabClose, {tabCount: props.tabCount, closeTab: ()=>props.closeTab(props.tabIndex)})
			);
			
			const NewTab = props=>React.createElement(
				"div",
				{
					className: "channelTabs-newTab",
					onClick: props.openNewTab
				},
				"+"
			);
			
			const TabBar = props=>React.createElement(
				"div",
				{
					className: "channelTabs-tabContainer",
					"data-tab-count": props.tabs.length
				},
				props.tabs.map((tab, tabIndex)=>React.createElement(Flux.connectStores([UnreadStateStore], ()=>({
					unreadCount: UnreadStateStore.getUnreadCount(tab.channelId),
					unreadEstimated: UnreadStateStore.isEstimated(tab.channelId),
					hasUnread: UnreadStateStore.hasUnread(tab.channelId),
					mentionCount: UnreadStateStore.getMentionCount(tab.channelId)
				}))(result => React.createElement(
					Tab,
					{
						switchToTab: props.switchToTab,
						closeTab: props.closeTab,
						addToFavs: props.addToFavs,
						moveLeft: ()=>props.move(tabIndex, (tabIndex + props.tabs.length - 1) % props.tabs.length),
						moveRight: ()=>props.move(tabIndex, (tabIndex + 1) % props.tabs.length),
						openInNewTab: ()=>props.openInNewTab(tab),
						tabCount: props.tabs.length,
						tabIndex,
						name: tab.name,
						iconUrl: tab.iconUrl,
						url: tab.url,
						selected: tab.selected,
						channelId: tab.channelId,
						showTabUnreadBadges: props.showTabUnreadBadges,
						unreadCount: result.unreadCount,
						unreadEstimated: result.unreadEstimated,
						hasUnread: result.hasUnread,
						mentionCount: result.mentionCount
					}
				)))),
				React.createElement(NewTab, {
					openNewTab: props.openNewTab
				})
			);
			
			const FavIcon = props=>!props.iconUrl ? null : React.createElement(
				"img",
				{
					className: "channelTabs-favIcon",
					src: props.iconUrl
				}
			);
			const FavName = props=>React.createElement(
				"span",
				{
					className: "channelTabs-favName"
				},
				props.name
			)
			const FavUnreadBadge = props=>React.createElement("div", {
				className: "channelTabs-unreadBadge" + (!props.hasUnread ? " channelTabs-noUnread" : "")
			}, props.unreadCount + (props.unreadEstimated ? "+" : ""));
			const FavMentionBadge = props=>React.createElement("div", {
				className: "channelTabs-mentionBadge" + (props.mentionCount === 0 ? " channelTabs-noMention" : "")
			}, props.mentionCount);
			const Fav = props=>React.createElement(
				"div",
				{
					className: "channelTabs-fav" + (props.channelId ? " channelTabs-channel" : props.guildId ? " channelTabs-guild" : "")
									+ (props.selected ? " channelTabs-selected" : "")
									+ (props.hasUnread ? " channelTabs-unread" : "")
									+ (props.mentionCount > 0 ? " channelTabs-mention" : ""),
					"data-mention-count": props.mentionCount,
					"data-unread-count": props.unreadCount,
					"data-unread-estimated": props.unreadEstimated,
					onClick: ()=>props.guildId ? NavigationUtils.transitionToGuild(props.guildId, SelectedChannelStore.getChannelId(props.guildId)) : NavigationUtils.transitionTo(props.url),
					onMouseUp: e=>{
						if(e.button !== 1) return;
						e.preventDefault();
						props.openInNewTab();
					},
					onContextMenu: e=>{
						DCM.openContextMenu(
							e,
							DCM.buildMenu([
								{
									type: "group",
									items: mergeLists(
										{
											values: [
												{
													label: "Open in new tab",
													action: props.openInNewTab
												},
												{
													label: "Rename",
													action: props.rename
												}
											]
										},
										{
											include: props.favCount > 1,
											values: [
												{
													label: "Move left",
													action: props.moveLeft
												},
												{
													label: "Move right",
													action: props.moveRight
												}
											]
										},
										{
											values: [
												{
													label: "Delete",
													action: props.delete,
													danger: true
												}
											]
										}
									)
								}
							]),
							{
								position: "right",
								align: "top"
							}
						)
					}
				},
				React.createElement(FavIcon, {iconUrl: props.iconUrl}),
				React.createElement(FavName, {name: props.name}),
				!(props.showFavUnreadBadges && (props.channelId || props.guildId)) ? null : React.createElement(
					React.Fragment,
					{},
					(()=>{const c=ChannelStore.getChannel(props.channelId); return c&&(c.isDM()||c.isGroupDM());})() ? null : React.createElement(FavUnreadBadge, {unreadCount: props.unreadCount, unreadEstimated: props.unreadEstimated, hasUnread: props.hasUnread}),
					React.createElement(FavMentionBadge, {mentionCount: props.mentionCount})
				)
			);
			
			const FavBar = props=>React.createElement(
				"div",
				{
					className: "channelTabs-favContainer" + (props.favs.length == 0 ? " channelTabs-noFavs" : ""),
					"data-fav-count": props.favs.length,
					onContextMenu: e=>{
						DCM.openContextMenu(
							e,
							DCM.buildMenu([
								{
									type: "group",
									items: [
										{
											label: "Add current tab as favourite",
											action: ()=>props.addToFavs(getCurrentName(), getCurrentIconUrl(), location.pathname, SelectedChannelStore.getChannelId())
										},
										{
											label: "Hide bookmarks",
											action: props.hideFavBar,
											danger: true
										}
									]
								}
							]),
							{
								position: "right",
								align: "top"
							}
						)
					}
				},
				props.favs.length > 0
					? props.favs.map((fav, favIndex) => React.createElement(Flux.connectStores([UnreadStateStore, SelectedChannelStore], ()=>{
							if(fav.guildId){
								const channelIds = getGuildChannels(fav.guildId)
											.filter(channel=>(PermissionUtils.can(Permissions.VIEW_CHANNEL, channel)) && (!MutedStore.isChannelMuted(channel.guild_id, channel.id)))
											.map(channel=>channel.id);
								return {
									unreadCount: channelIds.map(id=>UnreadStateStore.getUnreadCount(id)||UnreadStateStore.getMentionCount(id)||(UnreadStateStore.hasUnread(id)?1:0)).reduce((a,b)=>a+b, 0),
									unreadEstimated: channelIds.some(id=>UnreadStateStore.isEstimated(id)) || channelIds.some(id=>UnreadStateStore.getUnreadCount(id)===0&&UnreadStateStore.hasUnread(id)),
									hasUnread: channelIds.some(id=>UnreadStateStore.hasUnread(id)),
									mentionCount: channelIds.map(id=>UnreadStateStore.getMentionCount(id)||0).reduce((a,b)=>a+b, 0),
									selected: SelectedGuildStore.getGuildId()===fav.guildId
								};
							}else{
								return {
									unreadCount: UnreadStateStore.getUnreadCount(fav.channelId) || UnreadStateStore.getMentionCount(fav.channelId) || (UnreadStateStore.hasUnread(fav.channelId) ? 1 : 0),
									unreadEstimated: UnreadStateStore.isEstimated(fav.channelId) || (UnreadStateStore.hasUnread(fav.channelId) && UnreadStateStore.getUnreadCount(fav.channelId) === 0),
									hasUnread: UnreadStateStore.hasUnread(fav.channelId),
									mentionCount: UnreadStateStore.getMentionCount(fav.channelId),
									selected: SelectedChannelStore.getChannelId()===fav.channelId
								};
							}
						})(result => React.createElement(
							Fav,
							{
								name: fav.name,
								iconUrl: fav.iconUrl,
								url: fav.url,
								favCount: props.favs.length,
								rename: ()=>props.rename(fav.name, favIndex),
								delete: ()=>props.delete(favIndex),
								openInNewTab: ()=>props.openInNewTab(fav),
								moveLeft: ()=>props.move(favIndex, (favIndex + props.favs.length - 1) % props.favs.length),
								moveRight: ()=>props.move(favIndex, (favIndex + 1) % props.favs.length),
								channelId: fav.channelId,
								guildId: fav.guildId,
								showFavUnreadBadges: props.showFavUnreadBadges,
								...result
							}
						))))
					: React.createElement("span", {
							className: "channelTabs-noFavNotice"
						}, "You don't have any favs yet. Right click a tab to mark it as favourite. You can disable this bar in the settings.")
			);
			
			
			
			const TopBar = class TopBar extends React.Component {
				constructor(props){
					super(props);
					this.state = {
						selectedTabIndex: Math.max(props.tabs.findIndex(tab => tab.selected), 0),
						tabs: props.tabs,
						favs: props.favs,
						showTabBar: props.showTabBar,
						showFavBar: props.showFavBar,
						showTabUnreadBadges: props.showTabUnreadBadges,
						showFavUnreadBadges: props.showFavUnreadBadges
					};
					this.switchToTab = this.switchToTab.bind(this);
					this.closeTab = this.closeTab.bind(this);
					this.saveChannel = this.saveChannel.bind(this);
					this.renameFav = this.renameFav.bind(this);
					this.deleteFav = this.deleteFav.bind(this);
					this.addToFavs = this.addToFavs.bind(this);
					this.moveTab = this.moveTab.bind(this);
					this.moveFav = this.moveFav.bind(this);
				}
				switchToTab(tabIndex){
					this.setState({
						tabs: this.state.tabs.map((tab, index) => {
							if(index === tabIndex){
								return Object.assign({}, tab, {selected: true});
							}else{
								return Object.assign({}, tab, {selected: false});
							}
						}),
						selectedTabIndex: tabIndex
					}, this.props.plugin.saveSettings);
					switching = true;
					NavigationUtils.transitionTo(this.state.tabs[tabIndex].url);
					switching = false;
				}
				closeTab(tabIndex){
					if(this.state.tabs.length === 1) return;
					this.setState({
						tabs: this.state.tabs.filter((tab, index)=>index !== tabIndex),
						selectedTabIndex: Math.max(0, this.state.selectedTabIndex - (this.state.selectedTabIndex >= tabIndex ? 1 : 0))
					}, ()=>{
						if(!this.state.tabs[this.state.selectedTabIndex].selected){
							this.switchToTab(this.state.selectedTabIndex);
						}
						this.props.plugin.saveSettings();
					});
				}
				moveTab(fromIndex, toIndex){
					if(fromIndex === toIndex) return;
					const tabs = this.state.tabs.filter((tab, index)=>index !== fromIndex);
					tabs.splice(toIndex, 0, this.state.tabs[fromIndex]);
					this.setState({
						tabs,
						selectedTabIndex: tabs.findIndex(tab=>tab.selected)
					}, this.props.plugin.saveSettings);
				}
				saveChannel(guildId, channelId, name, iconUrl){
					this.setState({
						tabs: [...this.state.tabs, {
							url: `/channels/${guildId || "@me"}/${channelId}`,
							name,
							iconUrl,
							channelId
						}]
					}, this.props.plugin.saveSettings);
				}
				renameFav(currentName, favIndex){
					let name = currentName;
					BdApi.showConfirmationModal(
						"What should the new name be?",
						React.createElement(Textbox, {
							onChange: newContent=>name = newContent.trim()
						}),
						{
							onConfirm: ()=>{
								if(!name) return;
								this.setState({
									favs: this.state.favs.map((fav, index)=>{
										if(index === favIndex) return Object.assign({}, fav, {name});
										else return Object.assign({}, fav);
									})
								}, this.props.plugin.saveSettings);
							}
						}
					);
				}
				deleteFav(favIndex){
					this.setState({
						favs: this.state.favs.filter((fav, index)=>index!==favIndex)
					}, this.props.plugin.saveSettings);
				}
				/**
				 * The guildId parameter is only passed when the guild is saved and not the channel alone.
				 * This indicates that the currently selected channel needs to get selected instead of the
				 * provided channel id (which should be empty when a guildId is provided)
				 */
				addToFavs(name, iconUrl, url, channelId, guildId){
					this.setState({
						favs: [...this.state.favs, {name, iconUrl, url, channelId, guildId}]
					}, this.props.plugin.saveSettings);
				}
				moveFav(fromIndex, toIndex){
					if(fromIndex === toIndex) return;
					const favs = this.state.favs.filter((fav, index)=>index !== fromIndex);
					favs.splice(toIndex, 0, this.state.favs[fromIndex]);
					this.setState({favs}, this.props.plugin.saveSettings);
				}
				render(){
					return React.createElement(
						"div",
						{
							id: "channelTabs-container"
						},
						!this.state.showTabBar ? null : React.createElement(TabBar, {
							tabs: this.state.tabs,
							showTabUnreadBadges: this.state.showTabUnreadBadges,
							closeTab: this.closeTab,
							switchToTab: this.switchToTab,
							openNewTab: ()=>{
								const newTabIndex = this.state.tabs.length;
								this.setState({
									tabs: [...this.state.tabs.map(tab=>Object.assign(tab, {selected: false})), {
										url: "/channels/@me",
										name: "Friends",
										selected: true,
										channelId: undefined
									}],
									selectedTabIndex: newTabIndex
								}, ()=>{
									this.props.plugin.saveSettings();
									this.switchToTab(newTabIndex);
								})
							},
							openInNewTab: tab=>{
								this.setState({
									tabs: [...this.state.tabs, Object.assign({}, tab, {selected: false})]
								}, this.props.plugin.saveSettings);
							},
							addToFavs: this.addToFavs,
							move: this.moveTab
						}),
						!this.state.showFavBar ? null : React.createElement(FavBar, {
							favs: this.state.favs,
							showFavUnreadBadges: this.state.showFavUnreadBadges,
							rename: this.renameFav,
							delete: this.deleteFav,
							addToFavs: this.addToFavs,
							openInNewTab: fav=>{
								const url = fav.url + (fav.guildId ? `/${fav.guildId}` : "")
								this.setState({
									tabs: [...this.state.tabs, {
										url,
										selected: false,
										name: getCurrentName(url),
										iconUrl: getCurrentIconUrl(url),
										channelId: fav.channelId || SelectedChannelStore.getChannelId(fav.guildId)
									}]
								}, this.props.plugin.saveSettings);
							},
							move: this.moveFav,
							hideFavBar: ()=>{
								this.setState({
									showFavBar: false
								}, ()=>{
									this.props.plugin.settings.showFavBar = false;
									this.props.plugin.saveSettings();
								});
							}
						})
					);
				}
			};
			
			
			
			const getCurrentName = (pathname = location.pathname)=>{
				const cId = (pathname.match(/^\/channels\/(\d+|@me)\/(\d+)/) || [])[2];
				if(cId){
					const channel = ChannelStore.getChannel(cId);
					if(channel.name) return (channel.guildId ? "@" : "#") + channel.name;
					else if(channel.rawRecipients) return "@" + channel.rawRecipients.map(u=>u.username).join(", ");
					else return pathname;
				}else{
					if(pathname === "/channels/@me") return "Friends";
					else if(pathname.match(/^\/[a-z\-]+$/)) return pathname.substr(1).split("-").map(part => part.substr(0, 1).toUpperCase() + part.substr(1)).join(" ");
					else return pathname;
				}
			};
			
			const getCurrentIconUrl = (pathname = location.pathname)=>{
				const cId = (pathname.match(/^\/channels\/(\d+|@me)\/(\d+)/) || [])[2];
				if(cId){
					const channel = ChannelStore.getChannel(cId);
					if(channel.guild_id){
						const guild = GuildStore.getGuild(channel.guild_id);
						return guild.getIconURL() || "";
					}else{
						if(channel.isDM()){
							const user = UserStore.getUser(channel.getRecipientId());
							return user.avatarURL;
						}else if(channel.isGroupDM()){
							// TODO
						}
					}
				}
				return "";
			};
			
			const TopBarRef = React.createRef();
			
			return class ChannelTabs extends Plugin {
				constructor(){
					super();
				}
				
				onStart(){
					PluginUtilities.addStyle("channelTabs-style", `
						:root {
							--channelTabs-tabWidth: 190px;
							--channelTabs-tabHeight: 20px;
							--channelTabs-favHeight: 20px;
						}
						.channelTabs-tab {
							display: inline-block;
							margin: 2px 0;
							margin-left: 4px;
							font-size: calc(var(--channelTabs-tabHeight) - 2px);
							width: var(--channelTabs-tabWidth);
							position: relative;
							background: none;
							border: none;
							padding: 6px;
							border-radius: 5px;
							color: var(--interactive-normal);
							height: var(--channelTabs-tabHeight);
						}
						.channelTabs-tabName {
							width: calc(var(--channelTabs-tabWidth) - 18px);
							display: inline-block;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
						}
						.channelTabs-tabName:only-child {
							width: calc(var(--channelTabs-tabWidth) - 2px);
						}
						#channelTabs-container {
							z-index: 1;
						}
						.channelTabs-tabContainer {
							min-height: calc(var(--channelTabs-tabHeight) + 14px);
							background: var(--background-secondary-alt);
							position: relative;
						}
						.channelTabs-tab:not(.channelTabs-selected):hover {
							background: var(--background-modifier-hover);
							cursor: pointer;
							color: var(--interactive-hover);
						}
						.channelTabs-tab.channelTabs-selected {
							background: var(--background-modifier-selected);
							color: var(--interactive-active);
						}
						.channelTabs-closeTab {
							display: inline-block;
							position: absolute;
							right: 4px;
							top: 5px;
							width: 14px;
							height: 14px;
							border-radius: 7px;
							text-align: center;
							line-height: 11px;
							font-size: 15px;
							background: var(--interactive-muted);
							color: var(--background-secondary-alt);
							cursor: pointer;
						}
						.channelTabs-tab.channelTabs-selected .channelTabs-closeTab {
							background: var(--interactive-normal);
						}
						.channelTabs-tab.channelTabs-selected .channelTabs-closeTab:hover {
							background: var(--interactive-hover);
						}
						.channelTabs-newTab {
							display: inline-block;
							margin-left: 5px;
							padding: 3px;
							border-radius: 50%;
							width: 15px;
							height: 15px;
							text-align: center;
							background: var(--interactive-muted);
							font-weight: 600;
							cursor: pointer;
							color: var(--background-secondary-alt);
							position: absolute;
							bottom: calc(var(--channelTabs-tabHeight) / 2 - 2px);
						}
						.channelTabs-newTab:hover {
							background: var(--interactive-normal);
						}
						.channelTabs-tabIcon {
							height: var(--channelTabs-tabHeight);
							display: inline-block;
							border-radius: 40%;
							position: absolute;
						}
						.channelTabs-tabIcon ~ .channelTabs-tabName {
							margin-left: calc(var(--channelTabs-tabHeight) + 7px);
							width: calc(var(--channelTabs-tabWidth) - var(--channelTabs-tabHeight) - 12px);
						}
						
						.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected),
						.channelTabs-tab.channelTabs-mention:not(.channelTabs-selected) {
							color: var(--interactive-hover);
						}
						.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected):hover,
						.channelTabs-tab.channelTabs-mention:not(.channelTabs-selected):hover {
							color: var(--interactive-active);
						}
						.channelTabs-mentionBadge {
							background-color: rgb(240, 71, 71);
						}
						.channelTabs-unreadBadge {
							background-color: rgb(114, 137, 218);
						}
						.channelTabs-mentionBadge,
						.channelTabs-unreadBadge {
							display: inline-block;
							border-radius: 8px;
							padding-left: 4px;
							padding-right: 4px;
							margin-left: 3px;
							min-width: 8px;
							width: fit-content;
							height: 16px;
							font-size: 12px;
							line-height: 16px;
							font-weight: 600;
							text-align: center;
							color: #fff;
						}
						.channelTabs-tab.channelTabs-selected .channelTabs-mentionBadge,
						.channelTabs-tab.channelTabs-selected .channelTabs-unreadBadge {
    					display: none;
						}
						.channelTabs-tab .channelTabs-mentionBadge,
						.channelTabs-tab .channelTabs-unreadBadge {
							position: inherit !important;
							bottom: var(--channelTabs-tabHeight) !important;
							right: 16px !important;
							float: right !important;
						}
						.channelTabs-fav .channelTabs-mentionBadge,
						.channelTabs-fav .channelTabs-unreadBadge {
							vertical-align: bottom;
						}
						.channelTabs-fav .channelTabs-noMention,
						.channelTabs-fav .channelTabs-noUnread {
							background-color: var(--background-primary);
							color: var(--text-muted);
						}
						
						.channelTabs-favContainer {
							min-height: calc(var(--channelTabs-favHeight) + 10px);
							position: relative;
						}
						.channelTabs-fav {
							position: relative;
							display: inline-block;
							font-size: calc(var(--channelTabs-favHeight) - 2px);
							color: var(--interactive-normal);
							padding: 6px;
							margin-left: 5px;
							border-radius: 4px;
						}
						.channelTabs-fav:hover {
							background-color: var(--background-secondary-alt);
						}
						.channelTabs-favIcon {
							height: var(--channelTabs-favHeight);
							display: inline-block;
							border-radius: 40%;
							position: absolute;
						}
						.channelTabs-favIcon ~ .channelTabs-favName {
							margin-left: calc(var(--channelTabs-favHeight) + 3px);
						}
						
						.channelTabs-noFavNotice {
							color: var(--text-muted);
							font-size: calc(var(--channelTabs-favHeight) - 5px);
							position: absolute;
							padding: 5px;
						}
						
						/* MAC FIX */
						/* first tab/fav in the tab/fav-bar, depends whether tab bar is enabled */
						.${DiscordClassModules.Titlebar.typeMacOS.replace(/ /g, ".")} ~ div #channelTabs-container > :first-child > :first-child {
							margin-left: 72px;
						}
						/* remove top margin of guild list, not necessary anymore */
						.platform-osx .wrapper-1Rf91z {
							margin-top: 0;
						}
						.platform-osx .scroller-2TZvBN {
							padding-top: 12px;
						}
						/* make first bar of channeltabs draggable */
						.${DiscordClassModules.Titlebar.typeMacOS.replace(/ /g, ".")} ~ div #channelTabs-container > :first-child {
							-webkit-app-region: drag;
						}
					`);
					patches = [];
					this.loadSettings();
					if(this.settings.tabs.length == 0) this.settings.tabs = [{
						name: getCurrentName(),
						url: location.pathname,
						selected: true,
						iconUrl: getCurrentIconUrl()
					}];
					this.promises = {state:{cancelled: false}, cancel(){this.state.cancelled = true;}};
					this.saveSettings = this.saveSettings.bind(this);
					this.keybindHandler = this.keybindHandler.bind(this);
					this.onSwitch();
					this.patchAppView(this.promises.state);
					this.patchDMContextMenu();
					this.patchGroupContextMenu();
					this.patchGuildIconContextMenu();
					this.patchTextChannelContextMenu();
					if(this.settings.reopenLastChannel){
						switching = true;
						NavigationUtils.transitionTo((this.settings.tabs.find(tab=>tab.selected) || this.settings.tabs[0]).url);
						switching = false;
					}
					document.addEventListener("keydown", this.keybindHandler);
				}
				
				onStop(){
					PluginUtilities.removeStyle("channelTabs-style");
					document.removeEventListener("keydown", this.keybindHandler);
					Patcher.unpatchAll();
					this.promises.cancel();
					patches.forEach(patch=>patch());
				}
				
				onSwitch(){
					if(switching) return;
					if(TopBarRef.current){
						TopBarRef.current.setState({
							tabs: TopBarRef.current.state.tabs.map(tab => {
								if(tab.selected){
									const channelId = SelectedChannelStore.getChannelId();
									return {
										name: getCurrentName(),
										url: location.pathname,
										selected: true,
										iconUrl: getCurrentIconUrl(),
										channelId
									};
								}else{
									return Object.assign({}, tab);
								}
							})
						}, this.saveSettings);
					}else if(!this.settings.reopenLastChannel){
						const channelId = SelectedChannelStore.getChannelId();
						this.settings.tabs[this.settings.tabs.findIndex(tab=>tab.selected)] = {
							name: getCurrentName(),
							url: location.pathname,
							selected: true,
							iconUrl: getCurrentIconUrl(),
							channelId
						};
					}
				}
				
				async patchAppView(promiseState){
					const AppView = await ReactComponents.getComponent("Shakeable", ".app-2rEoOp");
					if(promiseState.cancelled) return;
					Patcher.after(AppView.component.prototype, "render", (thisObject, _, returnValue) => {
						returnValue.props.children = [
							React.createElement(TopBar, {
								showTabBar: this.settings.showTabBar,
								showFavBar: this.settings.showFavBar,
								showTabUnreadBadges: this.settings.showTabUnreadBadges,
								showFavUnreadBadges: this.settings.showFavUnreadBadges,
								tabs: this.settings.tabs,
								favs: this.settings.favs,
								ref: TopBarRef,
								plugin: this
							}),
							returnValue.props.children
						].flat();
					});
					AppView.forceUpdateAll();
					patches.push(()=>AppView.forceUpdateAll());
				}
				
				patchGuildIconContextMenu(){
					const GuildContextMenu = WebpackModules.find(m => m.default && m.default.displayName === "GuildContextMenu" && m.default.name === "");
					Patcher.after(GuildContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId(props.guild.id));
						returnValue.props.children.push(DCM.buildMenuChildren([{
							type: "group",
							items: [
								{
									type: "submenu",
									label: "ChannelTabs",
									items: this.mergeItems([
										{
											label: "Open channel in new tab",
											action: ()=>TopBarRef.current && TopBarRef.current.saveChannel(props.guild.id, channel.id, "#" + channel.name, props.guild.getIconURL() || "")
										},
										{
											label: "Save channel as bookmark",
											action: ()=>TopBarRef.current && TopBarRef.current.addToFavs("#" + channel.name, props.guild.getIconURL() || "", `/channels/${props.guild.id}/${channel.id}`, channel.id)
										}],
										[{
											label: "Save guild as bookmark",
											action: ()=>TopBarRef.current && TopBarRef.current.addToFavs(props.guild.name, props.guild.getIconURL() || "", `/channels/${props.guild.id}`, undefined, props.guild.id)
										}]
									)
								}
							]
						}]))
					});
				}
				
				patchTextChannelContextMenu(){
					const [, , TextChannelContextMenu] = WebpackModules.getModules(m => m.default && m.default.displayName === "ChannelListTextChannelContextMenu");
					Patcher.after(TextChannelContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						returnValue.props.children.push(DCM.buildMenuChildren([{
							type: "group",
							items: [
								{
									type: "submenu",
									label: "ChannelTabs",
									items: this.mergeItems([
										{
											label: "Open in new tab",
											action: ()=>TopBarRef.current && TopBarRef.current.saveChannel(props.guild.id, props.channel.id, "#" + props.channel.name, props.guild.getIconURL() || "")
										}],
										[{
											label: "Save bookmark",
											action: ()=>TopBarRef.current && TopBarRef.current.addToFavs("#" + props.channel.name, props.guild.getIconURL() || "", `/channels/${props.guild.id}/${props.channel.id}`, props.channel.id)
										}]
									)
								}
							]
						}]))
					});
				}
				
				patchDMContextMenu(){
					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'DMUserContextMenu');
					Patcher.after(DMContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						if(!returnValue) return;
						returnValue.props.children.props.children.push(DCM.buildMenuChildren([{
							type: "group",
							items: [
								{
									type: "submenu",
									label: "ChannelTabs",
									items: this.mergeItems(
										[{
											label: "Open in new tab",
											action: ()=>TopBarRef.current && TopBarRef.current.saveChannel(props.channel.guild_id, props.channel.id, "@" + (props.channel.name || props.user.username), props.user.avatarURL)
										}],
										[{
											label: "Save bookmark",
											action: ()=>TopBarRef.current && TopBarRef.current.addToFavs("@" + (props.channel.name || props.user.username), props.user.avatarURL, `/channels/@me/${props.channel.id}`, props.channel.id)
										}]
									)
								}
							]
						}]))
					});
				}
				
				patchGroupContextMenu(){
					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'GroupDMContextMenu');
					Patcher.after(DMContextMenu, "default", (thisObject, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						if(!returnValue) return;
						returnValue.props.children.push(DCM.buildMenuChildren([{
							type: "group",
							items: [
								{
									type: "submenu",
									label: "ChannelTabs",
									items: this.mergeItems(
										[{
											label: "Open in new tab",
											action: ()=>TopBarRef.current && TopBarRef.current.saveChannel(props.channel.guild_id, props.channel.id, "@" + (props.channel.name || props.channel.rawRecipients.map(u=>u.username).join(", ")), ""/*TODO*/)
										}],
										[{
											label: "Save bookmark",
											action: ()=>TopBarRef.current && TopBarRef.current.addToFavs("@" + (props.channel.name || props.channel.rawRecipients.map(u=>u.username).join(", ")), ""/*TODO*/, `/channels/@me/${props.channel.id}`, props.channel.id)
										}]
									)
								}
							]
						}]))
					});
				}
				
				mergeItems(itemsTab, itemsFav){
					const out = [];
					if(this.settings.showTabBar) out.push(...itemsTab);
					if(this.settings.showFavBar) out.push(...itemsFav);
					return out;
				}
				
				keybindHandler(e){
					const keybinds = [
						{altKey: false, ctrlKey: true, shiftKey: false, keyCode: 87 /*w*/, action: this.closeCurrentTab},
						{altKey: false, ctrlKey: true, shiftKey: false, keyCode: 33 /*pg_up*/, action: this.previousTab},
						{altKey: false, ctrlKey: true, shiftKey: false, keyCode: 34 /*pg_down*/, action: this.nextTab}
					];
					keybinds.forEach(keybind => {
						if(e.altKey === keybind.altKey && e.ctrlKey === keybind.ctrlKey && e.shiftKey === keybind.shiftKey && e.keyCode === keybind.keyCode) keybind.action();
					})
				}
				
				nextTab(){
					if(TopBarRef.current) TopBarRef.current.switchToTab((TopBarRef.current.state.selectedTabIndex + 1) % TopBarRef.current.state.tabs.length);
				}
				previousTab(){
					if(TopBarRef.current) TopBarRef.current.switchToTab((TopBarRef.current.state.selectedTabIndex - 1 + TopBarRef.current.state.tabs.length) % TopBarRef.current.state.tabs.length);
				}
				closeCurrentTab(){
					if(TopBarRef.current) TopBarRef.current.closeTab(TopBarRef.current.state.selectedTabIndex);
				}
				
				get defaultVariables(){
					return {
						tabs: [],
						favs: [],
						showTabBar: true,
						showFavBar: true,
						reopenLastChannel: false,
						showTabUnreadBadges: true,
						showFavUnreadBadges: true
					};
				}
				
				loadSettings(){
					this.settings = PluginUtilities.loadSettings(this.getName(), this.defaultVariables);
					this.settings.favs = this.settings.favs.map(fav => {
						if(fav.channelId === undefined){
							const match = fav.url.match(/^\/channels\/[^\/]+\/(\d+)$/);
							if(match) return Object.assign(fav, {channelId: match[1]});
						}
						return fav;
					});
					this.saveSettings();
				}
				saveSettings(){
					if(TopBarRef.current){
						this.settings.tabs = TopBarRef.current.state.tabs;
						this.settings.favs = TopBarRef.current.state.favs;
					}
					PluginUtilities.saveSettings(this.getName(), this.settings);
				}
				
				getSettingsPanel(){
					const panel = document.createElement("div");
					panel.className = "form";
					panel.style = "width:100%;";
					new Settings.SettingGroup(this.getName(), {shown:true}).appendTo(panel)
							.append(new Settings.Switch("Show tab bar", "Allows you to have multiple tabs like in a web browser", this.settings.showTabBar, checked=>{
								this.settings.showTabBar = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showTabBar: checked
								});
								this.saveSettings();
							}))
							.append(new Settings.Switch("Show fav bar", "Allows you to add bookmarks by right clicking a tab or the fav bar", this.settings.showFavBar, checked=>{
								this.settings.showFavBar = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showFavBar: checked
								});
								this.saveSettings();
							}))
							.append(new Settings.Switch("Reopen last channel", "When starting the plugin (or discord) the channel will be selected again instead of the friends page", this.settings.reopenLastChannel, checked=>{
								this.settings.reopenLastChannel = checked;
								this.saveSettings();
							}))
							.append(new Settings.Switch("Show unread badges on tabs", "Adds badges to tabs showing how many unread messages and mentions there are in a channel", this.settings.showTabUnreadBadges, checked=>{
								this.settings.showTabUnreadBadges = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showTabUnreadBadges: checked
								});
								this.saveSettings();
							}))
							.append(new Settings.Switch("Show unread badges on bookmarks", "Adds badges to bookmarks showing how many unread messages and mentions there are in a channel", this.settings.showFavUnreadBadges, checked=>{
								this.settings.showFavUnreadBadges = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showFavUnreadBadges: checked
								});
								this.saveSettings();
							}));
					return panel;
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
