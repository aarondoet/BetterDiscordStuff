//META{"name":"TypingIndicator","displayName":"TypingIndicator","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/TypingIndicator/TypingIndicator.plugin.js"}*//

var TypingIndicator = (() => {
    const config = {
        info:{
            name: "TypingIndicator",
            authors: [{name: "l0c4lh057", github_username: "l0c4lh057", twitter_username: "l0c4lh057", discord_id: "226677096091484160"}],
            description: "Shows an indicator in the guild/channel list when someone is typing there",
            version: "0.2.1",
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
                "title": "Added",
                "items": ["Added compatibility with discord native server folders. This feature is disabled by default, you need to enable it in the settings to use it."]
            },
            {
                "title": "Fixed",
                "type": "fixed",
                "items": ["An error in the code, idk if that was causing crashes (I don't think it should, but someone always crashed)"]
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
            const {DiscordSelectors, WebpackModules, DiscordModules, Patcher, ReactComponents, PluginUtilities} = Api;
            const Flux = WebpackModules.getByProps("connectStores");
            const React = DiscordModules.React;
            const MutedStore = WebpackModules.getByProps("isMuted", "isChannelMuted");
            
            renderElement = ({cnt,opacity,type})=>{
                return cnt < 1 ? null : React.createElement(WebpackModules.getByDisplayName("Spinner"), {
                    type: "pulsingEllipsis",
                    className: "typingindicator-" + type,
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
                    Patcher.after(TextChannel.component.prototype, "render", (thisObject, _, returnValue) => {
                        let channelData = thisObject.props;
                        if(channelData.selected) return;
                        if(channelData.muted && !this.settings.includeMuted) return;
                        const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.keys(DiscordModules.UserTypingStore.getTypingUsers(channelData.channel.id)).length}));
                        const wrappedCount = fluxWrapper(({count}) => {
                            return React.createElement(renderElement, {cnt: count, opacity: 0.7, type: "channel"});
                        });
                        returnValue.props.children.props.children.push(React.createElement(wrappedCount));
                    });
                    TextChannel.forceUpdateAll();
                }
                
                async patchGuildList(promiseState){
                    const Guild = await ReactComponents.getComponentByName("Guild", "." + ZLibrary.WebpackModules.getByProps("badgeIcon", "circleIcon", "friendsOnline", "guildSeparator", "listItem", "selected").listItem.replace(" ", "."));
                    if(promiseState.cancelled) return;
                    Patcher.after(Guild.component.prototype, "render", (thisObject, _, returnValue) => {
                        let guildData = thisObject.props;
                        if(guildData.selected) return;
                        if(!this.settings.guilds) return;
                        if(MutedStore.isMuted(guildData.guild.id) && !this.settings.includeMuted) return;
                        const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.values(DiscordModules.ChannelStore.getChannels())
                                .filter(c => c.guild_id == guildData.guild.id && c.type != 2)
                                .filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
                                .map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id)).length)
                                .reduce((a,b) => a+b)
                        }));
                        const wrappedCount = fluxWrapper(({count}) => {
                            return React.createElement(renderElement, {cnt: count, opacity: 1, type: "guild"});
                        });
                        returnValue.props.children.props.children.push(React.createElement(wrappedCount));
                    });
                    Guild.forceUpdateAll();
                }
                
                async patchHomeIcon(promiseState){
                    const Home = await ReactComponents.getComponentByName("TutorialIndicator", "." + ZLibrary.WebpackModules.getByProps("badgeIcon", "circleIcon", "friendsOnline", "guildSeparator", "listItem", "selected").listItem.replace(/ /g, "."));
                    if(promiseState.cancelled) return;
                    Patcher.after(Home.component.prototype, "render", (thisObject, _, returnValue) => {
                        if(!returnValue.props.children) return;
                        if(!returnValue.props.children.props) return;
                        if(!returnValue.props.children.props.children) return;
                        if(!this.settings.dms) return;
                        if(!DiscordModules.SelectedGuildStore.getGuildId()) return;
                        const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.values(DiscordModules.ChannelStore.getChannels())
                            .filter(c => !c.guild_id)
                            .filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(null, c.id))
                            .map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id)).length)
                            .reduce((a,b) => a+b)}));
                        const wrappedCount = fluxWrapper(({count}) => {
                            return React.createElement(renderElement, {cnt: count, opacity: 1, type: "dms"});
                        });
                        DiscordModules.React.Children.toArray(returnValue.props.children.props.children);
                        if(returnValue.props.children.props.children.push)
                            returnValue.props.children.props.children.push(React.createElement(wrappedCount));
                    });
                    Home.forceUpdateAll();
                }
                
                async patchFolders(promiseState){
                    const Folder = await ReactComponents.getComponentByName("GuildFolder", "." + ZLibrary.WebpackModules.getByProps("animationDuration", "folder", "guildIcon", "wrapper").wrapper.replace(/ /g, "."));
                    if(promiseState.cancelled) return;
                    Patcher.after(Folder.component.prototype, "render", (thisObject, _, returnValue) => {
                        if(thisObject.props.expanded) return;
                        if(!this.settings.folders) return;
                        const fluxWrapper = Flux.connectStores([DiscordModules.UserTypingStore], ()=>({count: Object.values(DiscordModules.ChannelStore.getChannels())
                                .filter(c => thisObject.props.guildIds.includes(c.guild_id))
                                .filter(c => c.type != 2)
                                .filter(c => this.settings.includeMuted || !MutedStore.isChannelMuted(c.guild_id, c.id))
                                .filter(c => this.settings.includeMuted || !MutedStore.isMuted(c.guild_id))
                                .filter(c => DiscordModules.SelectedGuildStore.getGuildId() != c.guild_id)
                                .map(c => Object.keys(DiscordModules.UserTypingStore.getTypingUsers(c.id)).length)
                                .reduce((a,b) => a+b)
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
