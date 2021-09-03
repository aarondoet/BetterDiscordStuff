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
				},
				{
					name: "CarJem Generations",
					discord_id: "519397452944769025",
					github_username: "CarJem",
					twitter_username: "carter5467_99"
				}
			],
			version: "2.5.6",
			description: "Allows you to have multiple tabs and bookmark channels",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/ChannelTabs/ChannelTabs.plugin.js"
		},
		changelog: [
			{
				"title": "NEW",
				"type": "added",
				"items": [
					"TypingIndicator Intergration",
					"Compact & Cozy Modes",
					"Tabs/Favs User Status Indicators",
					"Toolbar Quick Settings",
					"Favorite Bar Groups",
					"Privacy Mode",
					"Dragging Items"
				]
			},
			{
				"title": "Added",
				"type": "added",
				"items": [
					"More Control Over the Badge Visibility",
					"Always Focus when Opening in New Tab Option",
					"Multi-User Support",
					
				]
			},
			{
				"title": "Fixed",
				"type": "fixed",
				"items": [
					"Guild Context Menus not Working",
					"Minor Naming Inconsistencies",
					"**NEW: Fixed PFPs for DMs and group DMs**"
				]
			}
		]
	};
	
	return !global.ZeresPluginLibrary ? class {
		constructor(){ this._config = config; }
		getName(){ return config.info.name; }
		getAuthor(){ return config.info.authors.map(a => a.name).join(", "); }
		getDescription(){ return config.info.description + " **Install [ZeresPluginLibrary](https://betterdiscord.app/Download?id=9) and restart discord to use this plugin!**"; }
		getVersion(){ return config.info.version; }
		load(){
			BdApi.showConfirmationModal("Library plugin is needed", 
				[`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
					confirmText: "Download",
					cancelText: "Cancel",
					onConfirm: () => {
						require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
							if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
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

			//#region Module/Variable Definitions

			const { InternalUtilities, WebpackModules, PluginUtilities, DiscordModules, DiscordClassModules, Patcher, DCM, ReactComponents, Settings, Utilities, Modals } = Api;
			const { React, ReactDOM, DiscordConstants, NavigationUtils, SelectedChannelStore, SelectedGuildStore, ChannelStore, GuildStore, UserStore, UserTypingStore, DiscordAPI } = DiscordModules;
			const Textbox = WebpackModules.find(m => m.defaultProps && m.defaultProps.type == "text");
			const UnreadStateStore = WebpackModules.getByProps("getMentionCount", "hasUnread");
			const Flux = WebpackModules.getByProps("connectStores");
			const MutedStore = WebpackModules.getByProps("isMuted", "isChannelMuted");
			const PermissionUtils  = WebpackModules.getByProps("can", "canManageUser");
			const Permissions = DiscordModules.DiscordConstants.Permissions;
			const Spinner = WebpackModules.getByDisplayName("Spinner");
			const Tooltip = WebpackModules.getByDisplayName("Tooltip");
			const UserStatusStore = DiscordModules.UserStatusStore;

			const DefaultUserIconGrey = "https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png";
			const DefaultUserIconGreen = "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png";
			const DefaultUserIconBlue = "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png";
			const DefaultUserIconRed = "https://discordapp.com/assets/1cbd08c76f8af6dddce02c5138971129.png";
			const DefaultUserIconYellow = "https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png";

			const SettingsMenuIcon = `<svg class="channelTabs-settingsIcon" aria-hidden="false" viewBox="0 0 80 80">
			<rect fill="var(--interactive-normal)" x="20" y="15" width="50" height="10"></rect>
			<rect fill="var(--interactive-normal)" x="20" y="35" width="50" height="10"></rect>
			<rect fill="var(--interactive-normal)" x="20" y="55" width="50" height="10"></rect>
			</svg>`;

			var switching = false;
			var patches = [];

			var currentTabDragIndex = -1;
			var currentTabDragDestinationIndex = -1;

			var currentFavDragIndex = -1;
			var currentFavDragDestinationIndex = -1;

			var currentGroupDragIndex = -1;
			var currentGroupDragDestinationIndex = -1;

			var currentGroupOpened = -1;

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
			};

			//#endregion
			
			//#region Context Menu Constructors

			function CreateGuildContextMenuChildren(instance, props, channel)
			{
				return DCM.buildMenuChildren([{
					type: "group",
					items: [
						{
							type: "submenu",
							label: "ChannelTabs",
							items: instance.mergeItems([
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
				}]);
			};

			function CreateTextChannelContextMenuChildren(instance, props)
			{
				return DCM.buildMenuChildren([{
					type: "group",
					items: [
						{
							type: "submenu",
							label: "ChannelTabs",
							items: instance.mergeItems([
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
				}]);
			};

			function CreateDMContextMenuChildren(instance, props)
			{
				return DCM.buildMenuChildren([{
					type: "group",
					items: [
						{
							type: "submenu",
							label: "ChannelTabs",
							items: instance.mergeItems(
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
				}])
			};

			function CreateGroupContextMenuChildren(instance, props)
			{
				return DCM.buildMenuChildren([{
					type: "group",
					items: [
						{
							type: "submenu",
							label: "ChannelTabs",
							items: instance.mergeItems(
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
				}])
			};

			function CreateTabContextMenu(props,e)
			{
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
											type : "separator"
										},
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
									include: props.tabCount > 1,
									values: [
										{
											type : "separator"
										},
										{
											type: "submenu",
											label: "Close...",
											id: "closeMenu",
											danger: true,
											action: ()=>props.closeTab(props.tabIndex, "single"),
											items: mergeLists(
												{
													values: [
														{
															label: "Close tab",
															action: ()=>props.closeTab(props.tabIndex, "single"),
															danger: true
														},
														{
															label: "Close all other tabs",
															action: ()=>props.closeTab(props.tabIndex, "other"),
															danger: true
														}
													]
												},
												{
													include: props.tabIndex != props.tabCount - 1,
													values: [
														{
															label: "Close all tabs to right",
															action: ()=>props.closeTab(props.tabIndex, "right"),
															danger: true
														}
													]
												},
												{
													include: props.tabIndex != 0,
													values: [
														{
															label: "Close all tabs to left",
															action: ()=>props.closeTab(props.tabIndex, "left"),
															danger: true
														}
													]
												}
											)
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
				);
			};

			function CreateFavContextMenu(props,e)
			{
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
										},
										{
											type : "separator"
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
										},
										{
											type : "separator"
										}
									]
								},
								{
									values: [
										{
											label: "Move To...",
											id: "groupMoveTo",
											type: "submenu",
											items: mergeLists(
												{
													values: [
														{
															label: "Favorites Bar",
															id: "entryNone",
															danger: true,
															action: () => props.moveToFavGroup(props.favIndex, -1)
														},
														{
															type: "separator"
														}
													]
												},
												{
													values: FavMoveToGroupList({favIndex: props.favIndex, ...props})
												}
											)
										},
										{
											type : "separator"
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
				);
			};

			function CreateFavGroupContextMenu(props,e)
			{
				DCM.openContextMenu(
					e,
					DCM.buildMenu([
						{
							type: "group",
							items: mergeLists(
								{
									values: [
										{
											label: "Open all",
											action: ()=>props.openFavGroupInNewTab(props.favGroup.groupId)
										},
										{
											type : "separator"
										}
									]
								},
								{
									include: props.groupCount > 1,
									values: [
										{
											label: "Move left",
											action: ()=>props.moveFavGroup(props.groupIndex, (props.groupIndex + props.groupCount - 1) % props.groupCount)
										},
										{
											label: "Move right",
											action: ()=>props.moveFavGroup(props.groupIndex, (props.groupIndex + 1) % props.groupCount)
										},
										{
											type : "separator"
										}
									]
								},
								{
									values: [
										{
											label: "Rename",
											id: "renameGroup",
											action: ()=>props.renameFavGroup(props.favGroup.name, props.favGroup.groupId)
										},
										{
											type : "separator"
										},
										{
											label: "Delete",
											id: "deleteGroup",
											action: ()=>props.removeFavGroup(props.favGroup.groupId),
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
				);
			};

			function CreateFavBarContextMenu(props,e) 
			{
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
									label: "Create a new group...",
									action: props.addFavGroup
								},
								{
									type: "separator"
								},
								{
									label: "Hide Favorites",
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
				);
			};
			
			function CreateSettingsContextMenu(instance, e)
			{
				DCM.openContextMenu(
					e,
					DCM.buildMenu([
						{
							type: "group",
							items: mergeLists(
								{
									values: [
										{
											label: config.info.name,
											subtext: "Version " + config.info.version,
											action: () => {
												Modals.showChangelogModal(config.info.name, config.info.version, config.changelog);
											}
										},
										{
											type: "separator"
										},
										{											
											id: "shortcutLabel",
											disabled: true,
											label: "Shortcuts:"
										},
										{											
											id: "shortcutLabelKeys",
											disabled: true,
											render: () => {
												return React.createElement("div", {style: { "color": "var(--text-muted)", "padding": "8px", "font-size": "12px",  "white-space": "pre-wrap" }},
												`Ctrl + W - Close Current Tab\n` +
												`Ctrl + PgUp - Navigate to Left Tab\n` +
												`Ctrl + PgDn - Navigate to Right Tab\n`);
											}
										},
										{
											type: "separator"
										},
										{											
											label: "Settings:",
											id: "settingHeader",
											disabled: true
										},
										{
											type: "separator"
										},
										{
											type: "submenu",
											label: "Startup",
											items: [
												{
													label: "Reopen Last Channel on Startup",
													type: "toggle",
													id: "reopenLastChannel",
													checked: () => TopBarRef.current.state.reopenLastChannel,
													action: () => {
														instance.setState({
															reopenLastChannel: !instance.state.reopenLastChannel
														}, ()=>{
															instance.props.plugin.settings.reopenLastChannel = !instance.props.plugin.settings.reopenLastChannel;
															instance.props.plugin.saveSettings();
														});
													}
												}
											]
										},
										{
											type: "submenu",
											label: "Appearance",
											items: [
												{
													label: "Use Compact Appearance",
													type: "toggle",
													id: "useCompactLook",
													checked: () => TopBarRef.current.state.compactStyle,
													action: () => {
														instance.setState({
															compactStyle: !instance.state.compactStyle
														}, ()=>{
															instance.props.plugin.settings.compactStyle = !instance.props.plugin.settings.compactStyle;
															instance.props.plugin.removeStyle();
															instance.props.plugin.applyStyle();
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Privacy Mode",
													type: "toggle",
													id: "privacyMode",
													checked: () => TopBarRef.current.state.privacyMode,
													action: () => {
														instance.setState({
															privacyMode: !instance.state.privacyMode
														}, ()=>{
															instance.props.plugin.settings.privacyMode = !instance.props.plugin.settings.privacyMode;
															instance.props.plugin.removeStyle();
															instance.props.plugin.applyStyle();
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													type: "separator"
												},
												{
													label: "Show Tab Bar",
													type: "toggle",
													id: "showTabBar",
													danger: true,
													checked: () => TopBarRef.current.state.showTabBar,
													action: () => {
														instance.setState({
															showTabBar: !instance.state.showTabBar
														}, ()=>{
															instance.props.plugin.settings.showTabBar = !instance.props.plugin.settings.showTabBar;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Fav Bar",
													type: "toggle",
													id: "showFavBar",
													danger: true,
													checked: () => TopBarRef.current.state.showFavBar,
													action: () => {
														instance.setState({
															showFavBar: !instance.state.showFavBar
														}, ()=>{
															instance.props.plugin.settings.showFavBar = !instance.props.plugin.settings.showFavBar;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Quick Settings",
													type: "toggle",
													id: "showQuickSettings",
													danger: true,
													checked: () => TopBarRef.current.state.showQuickSettings,
													action: () => {
														instance.setState({
															showQuickSettings: !instance.state.showQuickSettings
														}, ()=>{
															instance.props.plugin.settings.showQuickSettings = !instance.props.plugin.settings.showQuickSettings;
															instance.props.plugin.saveSettings();
														});
													}
												}		
											]
										},
										{
											type: "submenu",
											label: "Behavior",
											items: [
												{
													label: "Always Focus New Tabs",
													type: "toggle",
													id: "alwaysFocusNewTabs",
													checked: () => TopBarRef.current.state.alwaysFocusNewTabs,
													action: () => {
														instance.setState({
															alwaysFocusNewTabs: !instance.state.alwaysFocusNewTabs
														}, ()=>{
															instance.props.plugin.settings.alwaysFocusNewTabs = !instance.props.plugin.settings.alwaysFocusNewTabs;
															instance.props.plugin.saveSettings();
														});
													}
												}
											]
										},
										{
											type: "submenu",
											label: "Badge Visibility",
											items: [
												{
													type: "separator",
													id: "header1_1"
												},
												{
													label: "Favs:",
													id: "header1_2",
													disabled: true
												},
												{
													type: "separator",
													id: "header1_3"
												},
												{
													label: "Show Mentions",
													type: "toggle",
													id: "favs_Mentions",
													checked: () => TopBarRef.current.state.showFavMentionBadges,
													action: () => {
														instance.setState({
															showFavMentionBadges: !instance.state.showFavMentionBadges
														}, ()=>{
															instance.props.plugin.settings.showFavMentionBadges = !instance.props.plugin.settings.showFavMentionBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Unreads",
													type: "toggle",
													id: "favs_Unreads",
													checked: () => TopBarRef.current.state.showFavUnreadBadges,
													action: () => {
														instance.setState({
															showFavUnreadBadges: !instance.state.showFavUnreadBadges
														}, ()=>{
															instance.props.plugin.settings.showFavUnreadBadges = !instance.props.plugin.settings.showFavUnreadBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Typing",
													type: "toggle",
													id: "favs_Typing",
													checked: () => TopBarRef.current.state.showFavTypingBadge,
													action: () => {
														instance.setState({
															showFavTypingBadge: !instance.state.showFavTypingBadge
														}, ()=>{
															instance.props.plugin.settings.showFavTypingBadge = !instance.props.plugin.settings.showFavTypingBadge;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Empty Mentions/Unreads",
													type: "toggle",
													id: "favs_Empty",
													checked: () => TopBarRef.current.state.showEmptyFavBadges,
													action: () => {
														instance.setState({
															showEmptyFavBadges: !instance.state.showEmptyFavBadges
														}, ()=>{
															instance.props.plugin.settings.showEmptyFavBadges = !instance.props.plugin.settings.showEmptyFavBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													type: "separator",
													id: "header4_1"
												},
												{
													label: "Fav Groups:",
													id: "header4_2",
													disabled: true
												},
												{
													type: "separator",
													id: "header4_3"
												},
												{
													label: "Show Mentions",
													type: "toggle",
													id: "favGroups_Mentions",
													checked: () => TopBarRef.current.state.showFavGroupMentionBadges,
													action: () => {
														instance.setState({
															showFavGroupMentionBadges: !instance.state.showFavGroupMentionBadges
														}, ()=>{
															instance.props.plugin.settings.showFavGroupMentionBadges = !instance.props.plugin.settings.showFavGroupMentionBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Unreads",
													type: "toggle",
													id: "favGroups_Unreads",
													checked: () => TopBarRef.current.state.showFavGroupUnreadBadges,
													action: () => {
														instance.setState({
															showFavGroupUnreadBadges: !instance.state.showFavGroupUnreadBadges
														}, ()=>{
															instance.props.plugin.settings.showFavGroupUnreadBadges = !instance.props.plugin.settings.showFavGroupUnreadBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Typing",
													type: "toggle",
													id: "favGroups_Typing",
													checked: () => TopBarRef.current.state.showFavGroupTypingBadge,
													action: () => {
														instance.setState({
															showFavGroupTypingBadge: !instance.state.showFavGroupTypingBadge
														}, ()=>{
															instance.props.plugin.settings.showFavGroupTypingBadge = !instance.props.plugin.settings.showFavGroupTypingBadge;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Empty Mentions/Unreads",
													type: "toggle",
													id: "favGroups_Empty",
													checked: () => TopBarRef.current.state.showEmptyFavGroupBadges,
													action: () => {
														instance.setState({
															showEmptyFavGroupBadges: !instance.state.showEmptyFavGroupBadges
														}, ()=>{
															instance.props.plugin.settings.showEmptyFavGroupBadges = !instance.props.plugin.settings.showEmptyFavGroupBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													type: "separator",
													id: "header2_1"
												},
												{
													label: "Tabs:",
													id: "header2_2",
													disabled: true
												},
												{
													type: "separator",
													id: "header2_3"
												},
												{
													label: "Show Mentions",
													type: "toggle",
													id: "tabs_Mentions",
													checked: () => TopBarRef.current.state.showTabMentionBadges,
													action: () => {
														instance.setState({
															showTabMentionBadges: !instance.state.showTabMentionBadges
														}, ()=>{
															instance.props.plugin.settings.showTabMentionBadges = !instance.props.plugin.settings.showTabMentionBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Unreads",
													type: "toggle",
													id: "tabs_Unreads",
													checked: () => TopBarRef.current.state.showTabUnreadBadges,
													action: () => {
														instance.setState({
															showTabUnreadBadges: !instance.state.showTabUnreadBadges
														}, ()=>{
															instance.props.plugin.settings.showTabUnreadBadges = !instance.props.plugin.settings.showTabUnreadBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Typing",
													type: "toggle",
													id: "tabs_Typing",
													checked: () => TopBarRef.current.state.showTabTypingBadge,
													action: () => {
														instance.setState({
															showTabTypingBadge: !instance.state.showTabTypingBadge
														}, ()=>{
															instance.props.plugin.settings.showTabTypingBadge = !instance.props.plugin.settings.showTabTypingBadge;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Empty Mentions/Unreads",
													type: "toggle",
													id: "tabs_Empty",
													checked: () => TopBarRef.current.state.showEmptyTabBadges,
													action: () => {
														instance.setState({
															showEmptyTabBadges: !instance.state.showEmptyTabBadges
														}, ()=>{
															instance.props.plugin.settings.showEmptyTabBadges = !instance.props.plugin.settings.showEmptyTabBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													type: "separator",
													id: "header3_1"
												},
												{
													label: "Active Tabs:",
													id: "header3_2",
													disabled: true
												},
												{
													type: "separator",
													id: "header3_3"
												},
												{
													label: "Show Mentions",
													type: "toggle",
													id: "activeTabs_Mentions",
													checked: () => TopBarRef.current.state.showActiveTabMentionBadges,
													action: () => {
														instance.setState({
															showActiveTabMentionBadges: !instance.state.showActiveTabMentionBadges
														}, ()=>{
															instance.props.plugin.settings.showActiveTabMentionBadges = !instance.props.plugin.settings.showActiveTabMentionBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Unreads",
													type: "toggle",
													id: "activeTabs_Unreads",
													checked: () => TopBarRef.current.state.showActiveTabUnreadBadges,
													action: () => {
														instance.setState({
															showActiveTabUnreadBadges: !instance.state.showActiveTabUnreadBadges
														}, ()=>{
															instance.props.plugin.settings.showActiveTabUnreadBadges = !instance.props.plugin.settings.showActiveTabUnreadBadges;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Typing",
													type: "toggle",
													id: "activeTabs_Typing",
													checked: () => TopBarRef.current.state.showActiveTabTypingBadge,
													action: () => {
														instance.setState({
															showActiveTabTypingBadge: !instance.state.showActiveTabTypingBadge
														}, ()=>{
															instance.props.plugin.settings.showActiveTabTypingBadge = !instance.props.plugin.settings.showActiveTabTypingBadge;
															instance.props.plugin.saveSettings();
														});
													}
												},
												{
													label: "Show Empty Mentions/Unreads",
													type: "toggle",
													id: "activeTabs_Empty",
													checked: () => TopBarRef.current.state.showEmptyActiveTabBadges,
													action: () => {
														instance.setState({
															showEmptyActiveTabBadges: !instance.state.showEmptyActiveTabBadges
														}, ()=>{
															instance.props.plugin.settings.showEmptyActiveTabBadges = !instance.props.plugin.settings.showEmptyActiveTabBadges;
															instance.props.plugin.saveSettings();
														});
													}
												}
											]
										},

								
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
			};

			//#endregion

			//#region Global Common Functions

			const closeAllDropdowns = () => 
			{
				var dropdowns = document.getElementsByClassName("channelTabs-favGroup-content");
				var i;
				for (i = 0; i < dropdowns.length; i++) {
				  var openDropdown = dropdowns[i];
				  if (openDropdown.classList.contains('channelTabs-favGroupShow')) {
					openDropdown.classList.remove('channelTabs-favGroupShow');
				  }
				}
				currentGroupOpened = -1;
			};

			const mergeLists = (...items)=>
			{
				return items.filter(item => item.include===undefined||item.include).flatMap(item => item.values);
			};

			const getGuildChannels = (...guildIds)=>
			{
				const channels = ChannelStore.getGuildChannels ? Object.values(ChannelStore.getGuildChannels()) : ChannelStore.getMutableGuildChannels ? Object.values(ChannelStore.getMutableGuildChannels()) : [];
				return channels.filter(c => guildIds.includes(c.guild_id) && c.type !== DiscordConstants.ChannelTypes.GUILD_VOICE && c.type !== DiscordConstants.ChannelTypes.GUILD_CATEGORY);
			};

			const updateFavEntry = (fav)=>
			{
				if(fav.guildId) 
				{
					const channelIds = getGuildChannels(fav.guildId).filter(channel=>(PermissionUtils.can(Permissions.VIEW_CHANNEL, channel)) && (!MutedStore.isChannelMuted(channel.guild_id, channel.id))).map(channel=>channel.id);
					return {
						unreadCount: channelIds.map(id=>UnreadStateStore.getUnreadCount(id)||UnreadStateStore.getMentionCount(id)||(UnreadStateStore.hasUnread(id)?1:0)).reduce((a,b)=>a+b, 0),
						unreadEstimated: channelIds.some(id=>UnreadStateStore.isEstimated(id)) || channelIds.some(id=>UnreadStateStore.getUnreadCount(id)===0&&UnreadStateStore.hasUnread(id)),
						hasUnread: channelIds.some(id=>UnreadStateStore.hasUnread(id)),
						mentionCount: channelIds.map(id=>UnreadStateStore.getMentionCount(id)||0).reduce((a,b)=>a+b, 0),
						selected: SelectedGuildStore.getGuildId()===fav.guildId,
						isTyping: isChannelTyping(fav.channelId),
						currentStatus: getCurrentUserStatus(fav.url)
					};
				}
				else 
				{
					return {
						unreadCount: UnreadStateStore.getUnreadCount(fav.channelId) || UnreadStateStore.getMentionCount(fav.channelId) || (UnreadStateStore.hasUnread(fav.channelId) ? 1 : 0),
						unreadEstimated: UnreadStateStore.isEstimated(fav.channelId) || (UnreadStateStore.hasUnread(fav.channelId) && UnreadStateStore.getUnreadCount(fav.channelId) === 0),
						hasUnread: UnreadStateStore.hasUnread(fav.channelId),
						mentionCount: UnreadStateStore.getMentionCount(fav.channelId),
						selected: SelectedChannelStore.getChannelId()===fav.channelId,
						isTyping: isChannelTyping(fav.channelId),
						currentStatus: getCurrentUserStatus(fav.url)
					};
				}
			};

			const getCurrentUserStatus = (pathname = location.pathname)=>
			{
				const cId = (pathname.match(/^\/channels\/(\d+|@me)\/(\d+)/) || [])[2];
				if(cId)
				{
					const channel = ChannelStore.getChannel(cId);
					if(channel?.guild_id)
					{
						return "none";
					}
					else if(channel?.isDM())
					{
						const user = UserStore.getUser(channel.getRecipientId());
						const status = UserStatusStore.getStatus(user.id);
						return status;
					}
					else if(channel?.isGroupDM())
					{
						return "none";
					}
				}
				return "none";
			};

			const getChannelTypingTooltipText = (userIds) =>
			{				
				if (userIds)
				{
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
					return text;
				}
				return "Someone is Typing...";

			};

			const getChannelTypingUsers = (channel_id) => 
			{
				const channel = ChannelStore.getChannel(channel_id);
				const selfId = UserStore.getCurrentUser().id;
				if (channel)
				{	
					const userIds = Object.keys(UserTypingStore.getTypingUsers(channel_id)).filter(uId => (uId !== selfId));
					const typingUsers = [...new Set(userIds)];
					return typingUsers;
				}
				return null;
			};	

			const isChannelTyping = (channel_id) => 
			{
				const channel = ChannelStore.getChannel(channel_id);
				const selfId = UserStore.getCurrentUser().id;
				if (channel)
				{	
					const userIds = Object.keys(UserTypingStore.getTypingUsers(channel_id)).filter(uId => (uId !== selfId));
					const typingUsers = [...new Set(userIds)];
					if (typingUsers) return typingUsers.length === 0 ? false : true;
				}
				return false;
			};	

			const isChannelDM = (channel_id) =>
			{
				return (()=>{const c=ChannelStore.getChannel(channel_id); return c && (c.isDM()||c.isGroupDM());})()
			};

			const getCurrentName = (pathname = location.pathname)=>
			{
				const cId = (pathname.match(/^\/channels\/(\d+|@me)\/(\d+)/) || [])[2];
				if(cId){
					const channel = ChannelStore.getChannel(cId);
					if(channel?.name) return (channel.guildId ? "@" : "#") + channel.name;
					else if(channel?.rawRecipients) return "@" + channel.rawRecipients.map(u=>u.username).join(", ");
					else return pathname;
				}else{
					if(pathname === "/channels/@me") return "Friends";
					else if(pathname.match(/^\/[a-z\-]+$/)) return pathname.substr(1).split("-").map(part => part.substr(0, 1).toUpperCase() + part.substr(1)).join(" ");
					else return pathname;
				}
			};	

			const getCurrentIconUrl = (pathname = location.pathname)=>
			{
				const cId = (pathname.match(/^\/channels\/(\d+|@me)\/(\d+)/) || [])[2];
				if(cId){
					const channel = ChannelStore.getChannel(cId);
					if(!channel) return "";
					if(channel.guild_id){
						const guild = GuildStore.getGuild(channel.guild_id);
						return guild.getIconURL() || DefaultUserIconBlue;
					}else if(channel.isDM()){
						const user = UserStore.getUser(channel.getRecipientId());
						return user.getAvatarURL();
					}else if(channel.isGroupDM()){
						if(channel.icon) return `https://cdn.discordapp.com/channel-icons/${channel.id}/${channel.icon}.webp`;
						else return DefaultUserIconGreen;
					}
				}
				return DefaultUserIconGrey;
			};

			//#endregion
			
			//#region Tab Definitions

			const GetTabStyles = (viewMode, item)=>
			{
				if (item === "unreadBadge") 
				{
					if (viewMode === "classic") return " channelTabs-classicBadgeAlignment";
					else if (viewMode === "alt") return " channelTabs-badgeAlignLeft";
				}
				else if (item === "mentionBadge")
				{
					if (viewMode === "classic") return " channelTabs-classicBadgeAlignment";
					else if (viewMode === "alt") return " channelTabs-badgeAlignRight";
				}
				else if (item === "typingBadge")
				{
					if (viewMode === "classic") return " channelTabs-classicBadgeAlignment";
					else if (viewMode === "alt") return " channelTabs-typingBadgeAlignment";
				}
				return "";
			};

			const TabIcon = props=>React.createElement(
				"img",
				{
					className: "channelTabs-tabIcon" 
					+ (props.currentStatus == "online" ? " channelTabs-onlineIcon" : "")
					+ (props.currentStatus == "idle" ? " channelTabs-idleIcon" : "")
					+ (props.currentStatus == "dnd" ? " channelTabs-doNotDisturbIcon" : "")
					+ (props.currentStatus == "offline" ? " channelTabs-offlineIcon" : "")
					+ (props.currentStatus == "none" ? " channelTabs-noneIcon" : ""),
					src: (props.iconUrl != null ? props.iconUrl : DefaultUserIconGrey)
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

			const TabUnreadBadge = props=>React.createElement("div", {
				className: "channelTabs-unreadBadge" + (!props.hasUnread ? " channelTabs-noUnread" : "") + GetTabStyles(props.viewMode, "unreadBadge")
			}, props.unreadCount + (props.unreadEstimated ? "+" : ""));

			const TabMentionBadge = props=>React.createElement("div", {
				className: "channelTabs-mentionBadge" + (props.mentionCount === 0 ? " channelTabs-noMention" : "") + GetTabStyles(props.viewMode, "mentionBadge")
			}, props.mentionCount);

			const TabTypingBadge = ({viewMode, isTyping, userIds})=>{
				if (isTyping === false) return null;
				const text = getChannelTypingTooltipText(userIds);
				return React.createElement(
					"div",
					{ 
						className: "channelTabs-TypingContainer" + GetTabStyles(viewMode, "typingBadge")
					},
					React.createElement(
						Tooltip,
						{
							text,
							position: "bottom"
						},
						tooltipProps => React.createElement(Spinner, {
							...tooltipProps,
							type: "pulsingEllipsis",
							className: `channelTabs-typingBadge`,
							animated: isTyping,
							style: {
								opacity: 1
							}
						})
					)
				);


			};

			const CozyTab = (props)=>{
				return React.createElement(
					"div",
					{},
					React.createElement(TabIcon, {iconUrl: props.iconUrl, currentStatus: props.currentStatus }),
					React.createElement(
						"div",
						{
							className: "channelTabs-gridContainer",
						},
						React.createElement(
						   "div",
						   {className: "channelTabs-gridItemBR"},
						   !(props.selected ? props.showActiveTabTypingBadge : props.showTabTypingBadge) ?  null : React.createElement(TabTypingBadge, {viewMode: "alt", isTyping: props.hasUsersTyping, userIds: getChannelTypingUsers(props.channelId)})
					   ),
					   React.createElement(
						"div",
						   {className: "channelTabs-gridItemTL"},
						   !(props.selected ? props.showActiveTabUnreadBadges : props.showTabUnreadBadges) ? null : !props.channelId || (ChannelStore.getChannel(props.channelId)?.isPrivate() ?? true) ? null : !(props.selected ? props.showEmptyActiveTabBadges : props.showEmptyTabBadges) && !props.hasUnread  ? null : React.createElement(TabUnreadBadge, {viewMode: "alt", unreadCount: props.unreadCount, unreadEstimated: props.unreadEstimated, hasUnread: props.hasUnread, mentionCount: props.mentionCount})
					   ),
					  React.createElement(
						"div",
						   {className: "channelTabs-gridItemTR"},
						   !(props.selected ? props.showActiveTabMentionBadges : props.showTabMentionBadges) ? null : !(props.selected ? props.showEmptyActiveTabBadges : props.showEmptyTabBadges) && (props.mentionCount === 0) ? null : React.createElement(TabMentionBadge, {viewMode: "alt", mentionCount: props.mentionCount})
					   ),
					   React.createElement("div", {className: "channelTabs-gridItemBL"})
					   ),
					React.createElement(TabName, {name: props.name})
				)
			};

			const CompactTab = (props)=>{
				return React.createElement(
					"div",
					{
						style: 
						{
							"margin-right": "8px"	
						}
					},
					React.createElement(TabIcon, {iconUrl: props.iconUrl, currentStatus: props.currentStatus}),
					React.createElement(TabName, {name: props.name}),
					!(props.selected ? props.showActiveTabTypingBadge : props.showTabTypingBadge) ? null : React.createElement(
					   React.Fragment,
					   {},
					   React.createElement(TabTypingBadge, {viewMode: "classic", isTyping: props.hasUsersTyping, userIds: getChannelTypingUsers(props.channelId)})
				   ),
				   !(props.selected ? props.showActiveTabUnreadBadges : props.showTabUnreadBadges) ? null : React.createElement(
					   React.Fragment,
					   {},
					   !props.channelId || (ChannelStore.getChannel(props.channelId)?.isPrivate() ?? true) ? null : !(props.selected ? props.showEmptyActiveTabBadges : props.showEmptyTabBadges) && !props.hasUnread  ? null : React.createElement(TabUnreadBadge, {viewMode: "classic", unreadCount: props.unreadCount, unreadEstimated: props.unreadEstimated, hasUnread: props.hasUnread, mentionCount: props.mentionCount})
				   ),
				   !(props.selected ? props.showActiveTabMentionBadges : props.showTabMentionBadges) ? null : React.createElement(
					   React.Fragment,
					   {},
					   !(props.selected ? props.showEmptyActiveTabBadges : props.showEmptyTabBadges) && (props.mentionCount === 0) ? null : React.createElement(TabMentionBadge, {viewMode: "classic", mentionCount: props.mentionCount})
				   )
				   )
			};

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
					onContextMenu: e=> {CreateTabContextMenu(props,e)},
					onMouseOver: e=> {
						if (currentTabDragIndex == props.tabIndex || currentTabDragIndex == -1) return;
						currentTabDragDestinationIndex = props.tabIndex;
					},
					
					onMouseDown: e => {
						let mouseMove = e2 => {
							if (Math.sqrt((e.pageX - e2.pageX)**2) > 20 || Math.sqrt((e.pageY - e2.pageY)**2) > 20) {
								currentTabDragIndex = props.tabIndex;
								document.removeEventListener("mousemove", mouseMove);
								document.removeEventListener("mouseup", mouseUp);
								let dragging = e3 => {
									if (currentTabDragIndex != currentTabDragDestinationIndex)
									{
										if (currentTabDragDestinationIndex != -1)
										{
											props.moveTab(currentTabDragIndex, currentTabDragDestinationIndex);
											currentTabDragDestinationIndex = currentTabDragDestinationIndex;
											currentTabDragIndex = currentTabDragDestinationIndex;
										}
									}
								};
								let releasing = e3 => {
									document.removeEventListener("mousemove", dragging);
									document.removeEventListener("mouseup", releasing);
									currentTabDragIndex = -1;
									currentTabDragDestinationIndex = -1;
								};
								document.addEventListener("mousemove", dragging);
								document.addEventListener("mouseup", releasing);
							}
						};
						let mouseUp = _ => {
							document.removeEventListener("mousemove", mouseMove);
							document.removeEventListener("mouseup", mouseUp);
						};
						document.addEventListener("mousemove", mouseMove);
						document.addEventListener("mouseup", mouseUp);
					},
				},
				
				props.compactStyle ? CompactTab(props) : CozyTab(props),
				React.createElement(TabClose, {tabCount: props.tabCount, closeTab: ()=>props.closeTab(props.tabIndex)})
			);	

			//#endregion
						
			//#region Fav Definitions

			const FavMoveToGroupList = props => {
				var groups = props.favGroups.map(

					(group, index) => {
		
						var entry = {
							label: group.name,
							id: "entry" + index,
							action: () => props.moveToFavGroup(props.favIndex, group.groupId)
						};

						return entry;
					}
				);
				return groups;
			}

			const FavIcon = props=>React.createElement(
				"img",
				{
					className: "channelTabs-favIcon"
					+ (props.currentStatus == "online" ? " channelTabs-onlineIcon" : "")
					+ (props.currentStatus == "idle" ? " channelTabs-idleIcon" : "")
					+ (props.currentStatus == "dnd" ? " channelTabs-doNotDisturbIcon" : "")
					+ (props.currentStatus == "offline" ? " channelTabs-offlineIcon" : "")
					+ (props.currentStatus == "none" ? " channelTabs-noneIcon" : ""),
					src: !props.iconUrl ? DefaultUserIconGrey :props.iconUrl
				}
			);

			const FavName = props=>React.createElement(
				"span",
				{
					className: "channelTabs-favName"
				},
				props.name
			);

			const FavUnreadBadge = props=>React.createElement("div", {
				className: "channelTabs-unreadBadge" + (!props.hasUnread ? " channelTabs-noUnread" : "")
			}, props.unreadCount + (props.unreadEstimated ? "+" : ""));

			const FavMentionBadge = props=>React.createElement("div", {
				className: "channelTabs-mentionBadge" + (props.mentionCount === 0 ? " channelTabs-noMention" : "")
			}, props.mentionCount);


			const FavTypingBadge = ({isTyping, userIds})=>{
				const text = getChannelTypingTooltipText(userIds);
				return React.createElement(
					Tooltip,
					{
						text,
						position: "bottom"
					},
					tooltipProps => React.createElement("div", {
						...tooltipProps,
						className: "channelTabs-typingBadge" + (!isTyping ? " channelTabs-noTyping" : "")
					}, React.createElement(Spinner, {
						type: "pulsingEllipsis",
						animated: (!isTyping ? false : true)
					}))
				)
			};

			const Fav = props=>React.createElement(
				"div",
				{
					className: "channelTabs-fav" 
									+ (props.channelId ? " channelTabs-channel" : props.guildId ? " channelTabs-guild" : "")
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
					onContextMenu: e=> {CreateFavContextMenu(props,e)},
					onMouseOver: e=> {
						if (currentFavDragIndex == props.favIndex || currentFavDragIndex == -1) return;
						currentFavDragDestinationIndex = props.favIndex;
					},					
					onMouseDown: e => {
						let mouseMove = e2 => {
							if (Math.sqrt((e.pageX - e2.pageX)**2) > 20 || Math.sqrt((e.pageY - e2.pageY)**2) > 20) {
								currentFavDragIndex = props.favIndex;
								document.removeEventListener("mousemove", mouseMove);
								document.removeEventListener("mouseup", mouseUp);
								let dragging = e3 => {
									if (currentFavDragIndex != currentFavDragDestinationIndex)
									{
										if (currentFavDragDestinationIndex != -1)
										{
											props.moveFav(currentFavDragIndex, currentFavDragDestinationIndex);
											currentFavDragDestinationIndex = currentFavDragDestinationIndex;
											currentFavDragIndex = currentFavDragDestinationIndex;
										}
									}
								};
								let releasing = e3 => {
									document.removeEventListener("mousemove", dragging);
									document.removeEventListener("mouseup", releasing);
									currentFavDragIndex = -1;
									currentFavDragDestinationIndex = -1;
								};
								document.addEventListener("mousemove", dragging);
								document.addEventListener("mouseup", releasing);
							}
						};
						let mouseUp = _ => {
							document.removeEventListener("mousemove", mouseMove);
							document.removeEventListener("mouseup", mouseUp);
						};
						document.addEventListener("mousemove", mouseMove);
						document.addEventListener("mouseup", mouseUp);
					},
				},

				React.createElement(FavIcon, {iconUrl: props.iconUrl, currentStatus: props.currentStatus}),
				React.createElement(FavName, {name: props.name}),
				!(props.showFavUnreadBadges && (props.channelId || props.guildId)) ? null : React.createElement(
					React.Fragment,
					{},
					isChannelDM(props.channelId) ? null : !props.showEmptyFavBadges && props.unreadCount === 0 ? null : React.createElement(FavUnreadBadge, {unreadCount: props.unreadCount, unreadEstimated: props.unreadEstimated, hasUnread: props.hasUnread})
				),

				!(props.showFavMentionBadges && (props.channelId || props.guildId)) ? null : React.createElement(
					React.Fragment,
					{},
					!props.showEmptyFavBadges && props.mentionCount === 0 ? null : React.createElement(FavMentionBadge, {mentionCount: props.mentionCount})
				),

				!(props.showFavTypingBadge && (props.channelId || props.guildId)) ? null : React.createElement(
					React.Fragment,
					{},
					React.createElement(FavTypingBadge, {isTyping: props.isTyping, userIds: getChannelTypingUsers(props.channelId)})
				)
			);

			//#endregion

			//#region Misc. Definitions

			const NewTab = props=>React.createElement(
				"div",
				{
					className: "channelTabs-newTab",
					onClick: props.openNewTab
				},
				"+"
			);		

			//#endregion

			//#region FavItems/FavFolders Definitions

			const NoFavItemsPlaceholder = props=>React.createElement("span", {
				className: "channelTabs-noFavNotice"
			}, "You don't have any favs yet. Right click a tab to mark it as favourite. You can disable this bar in the settings."
			);

			const FavItems = props=>{
				var isDefault = (props.group === null);

				return props.favs.filter(item => item).map(
					(fav, favIndex) => 
					{
						var canCreate = (isDefault ? fav.groupId === -1 : fav.groupId === props.group.groupId);
						return canCreate ? React.createElement(
							Flux.connectStores([UnreadStateStore, UserTypingStore, SelectedChannelStore], ()=> updateFavEntry(fav))
							(
								result => React.createElement(
									Fav,
									{
										name: fav.name,
										iconUrl: fav.iconUrl,
										url: fav.url,
										favCount: props.favs.length,
										favGroups: props.favGroups,
										rename: ()=>props.rename(fav.name, favIndex),
										delete: ()=>props.delete(favIndex),
										openInNewTab: ()=>props.openInNewTab(fav),
										moveLeft: ()=>props.move(favIndex, (favIndex + props.favs.length - 1) % props.favs.length),
										moveRight: ()=>props.move(favIndex, (favIndex + 1) % props.favs.length),
										moveToFavGroup: props.moveToFavGroup,
										moveFav: props.move,
										favIndex,
										channelId: fav.channelId,
										guildId: fav.guildId,
										groupId: fav.groupId,
										showFavUnreadBadges: props.showFavUnreadBadges,
										showFavMentionBadges: props.showFavMentionBadges,
										showFavTypingBadge: props.showFavTypingBadge,
										showEmptyFavBadges: props.showEmptyFavBadges,
										isTyping: isChannelTyping(fav.channelId),
										currentStatus: getCurrentUserStatus(fav.url),
										...result
									}
								)
							)
						) : null;
					}
				);
			};

			const FavFolder = props=>React.createElement(
					"div", 
					{
						className: "channelTabs-favGroup",
						onContextMenu: e=>{CreateFavGroupContextMenu(props,e)},
						onMouseOver: e=> {
							if (currentGroupDragIndex == props.groupIndex || currentGroupDragIndex == -1) return;
							currentGroupDragDestinationIndex = props.groupIndex;
						},					
						onMouseDown: e => {
							let mouseMove = e2 => {
								if (Math.sqrt((e.pageX - e2.pageX)**2) > 20 || Math.sqrt((e.pageY - e2.pageY)**2) > 20) {
									currentGroupDragIndex = props.groupIndex;
									document.removeEventListener("mousemove", mouseMove);
									document.removeEventListener("mouseup", mouseUp);
									let dragging = e3 => {
										if (currentGroupDragIndex != currentGroupDragDestinationIndex)
										{
											if (currentGroupDragDestinationIndex != -1)
											{
												props.moveFavGroup(currentGroupDragIndex, currentGroupDragDestinationIndex);
												currentGroupDragDestinationIndex = currentGroupDragDestinationIndex;
												currentGroupDragIndex = currentGroupDragDestinationIndex;
											}
										}
									};
									let releasing = e3 => {
										document.removeEventListener("mousemove", dragging);
										document.removeEventListener("mouseup", releasing);
										currentGroupDragIndex = -1;
										currentGroupDragDestinationIndex = -1;
									};
									document.addEventListener("mousemove", dragging);
									document.addEventListener("mouseup", releasing);
								}
							};
							let mouseUp = _ => {
								document.removeEventListener("mousemove", mouseMove);
								document.removeEventListener("mouseup", mouseUp);
							};
							document.addEventListener("mousemove", mouseMove);
							document.addEventListener("mouseup", mouseUp);
						}
					}, 
				React.createElement(
					"div", 
					{
						className: "channelTabs-favGroupBtn",
						onClick: () => {
							closeAllDropdowns();
							document.getElementById("favGroup-content-" + props.groupIndex).classList.toggle("channelTabs-favGroupShow");
							currentGroupOpened = props.groupIndex;			
						}
					}, 
					props.favGroup.name,
					props.showFavGroupMentionBadges ? props.mentionCountGroup == 0 && !props.showEmptyFavGroupBadges ? null : React.createElement(FavMentionBadge, {mentionCount: props.mentionCountGroup}) : null,
					props.showFavGroupUnreadBadges ? props.unreadCountGroup == 0 &&  !props.showEmptyFavGroupBadges ? null : React.createElement(FavUnreadBadge, {unreadCount: props.unreadCountGroup, unreadEstimated: props.unreadEstimatedGroup, hasUnread: props.hasUnreadGroup}) : null,
					props.showFavGroupTypingBadge && (props.isTypingGroup) ? React.createElement(FavTypingBadge, {isTyping: props.isTypingGroup, userIds: null}) : null
				), 
				React.createElement(
					"div", 
					{
						className: "channelTabs-favGroup-content" + (currentGroupOpened === props.groupIndex ? " channelTabs-favGroupShow" : ""),
						id: "favGroup-content-" + props.groupIndex
					}, 
					React.createElement(FavItems, {group: props.favGroup, ...props})
				)
			);
			
			const FavFolders = (props)=>{		
				return props.favGroups.map((favGroup, index) =>
					{
						return React.createElement(Flux.connectStores([UnreadStateStore, SelectedChannelStore, UserTypingStore], () => 
						{

							var unreadCount = 0;
							var unreadEstimated = 0;
							var hasUnread = false;
							var mentionCount = 0;
							var isTyping = false;

							props.favs.filter(item => item).forEach((fav, favIndex) => 
								{									
									var canCreate = fav.groupId === favGroup.groupId;
									if (canCreate) 
									{
										var hasUnreads = isChannelDM(fav.channelId);
										var result = updateFavEntry(fav);
										if (!hasUnreads) unreadCount += result.unreadCount;
										mentionCount += result.mentionCount;
										if (!hasUnreads) unreadEstimated += result.unreadEstimated;
										if (!hasUnreads) hasUnread = (result.hasUnread ? true : hasUnread);
										isTyping = (result.isTyping ? true : isTyping);
									} 
								}
							);
							return {
								unreadCount,
								mentionCount,
								unreadEstimated,
								mentionCount,
								hasUnread,
								isTyping
							};
						})
						(
							result => 
							{
								return React.createElement(FavFolder,
								{
									groupIndex: index,
									groupCount: props.favGroups.length,
									favGroup: favGroup,
									unreadCountGroup: result.unreadCount,
									unreadEstimatedGroup: result.unreadEstimated,
									mentionCountGroup: result.mentionCount,
									hasUnreadGroup: result.hasUnread,
									isTypingGroup: result.isTyping,
									showFavGroupUnreadBadges: props.showFavGroupUnreadBadges,
									showFavGroupMentionBadges: props.showFavGroupMentionBadges,
									showFavGroupTypingBadge: props.showFavGroupTypingBadge,
									showEmptyFavGroupBadges: props.showEmptyFavGroupBadges,
									...props
								});
							}
						));
					}
				);
			};

			//#endregion
						
			//#region FavBar/TopBar/TabBar Definitions

			const TabBar = props=>React.createElement(
				"div",
				{
					className: "channelTabs-tabContainer",
					"data-tab-count": props.tabs.length
				},
				props.tabs.map((tab, tabIndex)=>React.createElement(Flux.connectStores([UnreadStateStore, UserTypingStore, UserStatusStore], ()=>({
					unreadCount: UnreadStateStore.getUnreadCount(tab.channelId),
					unreadEstimated: UnreadStateStore.isEstimated(tab.channelId),
					hasUnread: UnreadStateStore.hasUnread(tab.channelId),
					mentionCount: UnreadStateStore.getMentionCount(tab.channelId),
					hasUsersTyping: isChannelTyping(tab.channelId),
					currentStatus: getCurrentUserStatus(tab.url)
				}))(result => React.createElement(
					Tab,
					{
						switchToTab: props.switchToTab,
						closeTab: props.closeTab,
						addToFavs: props.addToFavs,
						moveLeft: ()=>props.move(tabIndex, (tabIndex + props.tabs.length - 1) % props.tabs.length),
						moveRight: ()=>props.move(tabIndex, (tabIndex + 1) % props.tabs.length),
						openInNewTab: ()=>props.openInNewTab(tab),
						moveTab: props.move,
						tabCount: props.tabs.length,
						tabIndex,
						name: tab.name,
						iconUrl: tab.iconUrl,
						currentStatus: result.currentStatus,
						url: tab.url,
						selected: tab.selected,
						channelId: tab.channelId,
						unreadCount: result.unreadCount,
						unreadEstimated: result.unreadEstimated,
						hasUnread: result.hasUnread,
						mentionCount: result.mentionCount,
						hasUsersTyping: result.hasUsersTyping,
						showTabUnreadBadges: props.showTabUnreadBadges,
						showTabMentionBadges: props.showTabMentionBadges,
						showTabTypingBadge: props.showTabTypingBadge,
						showEmptyTabBadges: props.showEmptyTabBadges,
						showActiveTabUnreadBadges: props.showActiveTabUnreadBadges,
						showActiveTabMentionBadges: props.showActiveTabMentionBadges,
						showActiveTabTypingBadge: props.showActiveTabTypingBadge,
						showEmptyActiveTabBadges: props.showEmptyActiveTabBadges,
						compactStyle: props.compactStyle
					}
				)))),
				React.createElement(NewTab, {
					openNewTab: props.openNewTab
				})
			);
			
			const FavBar = props=>React.createElement(
				"div",
				{
					className: "channelTabs-favContainer" + (props.favs.length == 0 ? " channelTabs-noFavs" : ""),
					"data-fav-count": props.favs.length,
					onContextMenu: e=>{CreateFavBarContextMenu(props,  e);}
				},
				React.createElement(FavFolders, props),
				props.favs.length > 0 ? React.createElement(FavItems, {group: null, ...props}) : React.createElement(NoFavItemsPlaceholder, {}),
			);

			const TopBar = class TopBar extends React.Component {

				//#region Constructor

				constructor(props){
					super(props);
					this.state = {
						selectedTabIndex: Math.max(props.tabs.findIndex(tab => tab.selected), 0),
						tabs: props.tabs,
						favs: props.favs,
						favGroups: props.favGroups,
						showTabBar: props.showTabBar,
						showFavBar: props.showFavBar,
						showFavUnreadBadges: props.showFavUnreadBadges,
						showFavMentionBadges: props.showFavMentionBadges,
						showFavTypingBadge: props.showFavTypingBadge,
						showEmptyFavBadges: props.showEmptyFavBadges,
						showTabUnreadBadges: props.showTabUnreadBadges,
						showTabMentionBadges: props.showTabMentionBadges,
						showTabTypingBadge: props.showTabTypingBadge,
						showEmptyTabBadges: props.showEmptyTabBadges,
						showActiveTabUnreadBadges: props.showActiveTabUnreadBadges,
						showActiveTabMentionBadges: props.showActiveTabMentionBadges,
						showActiveTabTypingBadge: props.showActiveTabTypingBadge,
						showEmptyActiveTabBadges: props.showEmptyActiveTabBadges,
						showFavGroupUnreadBadges: props.showFavGroupUnreadBadges,
						showFavGroupMentionBadges: props.showFavGroupMentionBadges,
						showFavGroupTypingBadge: props.showFavGroupTypingBadge,
						showEmptyFavGroupBadges: props.showEmptyFavGroupBadges,
						addFavGroup: props.addFavGroup,
						compactStyle: props.compactStyle,
						showQuickSettings: props.showQuickSettings,
						alwaysFocusNewTabs: props.alwaysFocusNewTabs
					};
					this.switchToTab = this.switchToTab.bind(this);
					this.closeTab = this.closeTab.bind(this);
					this.saveChannel = this.saveChannel.bind(this);
					this.renameFav = this.renameFav.bind(this);
					this.deleteFav = this.deleteFav.bind(this);
					this.addToFavs = this.addToFavs.bind(this);
					this.moveTab = this.moveTab.bind(this);
					this.moveFav = this.moveFav.bind(this);
					this.addFavGroup = this.addFavGroup.bind(this);
					this.moveToFavGroup = this.moveToFavGroup.bind(this);
					this.renameFavGroup = this.renameFavGroup.bind(this);
					this.removeFavGroup = this.removeFavGroup.bind(this);
					this.moveFavGroup = this.moveFavGroup.bind(this);
					this.openNewTab = this.openNewTab.bind(this);
					this.openTabInNewTab = this.openTabInNewTab.bind(this);
					this.openFavInNewTab = this.openFavInNewTab.bind(this);
					this.openFavGroupInNewTab = this.openFavGroupInNewTab.bind(this);
					this.hideFavBar = this.hideFavBar.bind(this);
				}

				//#endregion

				//#region Tab Functions

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
				
				closeTab(tabIndex, mode){

					if(this.state.tabs.length === 1) return;
					if (mode === "single" || mode == null)
					{
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
					else if (mode == "other")
					{
						this.setState({
							tabs: this.state.tabs.filter((tab, index)=>index === tabIndex),
							selectedTabIndex: 0
						}, ()=>{
							if(!this.state.tabs[0].selected){
								this.switchToTab(this.state.selectedTabIndex);
							}
							this.props.plugin.saveSettings();
						});
					}
					else if (mode === "left")
					{
						this.setState({
							tabs: this.state.tabs.filter((tab, index)=>index >= tabIndex),
							selectedTabIndex: 0
						}, ()=>{
							if(!this.state.tabs[this.state.selectedTabIndex].selected){
								this.switchToTab(this.state.selectedTabIndex);
							}
							this.props.plugin.saveSettings();
						});
					}
					else if (mode === "right")
					{
						this.setState({
							tabs: this.state.tabs.filter((tab, index)=>index <= tabIndex),
							selectedTabIndex: tabIndex
						}, ()=>{
							if(!this.state.tabs[this.state.selectedTabIndex].selected){
								this.switchToTab(this.state.selectedTabIndex);
							}
							this.props.plugin.saveSettings();
						});
					}


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

				//#endregion

				//#region Fav Functions

				hideFavBar(){
					this.setState({
						showFavBar: false
					}, ()=>{
						this.props.plugin.settings.showFavBar = false;
						this.props.plugin.saveSettings();
					});
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
					var groupId = -1;
					this.setState({
						favs: [...this.state.favs, {name, iconUrl, url, channelId, guildId, groupId}]
					}, this.props.plugin.saveSettings);
				}

				moveFav(fromIndex, toIndex){
					if(fromIndex === toIndex) return;
					const favs = this.state.favs.filter((fav, index)=>index !== fromIndex);
					favs.splice(toIndex, 0, this.state.favs[fromIndex]);
					this.setState({favs}, this.props.plugin.saveSettings);
				}

				//#endregion

				//#region Fav Group Functions

				createFavGroupId()
				{
					var generatedId = this.state.favGroups.length;
					var isUnique = false;
					var duplicateFound = false;

					while (!isUnique) 
					{
						for (var i = 0; i < this.state.favGroups.length; i++)
						{
							var group = this.state.favGroups[i];
							if (generatedId === group.groupId) duplicateFound = true;
						}
						if (!duplicateFound) isUnique = true;
						else
						{
							generatedId++;
							duplicateFound = false;
						} 		
					}
					return generatedId;
				}

				addFavGroup()
				{
					let name = "New Group";
					BdApi.showConfirmationModal(
						"What should the new name be?",
						React.createElement(Textbox, {
							onChange: newContent=>name = newContent.trim()
						}),
						{
							onConfirm: ()=>{
								if(!name) return;
								this.setState({
									favGroups: [...this.state.favGroups, {name: name, groupId: this.createFavGroupId()}]
								}, this.props.plugin.saveSettings);
							}
						}
					);
				}

				renameFavGroup(currentName, groupId)
				{
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
									favGroups: this.state.favGroups.map((group, index)=>{
										if(group.groupId === groupId) return Object.assign({}, group, {name});
										else return Object.assign({}, group);
									})
								}, this.props.plugin.saveSettings);
							}
						}
					);
				}

				removeFavGroup(groupId)
				{
					this.setState({
						favGroups: this.state.favGroups.filter((group, index)=>group.groupId!==groupId)
					}, this.props.plugin.saveSettings);

					this.setState({
						favs: this.state.favs.map((fav, index)=>{
							if(fav.groupId === groupId) return Object.assign({}, fav, {groupId: -1});
							else return Object.assign({}, fav);
						})
					}, this.props.plugin.saveSettings);
				}

				moveToFavGroup(favIndex, groupId)
				{
					this.setState({
						favs: this.state.favs.map((fav, index)=>{
							if (index === favIndex) 
							{
								return Object.assign({}, fav, {groupId: groupId});
							} 
							else 
							{
								return Object.assign({}, fav);
							}
						})
					}, this.props.plugin.saveSettings);
				}

				moveFavGroup(fromIndex, toIndex){
					if(fromIndex === toIndex) return;
					const favGroups = this.state.favGroups.filter((group, index)=>index !== fromIndex);
					favGroups.splice(toIndex, 0, this.state.favGroups[fromIndex]);
					this.setState({favGroups: favGroups}, this.props.plugin.saveSettings);
				}

				//#endregion

				//#region New Tab Functions

				saveChannel(guildId, channelId, name, iconUrl)
				{
					if (this.state.alwaysFocusNewTabs) 
					{
						//Open and Focus New Tab
						const newTabIndex = this.state.tabs.length;
						this.setState({
							tabs: [...this.state.tabs.map(tab=>Object.assign(tab, {selected: false})), {
								url: `/channels/${guildId || "@me"}/${channelId}`,
								name,
								iconUrl,
								channelId,
								groupId: -1
							}],
							selectedTabIndex: newTabIndex
						}, ()=>{
							this.props.plugin.saveSettings();
							this.switchToTab(newTabIndex);
						});
					}
					else 
					{
						//Open New Tab
						this.setState({
							tabs: [...this.state.tabs, {
								url: `/channels/${guildId || "@me"}/${channelId}`,
								name,
								iconUrl,
								channelId,
								groupId: -1
							}]
						}, this.props.plugin.saveSettings);
					}

				}

				openNewTab() {
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
					});
				}

				openTabInNewTab(tab)
				{
					//Used to Duplicate Tabs
					this.setState({
						tabs: [...this.state.tabs, Object.assign({}, tab, {selected: false})]
					}, this.props.plugin.saveSettings);
				}

				openFavInNewTab(fav, isGroup)
				{
					if (this.state.alwaysFocusNewTabs && !isGroup) 
					{
						//Opens and Focuses New Tab
						const newTabIndex = this.state.tabs.length;
						const url = fav.url + (fav.guildId ? `/${fav.guildId}` : "");
						this.setState({
							tabs: [...this.state.tabs.map(tab=>Object.assign(tab, {selected: false})), {
								url,
								name: getCurrentName(url),
								iconUrl: getCurrentIconUrl(url),
								currentStatus: getCurrentUserStatus(url),
								channelId: fav.channelId || SelectedChannelStore.getChannelId(fav.guildId)
							}],
							selectedTabIndex: newTabIndex
						}, ()=>{
							this.props.plugin.saveSettings();
							this.switchToTab(newTabIndex);
						});
					}
					else 
					{
						//Opens New Tab
						const url = fav.url + (fav.guildId ? `/${fav.guildId}` : "");
						this.setState({
							tabs: [...this.state.tabs, {
								url,
								selected: false,
								name: getCurrentName(url),
								iconUrl: getCurrentIconUrl(url),
								currentStatus: getCurrentUserStatus(url),
								channelId: fav.channelId || SelectedChannelStore.getChannelId(fav.guildId)
							}]
						}, this.props.plugin.saveSettings);
					}
				}

				openFavGroupInNewTab(groupId)
				{
					this.state.favs.filter(item => item).map(
						(fav, favIndex) => 
						{
							var canCreate = (fav.groupId === groupId);
							if (canCreate) 
							{
								this.openFavInNewTab(fav, true);
							}
						}
					)
				}

				//#endregion

				//#region Other Functions

				render(){
					return React.createElement(
						"div",
						{
							id: "channelTabs-container"
						},
						!this.state.showQuickSettings ? null : React.createElement('div', 
						{
							id: "channelTabs-settingsMenu",
							dangerouslySetInnerHTML: { __html: SettingsMenuIcon },
							onClick: e=>{CreateSettingsContextMenu(this,e);}
						}),
						!this.state.showTabBar ? null : React.createElement(TabBar, {
							tabs: this.state.tabs,
							showTabUnreadBadges: this.state.showTabUnreadBadges,
							showTabMentionBadges: this.state.showTabMentionBadges,
							showTabTypingBadge: this.state.showTabTypingBadge,
							showEmptyTabBadges: this.state.showEmptyTabBadges,
							showActiveTabUnreadBadges: this.state.showActiveTabUnreadBadges,
							showActiveTabMentionBadges: this.state.showActiveTabMentionBadges,
							showActiveTabTypingBadge: this.state.showActiveTabTypingBadge,
							showEmptyActiveTabBadges: this.state.showEmptyActiveTabBadges,
							compactStyle: this.state.compactStyle,
							privacyMode: this.state.privacyMode,
							closeTab: this.closeTab,
							switchToTab: this.switchToTab,
							openNewTab: this.openNewTab,
							openInNewTab: this.openTabInNewTab,
							addToFavs: this.addToFavs,
							move: this.moveTab
						}),
						!this.state.showFavBar ? null : React.createElement(FavBar, {
							favs: this.state.favs,
							favGroups: this.state.favGroups,
							showFavUnreadBadges: this.state.showFavUnreadBadges,
							showFavMentionBadges: this.state.showFavMentionBadges,
							showFavTypingBadge: this.state.showFavTypingBadge,
							showEmptyFavBadges: this.state.showEmptyFavBadges,
							privacyMode: this.state.privacyMode,
							showFavGroupUnreadBadges: this.state.showFavGroupUnreadBadges,
							showFavGroupMentionBadges: this.state.showFavGroupMentionBadges,
							showFavGroupTypingBadge: this.state.showFavGroupTypingBadge,
							showEmptyFavGroupBadges: this.state.showEmptyFavGroupBadges,
							rename: this.renameFav,
							delete: this.deleteFav,
							addToFavs: this.addToFavs,
							openInNewTab: this.openFavInNewTab,
							move: this.moveFav,
							moveFavGroup: this.moveFavGroup,
							addFavGroup: this.addFavGroup,
							moveToFavGroup: this.moveToFavGroup,
							removeFavGroup: this.removeFavGroup,
							renameFavGroup: this.renameFavGroup,
							openFavGroupInNewTab: this.openFavGroupInNewTab,
							hideFavBar: this.hideFavBar
						})
					);
				}

				//#endregion
			
			};

			const TopBarRef = React.createRef();

			//#endregion

			//#region Plugin Decleration

			return class ChannelTabs extends Plugin 
			{				
				//#region Start/Stop Functions

				constructor(){
					super();
				}
				
				onStart(isRetry = false){
					//console.warn("CT Start");
					if(isRetry && !BdApi.Plugins.isEnabled(config.info.name)) return;
					if(!UserStore.getCurrentUser()) return setTimeout(()=>this.onStart(true), 1000);
					//console.warn(UserStore.getCurrentUser());
					patches = [];
					this.loadSettings();
					this.applyStyle();
					this.ifNoTabsExist();
					this.promises = {state:{cancelled: false}, cancel(){this.state.cancelled = true;}};
					this.saveSettings = this.saveSettings.bind(this);
					this.keybindHandler = this.keybindHandler.bind(this);
					this.onSwitch();
					this.patchAppView(this.promises.state);
					this.patchContextMenus();
					this.ifReopenLastChannelDefault();
					document.addEventListener("keydown", this.keybindHandler);
					window.onclick = (event) => this.clickHandler(event);
				}
				
				onStop(){
					this.removeStyle();
					document.removeEventListener("keydown", this.keybindHandler);
					window.onclick = null;
					Patcher.unpatchAll();
					this.promises.cancel();
					patches.forEach(patch=>patch());

				}

				//#endregion
				
				//#region Styles

				applyStyle()
				{
					const CompactVariables = `
						:root {	
							--channelTabs-tabHeight: 20px;
							--channelTabs-tabTextSize: 15px;
						}
					`;

					const CozyVariables = `
						:root {	
							--channelTabs-tabHeight: 40px;
							--channelTabs-tabTextSize: 18px;
						}
					`;

					const ConstantVariables = `
						:root {	
							--channelTabs-tabWidth: 220px;
							--channelTabs-favHeight: 20px;
							--channelTabs-tabStatusBorderThickness: 2px;
							--channelTabs-favStatusBorderThickness: 2px;
						}
					`;

					const PrivacyStyle = `
						.channelTabs-favGroupBtn  {
							color: transparent;
							text-shadow: 0 0 7px var(--interactive-normal);
						}

						.channelTabs-tabName  {
							color: transparent;
							text-shadow: 0 0 7px var(--interactive-normal);
						}
						
						.channelTabs-fav  {
							color: transparent;
							text-shadow: 0 0 7px var(--interactive-normal);
						}
					`;
		
					const BaseStyle = `

					/* 
					//#region Tab Base/Container
					*/

					.channelTabs-tab {
						display: inline-block;
						margin: 2px 0;
						margin-left: 4px;
						font-size: calc(var(--channelTabs-tabTextSize));
						width: var(--channelTabs-tabWidth);
						position: relative;
						background: var(--background-secondary);
						border: none;
						padding: 6px 6px 6px 6px;
						border-radius: 5px;
						color: var(--interactive-normal);
						height: var(--channelTabs-tabHeight);
					}

					#channelTabs-container {
						z-index: 1000;
					}

					.channelTabs-tabContainer {
						min-height: calc(var(--channelTabs-tabHeight) + 16px);
						background: var(--background-secondary-alt);
						position: relative;
					}
					.channelTabs-tab:not(.channelTabs-selected):hover {
						background: var(--background-modifier-active);
						cursor: pointer;
						color: var(--interactive-hover);
					}

					.channelTabs-tab.channelTabs-selected {
						background: var(--background-modifier-selected);
						color: var(--interactive-active);
					}

					.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected),
					.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected),
					.channelTabs-tab.channelTabs-mention:not(.channelTabs-selected) {
						color: var(--interactive-hover);
					}
					.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected):hover,
					.channelTabs-tab.channelTabs-mention:not(.channelTabs-selected):hover {
						color: var(--interactive-active);
					}

					/*
					//#endregion
					*/

					/*
					//#region Quick Settings
					*/

					#channelTabs-settingsMenu {
						z-index: 1000;
						height: 40px;
						position: relative;
						display: inline-block;
						background: var(--background-floating);
						width: 40px;
						float: right;
						border-radius: 0% 0% 0% 25%;
					}

					#channelTabs-settingsMenu:hover {
						background: var(--background-secondary);
					}
					
					.channelTabs-settingsIcon {
						max-width: 40px;
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						max-height: 40px;
					}

					/*
					//#endregion
					*/

					/*
					//#region Tab Name
					*/

					.channelTabs-tabName {
						width: calc(var(--channelTabs-tabWidth) - 18px);
						display: inline-block;
						position: absolute;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						height: 50%;
						margin: auto;
						top: 0; left: 5px; bottom: 0; right: 0;
					}
					.channelTabs-tabName:only-child {
						width: calc(var(--channelTabs-tabWidth) - 2px);
					}

					/*
					//#endregion
					*/

					/*
					//#region Tab Icon
					*/

					.channelTabs-tabIcon {
						height: calc(var(--channelTabs-tabHeight) - var(--channelTabs-tabStatusBorderThickness));
						display: inline-block;
						border-radius: 100%;
						position: absolute;
					}
					.channelTabs-tabIcon ~ .channelTabs-tabName {
						margin-left: calc(var(--channelTabs-tabHeight) + 7px);
						width: calc(var(--channelTabs-tabWidth) - var(--channelTabs-tabHeight) - 6px);
					}

					.channelTabs-tabIcon.channelTabs-onlineIcon {
						border: var(--channelTabs-tabStatusBorderThickness) solid rgb(67, 181, 129);
					}

					.channelTabs-tabIcon.channelTabs-idleIcon {
						border: var(--channelTabs-tabStatusBorderThickness) solid rgb(250, 166, 26);
					}

					.channelTabs-tabIcon.channelTabs-doNotDisturbIcon {
						border: var(--channelTabs-tabStatusBorderThickness) solid rgb(216, 68, 68);
					}

					.channelTabs-tabIcon.channelTabs-offlineIcon {
						border: var(--channelTabs-tabStatusBorderThickness) solid rgb(111, 121, 134);
					}

					.channelTabs-tabIcon.channelTabs-noneIcon {
						border: var(--channelTabs-tabStatusBorderThickness) solid rgb(50, 52, 57);
					}

					/*
					//#endregion
					*/

					/*
					//#region Close Tab / New Tab
					*/

					.channelTabs-closeTab {
						display: inline-block;
						position: absolute;
						right: 0px;
						top: 0px;
						width: 14px;
						height: 14px;
						border-radius: 0px 5px 0px 5px;
						text-align: center;
						line-height: 14px;
						font-size: 14px;
						background: var(--interactive-muted);
						color: var(--background-secondary-alt);
						cursor: pointer;
					}
					.channelTabs-tab.channelTabs-selected .channelTabs-closeTab {
						background: var(--interactive-normal);
					}
					.channelTabs-tab:not(.channelTabs-selected):hover .channelTabs-closeTab:hover {
						background: red;
						color: white;
					}
					.channelTabs-tab.channelTabs-selected .channelTabs-closeTab:hover {
						background: red;
						color: white;
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

					/*
					//#endregion
					*/

					/*
					//#region Badges
					*/

					.channelTabs-mentionBadge,
					.channelTabs-unreadBadge  {
						border-radius: 8px;
						padding-left: 4px;
						padding-right: 4px;
						min-width: 8px;
						width: fit-content;
						height: 16px;
						font-size: 12px;
						line-height: 16px;
						font-weight: 600;
						text-align: center;
						color: #fff;
					}
				
					.channelTabs-typingBadge {
						border-radius: 8px;
						padding-left: 4px;
						padding-right: 4px;
						min-width: 8px;
						width: fit-content;
						height: 16px;
						font-size: 12px;
						line-height: 16px;
						font-weight: 600;
						text-align: center;
						color: #fff;
					}
					

					.channelTabs-mentionBadge {
						background-color: rgb(240, 71, 71);
					}
					.channelTabs-unreadBadge {
						background-color: rgb(114, 137, 218);
					}

					.channelTabs-typingBadge {
						background-color: rgb(44, 47, 51);
					}

					.channelTabs-classicBadgeAlignment {
						margin-right: 4px !important;
						display: inline-block;
						float: right !important;
					}

					.channelTabs-badgeAlignLeft {
						float: left !important;
					}

					.channelTabs-badgeAlignRight {
						float: right !important;
					}


					.channelTabs-tab .channelTabs-mentionBadge,
					.channelTabs-tab .channelTabs-unreadBadge,
					.channelTabs-tab .channelTabs-typingBadge {
						height: 16px;
					}

					.channelTabs-typingBadgeAlignment {
						position: absolute;
						right: calc(0px - var(--channelTabs-tabStatusBorderThickness));
						bottom: calc(0px - var(--channelTabs-tabStatusBorderThickness));
					}
					

					.channelTabs-tab .channelTabs-noMention,
					.channelTabs-tab .channelTabs-noUnread {
						background-color: var(--background-primary);
						color: var(--text-muted);
					}

					.channelTabs-fav .channelTabs-mentionBadge,
					.channelTabs-fav .channelTabs-unreadBadge {
						display: inline-block;
						vertical-align: bottom;
						float: right !important;
						margin-left: 2px;
					}

					.channelTabs-fav .channelTabs-typingBadge {
						display: inline-flex;
						vertical-align: bottom;
						float: right !important;
						margin-left: 2px;
					}
				
					.channelTabs-fav .channelTabs-noMention,
					.channelTabs-fav .channelTabs-noUnread {
						background-color: var(--background-primary);
						color: var(--text-muted);
					}
					.channelTabs-fav .channelTabs-noTyping {
						display: none;
					}

					.channelTabs-favGroupBtn .channelTabs-noMention,
					.channelTabs-favGroupBtn .channelTabs-noUnread {
						background-color: var(--background-primary);
						color: var(--text-muted);
					}

					.channelTabs-favGroupBtn .channelTabs-typingBadge {
						display: inline-flex;
						vertical-align: bottom;
						float: right !important;
						margin-left: 2px;
					}

					.channelTabs-favGroupBtn .channelTabs-mentionBadge,
					.channelTabs-favGroupBtn .channelTabs-unreadBadge {
						display: inline-block;
						vertical-align: bottom;
						float: right !important;
						margin-left: 2px;
					}

					.channelTabs-favGroupBtn .channelTabs-noTyping {
						display: none;
					}
					

					/*
					//#endregion
					*/

					/*
					//#region Favs
					*/

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
						border-radius: 100%;
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

					.channelTabs-favIcon.channelTabs-onlineIcon {
						border: var(--channelTabs-favStatusBorderThickness) solid rgb(67, 181, 129);
						left: var(--channelTabs-favStatusBorderThickness);
						top: var(--channelTabs-favStatusBorderThickness);
					}

					.channelTabs-favIcon.channelTabs-idleIcon {
						border: var(--channelTabs-favStatusBorderThickness) solid rgb(250, 166, 26);
						left: var(--channelTabs-favStatusBorderThickness);
						top: var(--channelTabs-favStatusBorderThickness);
					}

					.channelTabs-favIcon.channelTabs-doNotDisturbIcon {
						border: var(--channelTabs-favStatusBorderThickness) solid rgb(216, 68, 68);
						left: var(--channelTabs-favStatusBorderThickness);
						top: var(--channelTabs-favStatusBorderThickness);
					}

					.channelTabs-favIcon.channelTabs-offlineIcon {
						border: var(--channelTabs-favStatusBorderThickness) solid rgb(111, 121, 134);
						left: var(--channelTabs-favStatusBorderThickness);
						top: var(--channelTabs-favStatusBorderThickness);
					}

					.channelTabs-favIcon.channelTabs-noneIcon {
						border: var(--channelTabs-favStatusBorderThickness) solid rgb(50, 52, 57);
						left: var(--channelTabs-favStatusBorderThickness);
						top: var(--channelTabs-favStatusBorderThickness);
					}

					/*
					//#endregion 
					*/

					/*
					//#region Fav Folders
					*/

					.channelTabs-favGroupBtn {
						display: inline-block;
						font-size: calc(var(--channelTabs-favHeight) - 2px);
						color: var(--interactive-normal);
						background-color: var(--background-tertiary);
						padding: 6px;
						margin-left: 5px;
						border-radius: 4px;
					}

					.channelTabs-favGroup:hover .channelTabs-favGroupBtn {
						background-color: var(--background-secondary-alt);
					}
					
					.channelTabs-favGroup {
						position: relative;
						display: inline-block;
					}
		
					.channelTabs-favGroup-content {
						z-index: 1001;
						display: none;
						position: absolute;
						background-color: var(--background-tertiary);
						border-radius: 4px;
						min-width: max-content;
						background: var(--background-floating);
						-webkit-box-shadow: var(--elevation-high);
						box-shadow: var(--elevation-high);
					}

					.channelTabs-favGroup-content .channelTabs-fav {
						display: block;
					}

					.channelTabs-favGroupShow {
						display:block;
					}
		
					  

					  


					/*
					//#endregion
					*/

					/*
					//#region Tab Grid
					*/

					.channelTabs-gridContainer {
						margin-left: 7px;
						width: var(--channelTabs-tabHeight) !important;
						height: var(--channelTabs-tabHeight) !important;
						left: 0px;
						//background-color: red;
						display: inline-grid;
						grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
						position: absolute;
					}

					.channelTabs-gridItemTL {
						grid-column: 1 / 1;
						grid-row: 1 / 1;
						//background-color: blue;
					}
					.channelTabs-gridItemTR {
						grid-column: 2 / 2;
						grid-row: 1 / 1;
						//background-color: green;
					}
					.channelTabs-gridItemBL {
						grid-column: 1 / 1;
						grid-row: 2 / 2;
						//background-color: green;
					}
					.channelTabs-gridItemBR {
						grid-column: 2 / 2;
						grid-row: 2 / 2;
						//background-color: blue;
					}

					/*
					//#endregion 
					*/
					
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
					`;

					if (this.settings.compactStyle === true) PluginUtilities.addStyle("channelTabs-style-compact", CompactVariables);
					if (this.settings.compactStyle === false) PluginUtilities.addStyle("channelTabs-style-cozy", CozyVariables);
					if (this.settings.privacyMode === true) PluginUtilities.addStyle("channelTabs-style-private", PrivacyStyle);
					PluginUtilities.addStyle("channelTabs-style-constants", ConstantVariables);
					PluginUtilities.addStyle("channelTabs-style", BaseStyle);
				}

				removeStyle()
				{
					PluginUtilities.removeStyle("channelTabs-style-compact");
					PluginUtilities.removeStyle("channelTabs-style-cozy");
					PluginUtilities.removeStyle("channelTabs-style-private");
					PluginUtilities.removeStyle("channelTabs-style-constants");
					PluginUtilities.removeStyle("channelTabs-style");
				}

				//#endregion

				//#region Init/Default Functions

				ifNoTabsExist()
				{
					if(this.settings.tabs.length == 0) this.settings.tabs = [{
						name: getCurrentName(),
						url: location.pathname,
						selected: true,
						iconUrl: getCurrentIconUrl()
					}];
				}


				ifReopenLastChannelDefault()
				{
					if(this.settings.reopenLastChannel)
					{
						switching = true;
						NavigationUtils.transitionTo((this.settings.tabs.find(tab=>tab.selected) || this.settings.tabs[0]).url);
						switching = false;
					}

				}

				//#endregion
				
				//#region Patches
				
				async patchAppView(promiseState)
				{
					const AppView = await ReactComponents.getComponent("Shakeable", ".app-2rEoOp");
					if(promiseState.cancelled) return;
					Patcher.after(AppView.component.prototype, "render", (thisObject, _, returnValue) => {
						returnValue.props.children = [
							React.createElement(TopBar, {
								showTabBar: this.settings.showTabBar,
								showFavBar: this.settings.showFavBar,
								showFavUnreadBadges: this.settings.showFavUnreadBadges,
								showFavMentionBadges: this.settings.showFavMentionBadges,
								showFavTypingBadge: this.settings.showFavTypingBadge,
								showEmptyFavBadges: this.settings.showEmptyFavBadges,
								showTabUnreadBadges: this.settings.showTabUnreadBadges,
								showTabMentionBadges: this.settings.showTabMentionBadges,
								showTabTypingBadge: this.settings.showTabTypingBadge,
								showEmptyTabBadges: this.settings.showEmptyTabBadges,
								showActiveTabUnreadBadges: this.settings.showActiveTabUnreadBadges,
								showActiveTabMentionBadges: this.settings.showActiveTabMentionBadges,
								showActiveTabTypingBadge: this.settings.showActiveTabTypingBadge,
								showEmptyActiveTabBadges: this.settings.showEmptyActiveTabBadges,
								showFavGroupUnreadBadges: this.settings.showFavGroupUnreadBadges,
								showFavGroupMentionBadges: this.settings.showFavGroupMentionBadges,
								showFavGroupTypingBadge: this.settings.showFavGroupTypingBadge,
								showEmptyFavGroupBadges: this.settings.showEmptyFavGroupBadges,
								compactStyle: this.settings.compactStyle,
								privacyMode: this.settings.privacyMode,
								showQuickSettings: this.settings.showQuickSettings,
								alwaysFocusNewTabs: this.settings.alwaysFocusNewTabs,
								tabs: this.settings.tabs,
								favs: this.settings.favs,
								favGroups: this.settings.favGroups,
								ref: TopBarRef,
								plugin: this
							}),
							returnValue.props.children
						].flat();
					});
					AppView.forceUpdateAll();
					patches.push(()=>AppView.forceUpdateAll());
				}
				
				patchContextMenus()
				{
					const [, , TextChannelContextMenu] = WebpackModules.getModules(m => m.default && m.default.displayName === "ChannelListTextChannelContextMenu");
					Patcher.after(TextChannelContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						returnValue.props.children.push(CreateTextChannelContextMenuChildren(this, props));
					});

					const DMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'DMUserContextMenu');
					Patcher.after(DMContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						if(!returnValue) return;
						returnValue.props.children.props.children.push(CreateDMContextMenuChildren(this, props));
					});

					const GroupDMContextMenu = WebpackModules.find(({ default: defaul }) => defaul && defaul.displayName === 'GroupDMContextMenu');
					Patcher.after(GroupDMContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						if(!returnValue) return;
						returnValue.props.children.push(CreateGroupContextMenuChildren(this, props));
					});

					const GuildContextMenu = WebpackModules.find(m => m.default && m.default.displayName === "GuildContextMenu");
					Patcher.after(GuildContextMenu, "default", (_, [props], returnValue) => {
						if(!this.settings.showTabBar && !this.settings.showFavBar) return;
						const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId(props.guild.id));
						returnValue.props.children.push(CreateGuildContextMenuChildren(this, props, channel));
					});
				}

				//#endregion
				
				//#region Handlers

				clickHandler(e)
				{
					if (!e.target.matches('.channelTabs-favGroupBtn')) {
						closeAllDropdowns();
					}
				}
				
				keybindHandler(e)
				{
					const keybinds = [
						{altKey: false, ctrlKey: true, shiftKey: false, keyCode: 87 /*w*/, action: this.closeCurrentTab},
						{altKey: false, ctrlKey: true, shiftKey: false, keyCode: 33 /*pg_up*/, action: this.previousTab},
						{altKey: false, ctrlKey: true, shiftKey: false, keyCode: 34 /*pg_down*/, action: this.nextTab}
					];
					keybinds.forEach(keybind => {
						if(e.altKey === keybind.altKey && e.ctrlKey === keybind.ctrlKey && e.shiftKey === keybind.shiftKey && e.keyCode === keybind.keyCode) keybind.action();
					})
				}

				//#endregion

				//#region General Functions

				onSwitch(){
					if(switching) return;
					//console.log(this);
					if(TopBarRef.current){
						TopBarRef.current.setState({
							tabs: TopBarRef.current.state.tabs.map(tab => {
								if(tab.selected){
									const channelId = SelectedChannelStore.getChannelId();
									return {
										name: getCurrentName(),
										url: location.pathname,
										selected: true,
										currentStatus: getCurrentUserStatus(location.pathname),
										iconUrl: getCurrentIconUrl(location.pathname),
										channelId: channelId
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
							currentStatus: getCurrentUserStatus(location.pathname),
							iconUrl: getCurrentIconUrl(location.pathname),
							channelId: channelId
						};
					}
				}

				mergeItems(itemsTab, itemsFav){
					const out = [];
					if(this.settings.showTabBar) out.push(...itemsTab);
					if(this.settings.showFavBar) out.push(...itemsFav);
					return out;
				}

				//#endregion
				
				//#region Hotkey Functions

				nextTab(){
					if(TopBarRef.current) TopBarRef.current.switchToTab((TopBarRef.current.state.selectedTabIndex + 1) % TopBarRef.current.state.tabs.length);
				}

				previousTab(){
					if(TopBarRef.current) TopBarRef.current.switchToTab((TopBarRef.current.state.selectedTabIndex - 1 + TopBarRef.current.state.tabs.length) % TopBarRef.current.state.tabs.length);
				}

				closeCurrentTab(){
					if(TopBarRef.current) TopBarRef.current.closeTab(TopBarRef.current.state.selectedTabIndex);
				}

				//#endregion

				//#region Settings
				
				get defaultVariables(){
					return {
						tabs: [],
						favs: [],
						favGroups: [],
						showTabBar: true,
						showFavBar: true,
						reopenLastChannel: false,
						showFavUnreadBadges: true,
						showFavMentionBadges: true,
						showFavTypingBadge: true,
						showEmptyFavBadges: true,
						showTabUnreadBadges: true,
						showTabMentionBadges: true,
						showTabTypingBadge: true,
						showEmptyTabBadges: false,
						showActiveTabUnreadBadges: false,
						showActiveTabMentionBadges: false,
						showActiveTabTypingBadge: false,
						showEmptyActiveTabBadges: false,
						compactStyle: true,
						privacyMode: false,
						showFavGroupUnreadBadges: true,
						showFavGroupMentionBadges: true,
						showFavGroupTypingBadge: true,
						showEmptyFavGroupBadges: true,
						showQuickSettings: true,
						alwaysFocusNewTabs: false
					};
				}

				getSettingsPath(useOldLocation)
				{
					if (useOldLocation === true) 
					{
						return this.getName();
					}
					else 
					{
						const user_id = UserStore.getCurrentUser()?.id;
						return this.getName() + "_new" + (user_id != null ? "_" + user_id : "");
					}
				}
				
				loadSettings()
				{					
					if (Object.keys(PluginUtilities.loadSettings(this.getSettingsPath())).length === 0)
					{
						this.settings = PluginUtilities.loadSettings(this.getSettingsPath(true), this.defaultVariables);
					}
					else 
					{
						this.settings = PluginUtilities.loadSettings(this.getSettingsPath(), this.defaultVariables);
					}
					this.settings.favs = this.settings.favs.map(fav => {
						if(fav.channelId === undefined){
							const match = fav.url.match(/^\/channels\/[^\/]+\/(\d+)$/);
							if(match) return Object.assign(fav, {channelId: match[1]});
						}
						if (fav.groupId === undefined)
						{
							return Object.assign(fav, {groupId: -1});
						}
						return fav;
					});
					this.saveSettings();
				}

				saveSettings(){
					if(TopBarRef.current){
						this.settings.tabs = TopBarRef.current.state.tabs;
						this.settings.favs = TopBarRef.current.state.favs;
						this.settings.favGroups = TopBarRef.current.state.favGroups;
					}
					PluginUtilities.saveSettings(this.getSettingsPath(), this.settings);
				}
				
				getSettingsPanel(){
					const panel = document.createElement("div");
					panel.className = "form";
					panel.style = "width:100%;";

					//#region Startup Settings
					new Settings.SettingGroup("Startup Settings", {shown: true}).appendTo(panel)
						.append(new Settings.Switch("Reopen last channel", "When starting the plugin (or discord) the channel will be selected again instead of the friends page", this.settings.reopenLastChannel, checked=>{
							this.settings.reopenLastChannel = checked;
							this.saveSettings();
						}));
					//#endregion

					//#region General Appearance
					new Settings.SettingGroup("General Appearance").appendTo(panel)
						.append(new Settings.Switch("Show Tab Bar", "Allows you to have multiple tabs like in a web browser", this.settings.showTabBar, checked=>{
							this.settings.showTabBar = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showTabBar: checked
							});
							this.saveSettings();
						}))
						.append(new Settings.Switch("Show Fav Bar", "Allows you to add favorites by right clicking a tab or the fav bar", this.settings.showFavBar, checked=>{
							this.settings.showFavBar = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showFavBar: checked
							});
							this.saveSettings();
						}))
						.append(new Settings.Switch("Show Quick Settings", "Allows you to quickly change major settings from a context menu", this.settings.showQuickSettings, checked=>{
							this.settings.showQuickSettings = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showQuickSettings: checked
							});
							this.saveSettings();
						}))
						.append(new Settings.Switch("Use Compact Look", "", this.settings.compactStyle, checked=>{
							this.settings.compactStyle = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								compactStyle: checked
							});
							this.removeStyle();
							this.applyStyle();
							this.saveSettings();
						}))
						.append(new Settings.Switch("Enable Privacy Mode", "Obfusicates all the Sensitive Text in ChannelTabs", this.settings.privacyMode, checked=>{
							this.settings.privacyMode = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								privacyMode: checked
							});
							this.removeStyle();
							this.applyStyle();
							this.saveSettings();
						}));

					//#endregion

					//#region Behavior Settings
					new Settings.SettingGroup("Behavior").appendTo(panel)
						.append(new Settings.Switch("Always Auto Focus New Tabs", "Forces all newly created tabs to bring themselves to focus", this.settings.alwaysFocusNewTabs, checked=>{
							this.settings.alwaysFocusNewTabs = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								alwaysFocusNewTabs: checked
							});
							this.saveSettings();
						}));

					//#endregion

					//#region Badge Visibility - Favs

						new Settings.SettingGroup("Badge Visibility - Favorites").appendTo(panel)

							.append(new Settings.Switch("Show Unread", "", this.settings.showFavUnreadBadges, checked=>{
								this.settings.showFavUnreadBadges = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showFavUnreadBadges: checked
								});
								this.saveSettings();
							}))

							.append(new Settings.Switch("Show Mentions", "", this.settings.showFavMentionBadges, checked=>{
								this.settings.showFavMentionBadges = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showFavMentionBadges: checked
								});
								this.saveSettings();
							}))

							.append(new Settings.Switch("Show Typing", "", this.settings.showFavTypingBadge, checked=>{
								this.settings.showFavTypingBadge = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showFavTypingBadge: checked
								});
								this.saveSettings();
							}))

							.append(new Settings.Switch("Show Empty", "", this.settings.showEmptyFavBadges, checked=>{
								this.settings.showEmptyFavBadges = checked;
								if(TopBarRef.current) TopBarRef.current.setState({
									showEmptyFavBadges: checked
								});
								this.saveSettings();
							}));

						

					//#endregion

					//#region Badge Visibility - Fav Groups

					new Settings.SettingGroup("Badge Visibility - Favorite Groups").appendTo(panel)

						.append(new Settings.Switch("Show Unread", "", this.settings.showFavGroupUnreadBadges, checked=>{
							this.settings.showFavGroupUnreadBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showFavGroupUnreadBadges: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Mentions", "", this.settings.showFavGroupMentionBadges, checked=>{
							this.settings.showFavGroupMentionBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showFavGroupMentionBadges: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Typing", "", this.settings.showFavGroupTypingBadge, checked=>{
							this.settings.showFavGroupTypingBadge = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showFavGroupTypingBadge: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Empty", "", this.settings.showEmptyGroupFavBadges, checked=>{
							this.settings.showEmptyGroupFavBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showEmptyGroupFavBadges: checked
							});
							this.saveSettings();
						}));

					//#endregion

					//#region Badge Visibility - Tabs

					new Settings.SettingGroup("Badge Visibility - Tabs").appendTo(panel)

						.append(new Settings.Switch("Show Unread", "", this.settings.showTabUnreadBadges, checked=>{
							this.settings.showTabUnreadBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showTabUnreadBadges: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Mentions", "", this.settings.showTabMentionBadges, checked=>{
							this.settings.showTabMentionBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showTabMentionBadges: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Typing", "", this.settings.showTabTypingBadge, checked=>{
							this.settings.showTabTypingBadge = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showTabTypingBadge: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Empty", "", this.settings.showEmptyTabBadges, checked=>{
							this.settings.showEmptyTabBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showEmptyTabBadges: checked
							});
							this.saveSettings();
						}));

					

					//#endregion

					//#region Badge Visibility - Active Tabs

					new Settings.SettingGroup("Badge Visibility - Active Tabs").appendTo(panel)

						.append(new Settings.Switch("Show Unread", "", this.settings.showActiveTabUnreadBadges, checked=>{
							this.settings.showActiveTabUnreadBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showActiveTabUnreadBadges: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Mentions", "", this.settings.showActiveTabMentionBadges, checked=>{
							this.settings.showActiveTabMentionBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showActiveTabMentionBadges: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Typing", "", this.settings.showActiveTabTypingBadge, checked=>{
							this.settings.showActiveTabTypingBadge = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showActiveTabTypingBadge: checked
							});
							this.saveSettings();
						}))

						.append(new Settings.Switch("Show Empty", "", this.settings.showEmptyActiveTabBadges, checked=>{
							this.settings.showEmptyActiveTabBadges = checked;
							if(TopBarRef.current) TopBarRef.current.setState({
								showEmptyActiveTabBadges: checked
							});
							this.saveSettings();
						}));

					//#endregion
				

					return panel;
				}


				//#endregion 			
			}

			//#endregion

		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
