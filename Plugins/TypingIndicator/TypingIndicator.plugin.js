//META{"name":"TypingIndicator","displayName":"TypingIndicator","website":"https://twitter.com/l0c4lh057/"}*//

class TypingIndicator {
	getName(){return "TypingIndicator";}
	getAuthor(){return "l0c4lh057";}
	getVersion(){return "0.0.1";}
	getDescription(){return "Shows in the channel list when someone is typing in the channel";}
	
    load(){
        if(!document.getElementById("0b53rv3r5cr1p7")){
            let observerScript = document.createElement("script");
            observerScript.id = "0b53rv3r5cr1p7";
            observerScript.type = "text/javascript";
            observerScript.src = "https://l0c4lh057.github.io/BetterDiscord/Plugins/Scripts/pluginlist.js";
            document.head.appendChild(observerScript);
        }
    }
    
    start(){
        var libraryScript = document.getElementById("ZLibraryScript");
        if (!libraryScript || !window.ZLibrary) {
            libraryScript = document.createElement("script");
            libraryScript.setAttribute("type", "text/javascript");
            libraryScript.setAttribute("src", "https://rauenzi.github.io/BDPluginLibrary/release/ZLibrary.js");
            libraryScript.setAttribute("id", "ZLibraryScript");
            document.head.appendChild(libraryScript);
        }
        if (window.ZLibrary) this.initialize();
        else libraryScript.addEventListener("load", () => {this.initialize();});
    }
    
	initialize(){
        ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/TypingIndicator/TypingIndicator.plugin.js");
        this.updateAnimations();
        this.startTimer();
        ZLibrary.PluginUtilities.addStyle("channeltyping-css", `
            .containerDefault-1ZnADq .spinner-2enMB9 {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
            }
            .containerDefault-1ZnADq.selected-37j_iU .spinner-2enMB9, .containerDefault-1ZnADq:hover .spinner-2enMB9 {
                display: none;
            }
        `);
    }
    
    stop(){
        this.stopTimer();
        ZLibrary.PluginUtilities.removeStyle("channeltyping-css");
    }
    
    onSwitch(){
        this.stopTimer();
        this.updateAnimations();
        this.startTimer();
    }
    
    stopTimer(){
        window.clearInterval(this.timer);
    }
    
    startTimer(){
        this.timer = window.setInterval(()=>this.updateAnimations(), 500);
    }
    
    updateAnimations(){
        let gId = ZLibrary.DiscordModules.SelectedGuildStore.getGuildId();
        if(!gId) return;
        for(let channelElement of document.getElementsByClassName("containerDefault-1ZnADq")){
            let channelData = ZLibrary.ReactTools.getReactProperty(channelElement, "return.stateNode.props.channel");
            if(!channelData) continue;
            let cId = channelData.id;
            let typingUsers = Object.keys(ZLibrary.DiscordModules.UserTypingStore.getTypingUsers(cId));
            let spinners = channelElement.getElementsByClassName("spinner-2enMB9");
            if(typingUsers.length > 0 && spinners.length == 0){
                $(`<span class="spinner-2enMB9 da-spinner ellipsis-19qdx6 da-ellipsis">
                    <span class="inner-1gJC7_ da-inner pulsingEllipsis-3YiXRF da-pulsingEllipsis">
                        <span class="pulsingEllipsisItem-32hhWL da-pulsingEllipsisItem spinnerItem-2HfQC8 da-spinnerItem"></span>
                        <span class="pulsingEllipsisItem-32hhWL da-pulsingEllipsisItem spinnerItem-2HfQC8 da-spinnerItem"></span>
                        <span class="pulsingEllipsisItem-32hhWL da-pulsingEllipsisItem spinnerItem-2HfQC8 da-spinnerItem"></span>
                    </span>
                </span>`).appendTo(channelElement);
            }else if(typingUsers.length == 0 && spinners.length > 0){
                $(channelElement.getElementsByClassName("spinner-2enMB9")).remove();
            }
        }
    }
}
