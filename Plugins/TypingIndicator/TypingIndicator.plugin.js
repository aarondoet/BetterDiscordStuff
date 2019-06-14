//META{"name":"TypingIndicator","displayName":"TypingIndicator","website":"https://twitter.com/l0c4lh057/"}*//

var TypingIndicator = (() => {
    const config = {
        info:{
            name: "TypingIndicator",
            authors: [{name: "l0c4lh057", github_username: "l0c4lh057", twitter_username: "l0c4lh057", discord_id: "226677096091484160"}],
            description: "Shows an indicator in the guild/channel list when someone is typing there",
            version: "0.1.1",
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
                name: "Include muted channels",
                note: "With this option enabled even muted channels have the typing indicator (default: false)",
                value: false
            },
            {
                type: "switch",
                id: "guilds",
                name: "Show on guilds",
                note: "With this option enabled the the indicator is shown on guild icons when someone is typing in any of the channels of it (default: false)",
                value: false
            }
        ],
        changelog:[
            {
                "title": "Changed",
                "items": ["Added actual plugin description and not just the placeholder"]
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
                    children: [TextElement({color: TextElement.Colors.PRIMARY, children: [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`]})],
                    red: false,
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                            if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                            await new Promise(r => require("fs").writeFile(require("path").join(ContentManager.pluginsFolder, "0PluginLibrary.plugin.js"), body, r));
                        });
                    }
                }, props));
            });
        }
        start(){}
        stop(){}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {DiscordSelectors, WebpackModules, DiscordModules, Patcher, ReactComponents, PluginUtilities, ReactTools, DiscordClasses} = Api;
            const React = DiscordModules.React;
            const MutedStore = WebpackModules.getByProps("isMuted", "isChannelMuted");
            const Flux = WebpackModules.getByProps("connectStores");
            
            renderElement = ({cnt,opacity})=>{
                return cnt < 1 ? null : React.createElement(WebpackModules.getByDisplayName("Spinner"), {
                    type: "pulsingEllipsis",
                    style: {
                        marginLeft: 5,
                        opacity: opacity || 0.7
                    }
                });
            }
            
            return class TypingIndicator extends Plugin {
                onStart(){
                    PluginUtilities.addStyle("typingindicator-css", `
                        .listItem-2P_4kh .spinner-2enMB9 {
                            position: absolute;
                            bottom: 0;
                            border-radius: 1vh;
                            background-color: #888;
                            box-shadow: 0px 0px 8px 4px #888;
                            pointer-events: none;
                        }
                        .listItem-2P_4kh .spinner-2enMB9 .pulsingEllipsisItem-32hhWL {
                            background-color: white;
                        }
                    `);
                    /*this.settings = {
                        channels: true,
                        includeMuted: true,
                        guilds: true
                    }*/
                    this.promises = {state:{cancelled: false}, cancel(){this.state.cancelled = true;}};
                    this.patchChannelList(this.promises.state);
                    this.patchGuildList(this.promises.state);
                    DiscordModules.UserTypingStore.addChangeListener(this.changeListener);
                }
                onStop(){
                    PluginUtilities.removeStyle("typingindicator-css");
                    Patcher.unpatchAll();
                    this.promises.cancel();
                    DiscordModules.UserTypingStore.removeChangeListener(this.changeListener);
                }
                
                async patchChannelList(promiseState){
                    const TextChannel = await ReactComponents.getComponentByName("TextChannel", DiscordSelectors.ChannelList.containerDefault);
                    if(promiseState.cancelled) return;
                    Patcher.after(TextChannel.component.prototype, "render", (thisObject, _, returnValue) => {
                        let channelData = thisObject.props;
                        if(channelData.selected) return;
                        if(channelData.muted && !this.settings.includeMuted) return;
                        let typingUsers = Object.keys(DiscordModules.UserTypingStore.getTypingUsers(channelData.channel.id));
                        returnValue.props.children.props.children.push(React.createElement(renderElement, {cnt: typingUsers.length}));
                    });
                    TextChannel.forceUpdateAll();
                }
                
                async patchGuildList(promiseState){
                    const Guild = await ReactComponents.getComponentByName("Guild", ".listItem-2P_4kh");
                    if(promiseState.cancelled) return;
                    Patcher.after(Guild.component.prototype, "render", (thisObject, _, returnValue) => {
                        let guildData = thisObject.props;
                        if(guildData.selected) return;
                        if(!this.settings.guilds) return;
                        let cnt = Object.values(DiscordModules.ChannelStore.getChannels())
                                        .filter(c => c.guild_id == guildData.guild.id && c.type != 2)
                                        .filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
                                        .map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id)).length)
                                        .reduce((a,b) => a+b);
                        returnValue.props.children.props.children.push(React.createElement(renderElement, {cnt,opacity:1}));
                    });
                    Guild.forceUpdateAll();
                    this.updateAll = Guild.forceUpdateAll;
                }
                
                changeListener(){
                    for(let el of document.getElementsByClassName("listItem-2P_4kh")){
                        (ReactTools.getOwnerInstance(el) || {forceUpdate(){}}).forceUpdate();
                    }
                    for(let el of document.getElementsByClassName(DiscordClasses.ChannelList.containerDefault.value)){
                        (ReactTools.getOwnerInstance(el) || {forceUpdate(){}}).forceUpdate();
                    }
                }
                
                getSettingsPanel(){
                    return this.buildSettingsPanel().getElement();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
