/**
* @name BugReportHelper
* @displayName BugReportHelper
* @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/BugReportHelper/BugReportHelper.plugin.js
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
			name: "BugReportHelper",
			authors: [
				{
					name: "l0c4lh057",
					discord_id: "226677096091484160",
					github_username: "l0c4lh057",
					twitter_username: "l0c4lh057"
				}
			],
			version: "1.0.0",
			description: "Makes it easier for you to report issues by adding a help button in some support channels (e.g. that on my server). Using that to report issues will (hopefully) give all the information needed for fixing the problem.",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/BugReportHelper/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/BugReportHelper/BugReportHelper.plugin.js"
		},
		defaultConfig: [
			{
				type: "switch",
				id: "showHelpButton",
				name: "Show Help Button",
				note: "Shows a help button next to emoji picker and GIF button in channels supported by this plugin",
				value: true
			},
			{
				type: "switch",
				id: "automaticallyShowHelpPopup",
				name: "Automatically Show Help Popup",
				note: "Opens the help modal automatically when visiting a support channel if not shown in the past seven days",
				value: true
			}
		],
		changelog: [
			{
				title: "Release",
				type: "added",
				items: ["Initial release"]
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
				});
		}
		start(){}
		stop(){}
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { WebpackModules, PluginUtilities, DiscordModules } = Api;
			const { React } = DiscordModules;
			const SelectedChannelStore = WebpackModules.getByProps("getChannelId");
			const Textbox = WebpackModules.find(m => m.defaultProps && m.defaultProps.type == "text");
			const Dropdown = WebpackModules.find(m => m.prototype && !m.prototype.handleClick && m.prototype.render && m.prototype.render.toString().includes("default.select"));
			const DeprecatedModal = WebpackModules.getByDisplayName("DeprecatedModal");
			const FormTitle = WebpackModules.getByDisplayName("FormTitle");
			const Button = WebpackModules.getByProps("Button").Button;
			const Modals = WebpackModules.getByProps("openModal");
			let stateCache = {};
			let knownIssues, supportChannels;
			let popupLastShownTime = {};
			
			const classNames = {
				sectionTitle: WebpackModules.getByProps("clickable", "themed", "title").title,
				input: WebpackModules.getByProps("error", "inputDefault").inputDefault,
				textArea: WebpackModules.getByProps("resizeable", "textArea").textArea,
				resizeable: WebpackModules.getByProps("resizeable", "textArea").resizeable,
				scrollbar: WebpackModules.getByProps("scrollbar", "scrollbarDefault").scrollbarDefault,
				error: WebpackModules.getByProps("error", "inputDefault").error,
				colorStandard: WebpackModules.getByProps("colorBrand", "colorStandard").colorStandard,
				container: WebpackModules.getByProps("body", "container", "content").container,
				content: WebpackModules.getByProps("body", "container", "content").content
			}
			const isPowercord = ()=>window.WebSocket&&window.WebSocket.name&&window.WebSocket.name.includes("Patched");
			const issueOther = {title: "Other"};
			const PluginInfo = class PluginInfo {
				constructor(name, version, author, instance){
					this.name = name;
					this.version = version;
					this.author = author;
					this.instance = instance;
				}
				getName(){ return this.name; }
				getVersion(){ return this.version; }
				getAuthor(){ return this.author; }
				getAuthors(){ return this.author.split(",").map(author => author.trim()); }
				getInstance(){ return this.instance; }
			}
			const convertPluginClass = plugin=>{
				if(!plugin) return plugin;
				if(plugin.plugin && plugin.name && plugin.modified && plugin.filename){
					return new PluginInfo(plugin.id, plugin.plugin.getVersion(), plugin.plugin.getAuthor(), plugin.plugin);
				}else{
					return new PluginInfo(plugin.getName(), plugin.getVersion(), plugin.getAuthor(), plugin);
				}
			}
			const getAllPlugins = ()=>BdApi.Plugins.getAll().map(convertPluginClass);
			const getPlugin = name=>convertPluginClass(BdApi.Plugins.get(name));
			
			return class BugReportHelper extends Plugin {
				constructor(){
					super();
				}
				
				async onStart(){
					if(global.__l0c4lh057s_secret_stuff && typeof global.__l0c4lh057s_secret_stuff.stopActivity === "function") global.__l0c4lh057s_secret_stuff.stopActivity();
					const issuesAndSupportChannels = await this.loadIssuesAndSupportChannels();
					knownIssues = issuesAndSupportChannels.knownIssues;
					supportChannels = issuesAndSupportChannels.supportChannels;
					stateCache = {};
					popupLastShownTime = PluginUtilities.loadData(this.getName(), "popupLastShownTime", {});
					this.onSwitch();
				}
				
				onStop(){
					const button = document.getElementById("l0c4lh057-issue-helper");
					if(button) button.remove();
				}
				
				onSwitch(){
					const channelId = SelectedChannelStore.getChannelId();
					const authors = supportChannels[channelId];
					if(authors === undefined) return;
					const showInfo = ()=>{
						popupLastShownTime[channelId] = Date.now();
						PluginUtilities.saveData(this.getName(), "popupLastShownTime", popupLastShownTime);
						this.showGeneralInformation(authors);
					}
					if(this.settings.showHelpButton && !document.getElementById("l0c4lh057-issue-helper")){
						let module1 = WebpackModules.getByProps("buttons","textArea","textAreaSlate");
						let module2 = WebpackModules.getByProps("active","button","buttonWrapper");
						let module3 = WebpackModules.getByProps("button","colorBrand","lookBlank","grow");
						let module4 = WebpackModules.getByProps("button","buttonContainer","channelTextArea")
						let buttons = document.getElementsByClassName(module1.buttons)[0];
						let button = document.createElement("button");
						button.id = "l0c4lh057-issue-helper";
						button.classList.add(...module4.buttonContainer.split(" "), ...module3.button.split(" "), ...module3.lookBlank.split(" "), ...module3.colorBrand.split(" "), ...module3.grow.split(" "));
						button.innerHTML = `
										<div class="${module3.contents} ${module2.button} ${module1.button}">
												<svg width="24" height="24" class="${module2.icon}" viewBox="0 0 24 24">
														<path fill="currentColor" d="M 1.5999999,1.9999999 C 0.71360003,1.9999999 0,2.7136012 0,3.5999986 V 20.399997 c 0,0.886401 0.71360003,1.600002 1.5999999,1.600002 H 22.399998 c 0.886399,0 1.600001,-0.713601 1.600001,-1.600002 V 3.5999986 c 0,-0.8863974 -0.713602,-1.5999987 -1.600001,-1.5999987 z M 2.4653123,9.1545317 H 3.601953 V 11.397107 H 5.7523433 V 9.1545317 H 6.8812496 V 14.845468 H 5.7523433 V 12.387811 H 3.601953 v 2.457657 H 2.4653123 Z m 5.8137498,0 H 11.765781 V 10.106874 H 9.4157028 v 1.31328 h 1.9967962 v 0.952342 H 9.4157028 v 1.520625 h 2.4345312 v 0.952347 H 8.2790621 Z m 4.7232029,0 h 1.136641 v 4.7385893 h 2.31164 v 0.952347 h -3.448281 z m 4.438984,0 H 19.3075 c 1.25952,0 2.227186,0.4454513 2.227186,1.7894513 0,1.297919 -0.975364,1.881641 -2.196484,1.881641 h -0.760311 v 2.019844 h -1.136642 z m 1.136642,0.9062473 v 1.866251 h 0.683515 c 0.78336,0 1.159686,-0.330255 1.159686,-0.983047 0,-0.66048 -0.414687,-0.883204 -1.198046,-0.883204 z"></path>
												</svg>
										</div>`;
						button.addEventListener("click", showInfo);
						buttons.insertAdjacentElement("afterbegin", button);
					}
					if(this.settings.automaticallyShowHelpPopup){
						const lastShown = popupLastShownTime[channelId] || 0;
						if((lastShown + 7*24*60*60*1000) > Date.now()) return;
						showInfo();
					}
				}
				
				showGeneralInformation(authors){
					if(!Array.isArray(authors)) authors = [authors];
					let steps = [
						"Reload discord (CTRL+R) - that will fix most of your problems.",
						"If you have a problem with AccountSwitcher, try removing and then saving the account again.",
						"Check the support channel for related issues. If it already got reported there is no need to write a full report. Just refer to the previous report and give some information and screenshots of the error messages you get.",
						"(Check GitHub for related issues)"
					];
					if(authors.every(author=>author!=="l0c4lh057")||!getPlugin("AccountSwitcher")) steps = steps.filter(step => !step.includes("AccountSwitcher"));
					Api.Modals.showModal(
						"How to ask for support",
						React.createElement(
							"div",
							{
								className: classNames.colorStandard
							},
							"Before asking for support you should make sure that you performed the following steps:",
							React.createElement(
								"ol",
								{
									style:{
										marginLeft: 20,
										marginTop: 10,
										marginBottom: 10,
										listStyleType: "decimal"
									}
								},
								steps.map(step => React.createElement("li", {}, step))
							),
							React.createElement("b", {}, "If you want to reopen this modal later just click the HELP button in the chatbox next to the gif, emoji and gift button.")
						),
						{
							confirmText: "I did all of the above",
							onConfirm: ()=>this.showIssueTemplate(authors)
						}
					);
				}
				
				showIssueTemplate(authors){
					let closeModal = ()=>{};
					
					const SectionTitle = props=>React.createElement(
						"div",
						{className: classNames.sectionTitle},
						props.title
					);
					
					const PluginSelector = props=>React.createElement(
						"div",
						{},
						React.createElement(SectionTitle, {title: "Plugin"}),
						React.createElement(
							Dropdown,
							{
								clearable: false,
								searchable: false,
								options: props.plugins.map(pl=>({label:`${pl.getName()} v${pl.getVersion()}`, value: pl})),
								value: props.selectedPlugin,
								onChange: e=>props.selectPlugin(e.value)
							}
						),
						!BdApi.Plugins.isEnabled(props.selectedPlugin.getName()) && React.createElement("b", {}, "The plugin is not enabled. Please make sure the issue still persists after enabling the plugin!")
					);
					
					const KnownIssueList = props=>props.knownIssues.length > 0 && React.createElement(
						"div",
						{},
						React.createElement(SectionTitle, {title: "Known Issues"}),
						React.createElement(
							Dropdown,
							{
								clearable: false,
								searchable: false,
								options: [...props.knownIssues, issueOther].map(issue=>({label: issue.title, value: issue})),
								value: props.selectedKnownIssue,
								onChange: e=>props.selectKnownIssue(e.value)
							}
						)
					);
					
					const Input = props=>React.createElement(Textbox, {
						value: props.element,
						placeholder: props.getPlaceholder(props.index),
						error: typeof props.isValid === "function" && !props.isValid(props.element),
						onChange: value=>props.onChange(props.index, value)
					});
					
					const InputList = props=>React.createElement(
						"div",
						{},
						React.createElement(SectionTitle, {title: props.name}),
						React.createElement(
							"div",
							{},
							...props.elements.map((element,index) => React.createElement(Input, {element, index, onChange: props.onChange, getPlaceholder: props.getPlaceholder, isValid: props.isValid})),
							React.createElement(Input, {element: "", index: props.elements.length, onChange: props.onChange, getPlaceholder: props.getPlaceholder, isValid: props.isValid})
						)
					);
					
					const OneLineInput = props=>React.createElement(
						"div",
						{},
						React.createElement(SectionTitle, {title: props.name}),
						React.createElement(Textbox, {
							error: props.missing,
							placeholder: props.placeholder,
							value: props.value,
							onChange: props.onChange
						})
					);
					
					const MultiLineInput = props=>React.createElement(
						"div",
						{},
						React.createElement(SectionTitle, {title: props.name}),
						React.createElement("textarea", {
							className: [classNames.input, classNames.textArea, classNames.resizeable, classNames.scrollbar].join(" ") + (props.missing ? " " + classNames.error : ""),
							style: {minWidth: "-webkit-fill-available", maxWidth: "-webkit-fill-available", height: 100, minHeight: 43},
							placeholder: props.placeholder,
							value: props.value,
							onChange: props.onChange
						})
					);
					
					const Alert = class extends React.Component {
						constructor(props){
							super(props);
							const availablePlugins = getAllPlugins().filter(pl=>props.authors.includes("*") || pl.getAuthors().some(plAuthor => props.authors.includes(plAuthor)));
							if(stateCache[props.channelId] && availablePlugins.some(pl=>pl.getName()===stateCache[props.channelId].selectedPlugin.getName())){
								this.state = Object.assign(stateCache[props.channelId], {
									// updating available plugins in case a plugin got installed or removed
									availablePlugins,
									// updating the selected plugin in case it got updated in the meantime
									selectedPlugin: availablePlugins.find(pl=>pl.getName()===stateCache[props.channelId].selectedPlugin.getName())
								});
							}else{
								this.state = {
									authors: props.authors,
									availablePlugins,
									selectedPlugin: availablePlugins[0],
									knownIssues: (knownIssues[(availablePlugins[0]||{getName:_=>_}).getName()]||[]).filter(i => i.version === undefined || (typeof i.version==="string" ? i.version === availablePlugins[0].getVersion() : i.version.test(availablePlugins[0].getVersion))),
									selectedKnownIssue: issueOther,
									title: "",
									description: "",
									steps: [],
									expectedBehavior: "",
									additionalContext: "",
									screenshots: [],
									descriptionMissing: false,
									titleMissing: false
								};
							}
						}
						render(){
							const hasPlugin = !!this.state.selectedPlugin;
							const issueIsKnown = this.state.selectedKnownIssue.title !== "Other";
							let contentElement;
							if(!hasPlugin){
								contentElement = React.createElement(
									"div",
									{className: classNames.colorStandard},
									React.createElement("b", {}, "You don't have any plugin made by this author")
								);
							}else{
								contentElement = React.createElement(
									"div",
									{
										className: classNames.colorStandard,
										style: {textAlign: "start"}
									},
									React.createElement(PluginSelector, {
										plugins: this.state.availablePlugins,
										selectedPlugin: this.state.selectedPlugin,
										selectPlugin: this.selectPlugin.bind(this)
									}),
									React.createElement(KnownIssueList, {
										knownIssues: this.state.knownIssues,
										selectedKnownIssue: this.state.selectedKnownIssue,
										selectKnownIssue: this.selectKnownIssue.bind(this)
									}),
									!issueIsKnown && React.createElement(OneLineInput, {
										name: "Title",
										placeholder: "Short issue description",
										value: this.state.title,
										missing: this.state.titleMissing,
										onChange: value=>this.setState({title: value, titleMissing: false}, ()=>stateCache[this.props.channelId]=this.state)
									}),
									!issueIsKnown && React.createElement(MultiLineInput, {
										name: "Description",
										placeholder: "A clear and concise description of what the bug is.",
										value: this.state.description,
										missing: this.state.descriptionMissing,
										onChange: e=>this.setState({description: e.target.value, descriptionMissing: false}, ()=>stateCache[this.props.channelId]=this.state)
									}),
									!issueIsKnown && React.createElement(InputList, {
										name: "Steps to reproduce the issue",
										elements: this.state.steps,
										getPlaceholder: i=>`Step ${i+1}`,
										onChange: this.editStep.bind(this)
									}),
									!issueIsKnown && React.createElement(MultiLineInput, {
										name: "Expected behavior",
										placeholder: "A clear and concise description of what you expect to happen.",
										value: this.state.expectedBehavior,
										onChange: e=>this.setState({expectedBehavior: e.target.value}, ()=>stateCache[this.props.channelId]=this.state)
									}),
									React.createElement(MultiLineInput, {
										name: "Additional context",
										placeholder: "Add any other context about the problem here.",
										value: this.state.additionalContext,
										onChange: e=>this.setState({additionalContext: e.target.value}, ()=>stateCache[this.props.channelId]=this.state)
									}),
									React.createElement(InputList, {
										name: "Screenshots",
										elements: this.state.screenshots,
										getPlaceholder: i=>"Link to a screenshot",
										isValid: this.isScreenshotLinkValid.bind(this),
										onChange: this.setScreenshot.bind(this)
									})
								);
							}
							return React.createElement(
								DeprecatedModal,
								{
									size: DeprecatedModal.Sizes.LARGE,
									tag: "form",
									className: classNames.container
								},
								React.createElement(
									DeprecatedModal.Content,
									{
										className: classNames.content
									},
									React.createElement(
										"div",
										{},
										React.createElement(
											FormTitle,
											{tag: "h2"},
											"Submit Issue"
										)
									),
									contentElement
								),
								React.createElement(
									DeprecatedModal.Footer,
									{},
									React.createElement(
										Button,
										{
											onClick: hasPlugin ? this.handleSubmitClick.bind(this) : closeModal
										},
										hasPlugin ? "Submit" : "Close"
									)
								)
							);
						}
						selectPlugin(plugin){
							this.setState({
								selectedPlugin: plugin,
								knownIssues: (knownIssues[plugin.getName()] || []).filter(i => i.version === undefined || (typeof i.version==="string" ? i.version === plugin.getVersion() : i.version.test(plugin.getVersion))),
								selectedKnownIssue: issueOther
							}, ()=>stateCache[this.props.channelId]=this.state);
						}
						selectKnownIssue(issue){
							this.setState({selectedKnownIssue: issue}, ()=>{
								if(issue.solution){
									delete stateCache[this.props.channelId];
									closeModal();
								}else{
									stateCache[this.props.channelId]=this.state;
								}
							});
							if(issue.solution){
								const body = !Array.isArray(issue.solution) ? issue.solution : React.createElement(
									"ol",
									{
										style: {
											marginLeft: 20,
											marginTop: 10,
											marginBottom: 10,
											listStyleType: "decimal"
										}
									},
									issue.solution.map(step=>React.createElement("li", {}, step))
								);
								Api.Modals.showModal("Solution", React.createElement("div", {className: classNames.colorStandard}, body));
							}
						}
						editStep(index, value){
							let state = this.state;
							state.steps[index] = value;
							state.steps = state.steps.filter(step=>step.length>0);
							this.setState(state, ()=>stateCache[this.props.channelId]=this.state);
						}
						setScreenshot(index, value){
							let state = this.state;
							state.screenshots[index] = value;
							state.screenshots = state.screenshots.filter(link=>link.length>0)
							this.setState(state, ()=>stateCache[this.props.channelId]=this.state);
						}
						isScreenshotLinkValid(link){
							return link===""||/^https?:\/\/[^\.]+\..*[^\.]\/.+/.test(link.trim());
						}
						handleSubmitClick(e){
							let submit = true;
							if(this.state.selectedKnownIssue.title === "Other"){
								if(!this.state.title.trim()){
									submit = false;
									this.setState({titleMissing: true}, ()=>stateCache[this.props.channelId]=this.state);
								}
								if(!this.state.description.trim()){
									submit = false;
									this.setState({descriptionMissing: true}, ()=>stateCache[this.props.channelId]=this.state);
								}	
							}
							if(this.state.screenshots.some(link=>!this.isScreenshotLinkValid(link))){
								submit = false;
							}
							if(submit){
								this.sendMessage();
								delete stateCache[this.props.channelId];
							}
						}
						getMessage(){
							return this.getTitle() + this.getDescription() + this.getSteps() + this.getExpectedBehavior() + this.getInformation() + this.getAdditionalContext() + this.getScreenshots();
						}
						sendMessage(){
							// TODO: check for 2000 character limit
							WebpackModules.getByProps("sendMessage").sendMessage(this.props.channelId, {content: this.getMessage()});
							closeModal();
						}
						getTitle(){
							if(this.state.selectedKnownIssue.title !== "Other") return "**[" + this.state.selectedPlugin.getName() + "] Issue: " + this.state.selectedKnownIssue.title + "**";
							else return "**[" + this.state.selectedPlugin.getName() + "] Issue: " + this.state.title.trim().replace(/ {2,}/g, " ") + "**";
						}
						getDescription(){
							if(this.state.selectedKnownIssue.title !== "Other") return "";
							let description = this.state.description.split("\n").map(l=>l.trim()).join("\n").trim().replace(/\n{3,}/g, "\n\n");
							if(description.length > 0) return "\n\n**Bug description**\n" + description;
							else return "";
						}
						getSteps(){
							if(this.state.selectedKnownIssue.title !== "Other") return "";
							let steps = this.state.steps.map(step=>step.trim()).filter(step=>step);
							if(steps.length > 0) return "\n\n**Steps to reproduce**\n" + steps.map((step,i)=>(i+1)+". "+step).join("\n");
							else return "";
						}
						getExpectedBehavior(){
							if(this.state.selectedKnownIssue.title !== "Other") return "";
							let behavior = this.state.expectedBehavior.split("\n").map(l=>l.trim()).join("\n").trim().replace(/\n{3,}/g, "\n\n");
							if(behavior) return "\n\n**Expected Behavior**\n" + behavior;
							else return "";
						}
						getInformation(){
							return `\n\n**Information**
- Versions:
	\\* Plugin: ${this.state.selectedPlugin.getVersion()}
	\\* BBD: ${isPowercord() ? "Powercord" : BdApi.getBDData("version")}
	\\* ZLibrary: ${(getPlugin("ZeresPluginLibrary")||{getVersion:()=>"not installed"}).getVersion()}
	\\* Release channel: ${WebpackModules.getByProps("releaseChannel").releaseChannel}
	\\* Build ID: ${GLOBAL_ENV.SENTRY_TAGS.buildId}
- OS: ${(os=>os==="win32"?"Windows":os==="darwin"?"MacOS":os==="linux"?"Linux":os)(require("os").platform())}
- Compact mode: ${WebpackModules.getByProps("customStatus","renderSpoilers","messageDisplayCompact").messageDisplayCompact?"yes":"no"}
- Plugin enabled: ${BdApi.Plugins.isEnabled(this.state.selectedPlugin.getName())?"yes":"no"}`
							+ (this.state.selectedPlugin.getName()==="AccountSwitcher"?`\n- Encryption enabled: ${this.state.selectedPlugin.getInstance().settings.encrypted?"yes":"no"}`:"");
						}
						getAdditionalContext(){
							let context = this.state.additionalContext.split("\n").map(l=>l.trim()).join("\n").trim().replace(/\n{3,}/g, "\n\n");
							if(context) return "\n\n**Additional context**\n" + context;
							else return "";
						}
						getScreenshots(){
							let screenshots = this.state.screenshots.map(l=>l.trim()).filter(l=>l);
							if(screenshots.length > 0) return "\n\n**Screenshots**\n" + screenshots.map(l=>"- "+l).join("\n");
							return "";
						}
					};
					
					let modalId = Modals.openModal(props => {
						return React.createElement(
							WebpackModules.getByProps("ModalRoot").ModalRoot,
							{
								size: "large",
								transitionState: props.transitionState
							},
							React.createElement(Alert, {authors, channelId: WebpackModules.getByProps("getChannelId").getChannelId()})
						);
					});
					closeModal = ()=>Modals.closeModal(modalId);
				}
				
				async loadIssuesAndSupportChannels(){
					return new Promise((resolve, reject) => {
						require("request").get("https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/BugReportHelper/data.json", (error, response, body) => {
							if(error) reject(error);
							else resolve(JSON.parse(body));
						});
					});
				}
				
				getSettingsPanel(){
					return this.buildSettingsPanel().getElement();
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
