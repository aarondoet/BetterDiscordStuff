//META{"name":"AccountSwitcher","displayName":"AccountSwitcher","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/AccountSwitcher/AccountSwitcher.plugin.js"}*//

class AccountSwitcher {
	getName(){return "AccountSwitcher";}
	getAuthor(){return "l0c4lh057";}
	getVersion(){return "1.0.3";}
	getDescription(){return "Switch between multiple accounts with AltLeft+1 up to AltLeft+0";}
	
	
	get defaultSettings(){
		return {
			name1: "",
			token1: "",
			avatar1: "",
			name2: "",
			token2: "",
			avatar2: "",
			name3: "",
			token3: "",
			avatar3: "",
			name4: "",
			token4: "",
			avatar4: "",
			name5: "",
			token5: "",
			avatar5: "",
			name6: "",
			token6: "",
			avatar6: "",
			name7: "",
			token7: "",
			avatar7: "",
			name8: "",
			token8: "",
			avatar8: "",
			name9: "",
			token9: "",
			avatar9: "",
			name10: "",
			token10: "",
			avatar10: "",
			switchedTo: "",
			encrypted: false,
			lastUsedVersion: "0.0.0"
		}
	}
	
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
		if(!document.getElementById("accountswitcher-cryptlib")){
			let cryptLib = document.createElement("script");
			cryptLib.id = "accountswitcher-cryptlib";
			cryptLib.type = "text/javascript";
			cryptLib.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js";
			document.head.appendChild(cryptLib);
		}
		let libLoadedEvent = () => {
            try{ this.onLibLoaded(); }
            catch(err) { console.error(this.getName(), "fatal error, plugin could not be started!", err); try { this.stop(); } catch(err) { console.error(this.getName() + ".stop()", err); } }
        };
		let lib = document.getElementById("NeatoBurritoLibrary");
		if(!lib) {
			lib = document.createElement("script");
			lib.id = "NeatoBurritoLibrary";
			lib.type = "text/javascript";
			lib.src = "https://rawgit.com/Metalloriff/BetterDiscordPlugins/master/Lib/NeatoBurritoLibrary.js";
			document.head.appendChild(lib);
		}
        if(typeof window.NeatoLib !== "undefined") libLoadedEvent();
		else lib.addEventListener("load", libLoadedEvent);
	}
	onLibLoaded(){
		NeatoLib.Updates.check(this, "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/AccountSwitcher/AccountSwitcher.plugin.js");
		this.AccountManager = NeatoLib.Modules.get(["loginToken"]);
		this.UserInfoStore = NeatoLib.Modules.get(["getToken"]);
		this.settings = NeatoLib.Settings.load(this, this.defaultSettings);
		this.registerKeybinds();
		if(this.settings.lastUsedVersion != this.getVersion() && this.settings.lastUsedVersion != "1.0.0" && this.settings.lastUsedVersion != "1.0.1" && this.settings.lastUsedVersion != "1.0.2"){
			this.settings.lastUsedVersion = this.getVersion();
			this.alertText("Changelog", `
			You can now add a password in the settings to encrypt your tokens. To enable this go to the plugin settings and enable  &quot;encryption&quot;.<br>
			Your tokens are all saved in the plugin's settings file and if you don't set a password they are saved in clear text. Every program on your computer can access this file and get all tokens at once.<br>
			You will get asked for the password if you want to switch the account or open the settings.<br>
			But don't forget your password! You can't recover the tokens in case you forgot it.<br>
			You can go to settings and disable the encryption feature to reset your password, but all the tokens are gone.<br>
			<br>
			You now can select accounts by middle clicking on your avatar at the bottom (where mute and settings are). An account selection will pop up and you can switch your account.<br>
			In the list there are all account listed the plugin know the avatar of. Avatars get detected automatically
			<ul style="list-style:circle inside;">
				<li>when you switch your account using this plugin,</li>
				<li>when the plugin starts while you are using an account that is in your account list and you have encryption disabled and</li>
				<li>when you add the account you are currently using to your account list.</li>
			</ul>
			`);
		}else if(this.settings.lastUsedVersion != this.getVersion()){
			this.settings.lastUsedVersion = this.getVersion();
			this.alertText("Changelog", `If you switch your account &quot;AccountDetailsPlus&quot; restarts (if you have it enabled). It reads your username when starting and displays it even after switching your account. With restarting the plugin this should not happen anymore.`);
		}
		if(!this.settings.encrypted){
			let token = this.UserInfoStore.getToken();
			for(let i = 1; i < 11; i++){
				if(this.settings["token" + i] == token){
					this.settings["avatar" + i] = NeatoLib.Modules.get(["getCurrentUser"]).getCurrentUser().avatarURL || "";
				}
			}
		}
		this.saveSettings();
		$(document.body).on("auxclick.accountswitcher", e => {
			if(!e.target.hasClass) return;
			if(!e.target.hasClass("inner-1W0Bkn")) return;
			if(e.which == 2) this.openSwitchMenu(e);
		});
		NeatoLib.injectCSS(`
			.accountswitcher-switchmenu {
				position: fixed;
				width: auto;
				height: auto;
				background-color: #202225;
				border-radius: 10px;
				overflow: hidden;
				z-index: 9001;
			}
			.accountswitcher-menuavatar {
				width: 64px;
				height: 64px;
				margin: 10px;
				display: inline;
			}
		`);
	}
	stop(){
		this.unregisterKeybinds();
		$(document.body).off("auxclick.accountswitcher");
	}
	onSwitch(){
		if(this.settings.switchedTo != ""){
			let switchedTo = this.settings.switchedTo;
			this.settings.switchedTo = "";
			this.saveSettings();
			for(let i = 1; i < 11; i++){
				if(this.settings["token" + i] == switchedTo){
					this.settings["avatar" + i] = NeatoLib.Modules.get(["getCurrentUser"]).getCurrentUser().avatarURL || "";
				}
			}
		}
	}
	
	saveSettings() {
		NeatoLib.Settings.save(this);
	}


	openSwitchMenu(e){
		let menu = $(`<div class="accountswitcher-switchmenu"></div>`)[0];
		$(menu).css("bottom", (e.target.offset().bottom - e.target.offset().top + 27) + "px").css("left", (e.target.offset().left - 5) + "px");
		let count = 0;
		for(let i = 1; i < 11; i++){
			if(this.settings["avatar" + i] != ""){
				let av = $(`<img src="${this.settings["avatar" + i]}" class="accountswitcher-menuavatar">`)[0];
				av.on("click", ()=>{
					this.login(i);
				});
				menu.appendChild(av);
				NeatoLib.Tooltip.attach(this.settings["name" + i] != "" ? this.settings["name" + i] : "No name set", av);
				count++;
			}
		}
		document.body.appendChild(menu);
		$(document.body).on("click.accountswitchermenu", e2 => {
			if(!e2.target.hasClass) return;
			if(!e2.target.hasClass("accountswitcher-switchmenu")){
				$(".accountswitcher-switchmenu").css("width", "0px").css("height", "0px");
				window.setTimeout(()=>{$(".accountswitcher-switchmenu").remove();}, 1000);
				$(document.body).off("click.accountswitchermenu");
			}
		})
	}
	
	
	
	unregisterKeybinds() {
		for(let i = 1; i < 11; i++){
			NeatoLib.Keybinds.detachListener("accountswitcher-keybind-" + i);
		}
	}

	registerKeybinds() {
		for(let i = 1; i < 11; i++){
			let keybind = {
				primaryKey: "Digit" + (i % 10),
				modifiers: ["AltLeft"]
			};
			NeatoLib.Keybinds.attachListener("accountswitcher-keybind-" + i, keybind, () => {
				this.login(i);
			});
		}
	}

	login(i){
		if(!this.settings.encrypted){
			this.loginWithToken(this.settings["token" + i]);
		}else{
			this.alertText("Password needed", "To change the account you need to type in the password you once set.<br>If you can't remember it you can disable token encryption in the settings but then all your tokens are gone.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Your password here'>", e => {
				let pw = document.getElementById("accountswitcher-passwordinput").value;
				try{
					let token = this.decrypt(this.settings["token" + i], pw);
					if(token.length > 0 && token != this.UserInfoStore.getToken()) this.settings.switchedTo = this.settings["token" + i];
					this.saveSettings();
					this.loginWithToken(token);
				}catch(ex){
					NeatoLib.showToast("Could not decrypt token " + i + ".");
				}
			}, e => {
				// input cancelled
			});
		}
	}
	
	loginWithToken(token){
		if(token == this.UserInfoStore.getToken()){
			NeatoLib.showToast("You're already using this account", "error");
		}else if(token.length > 10){
			this.AccountManager.loginToken(token);
			if(window.pluginCookie.AccountDetailsPlus){
				this.stopAccountDetailsPlus();
				window.setTimeout(()=>{this.startAccountDetailsPlus();}, 5000);
			}
			//location.reload();
		}else{
			NeatoLib.showToast("This token is not valid.", "error");
		}
	};

	stopAccountDetailsPlus(){
		pluginModule.disablePlugin("AccountDetailsPlus");
	}
	startAccountDetailsPlus(){
		pluginModule.enablePlugin("AccountDetailsPlus");
	}

	
	
	getSettingsPanel() {
		let password = "";
		setTimeout(() => {
			NeatoLib.Settings.pushElement(this.createWarning(), this.getName());
			NeatoLib.Settings.pushElement(this.createToggleSwitch("Encrypt tokens", this.settings.encrypted, e => {
				let enc = e.target.checked;
				if(enc){
					this.alertText("Set password", "Please set the password you want to use for this plugin here. If you forget it all your tokens can't be restored.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Your password here'>", e => {
						password = document.getElementById("accountswitcher-passwordinput").value;
						for(let i = 1; i < 11; i++){
							this.settings["token" + i] = this.encrypt(this.settings["token" + i], password);
						}
						this.settings.encrypted = true;
						this.saveSettings();
					}, e => {
						document.getElementById("accountswitcher-encrypttokensdiv").classList.add("valueUnchecked-2lU_20");
						document.getElementById("accountswitcher-encrypttokensdiv").classList.remove("valueChecked-m-4IJZ");
						document.getElementById("accountswitcher-encrypttokenscheckbox").checked = false;
					});
				}else{
					this.alertText("Remove password", "Are you sure you want to remove the password? This will save your tokens in clear text!<br>If you really want to risk this click the OKAY button otherwise click outside of this popup.", e => {
						password = "";
						for(let i = 1; i < 11; i++){
							this.settings["token" + i] = document.getElementById("accountswitcher-account" + i).value;
						}
						this.settings.encrypted = false;
						this.saveSettings();
					}, e => {
						document.getElementById("accountswitcher-encrypttokensdiv").classList.remove("valueUnchecked-2lU_20");
						document.getElementById("accountswitcher-encrypttokensdiv").classList.add("valueChecked-m-4IJZ");
						document.getElementById("accountswitcher-encrypttokenscheckbox").checked = true;
					});
				}
			}), this.getName());
			for(let i = 1; i < 11; i++){
				NeatoLib.Settings.pushElement(this.createTextField("Account " + i, this.settings["name" + i], this.settings.encrypted ? "" : this.settings["token" + i], "Account name (can be whatever you want)", "Account token", 
				e => {
					this.settings["name" + i] = e.target.value;
					this.saveSettings();
				},
				e => {
					let val = e.target.value;
					if(this.settings.encrypted) val = this.encrypt(val, password);
					if(this.settings["token" + i] != val){
						this.settings["token" + i] = val;
						this.settings["avatar" + i] = e.target.value == this.UserInfoStore.getToken() ? NeatoLib.Modules.get(["getCurrentUser"]).getCurrentUser().avatarURL || "" : "";
						this.saveSettings();
					}
				}), this.getName());
			}
			NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createButton("Copy token of current account", e => {
				let tempInput = document.createElement("input");
				document.body.appendChild(tempInput);
				tempInput.setAttribute('value', this.UserInfoStore.getToken())
				tempInput.select();
				document.execCommand('copy');
				document.body.removeChild(tempInput);
				NeatoLib.showToast("Token copied", "success");
			}, "margin-top:10px;"), this.getName());
			NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createButton("Get support", e => {
				window.open("https://l0c4lh057.github.io/discord.html");
			}, "margin-left:10px;margin-top:10px;"), this.getName());
		}, 0);

		if(this.settings.encrypted){
			this.alertText("Password required", "<input id='accountswitcher-passwordinput' type='password' placeholder='Your password here'>", e => {
				password = document.getElementById("accountswitcher-passwordinput").value;
				for(let i = 1; i < 11; i++){
					try{
						document.getElementById("accountswitcher-account" + i).value = this.decrypt(this.settings["token" + i], password);
					}catch(ex){
						NeatoLib.showToast("Could not decrypt token " + i + ".", "error");
					}
				}
			}, e => {
				// cancelled input
			});
		}

		return this.pluginNameLabel(this.getName());
	}
	
	pluginNameLabel(name) {
		return `
			<style>
				#bd-settingspane-container *::-webkit-scrollbar {
					max-width: 10px;
				}

				#bd-settingspane-container *::-webkit-scrollbar-track-piece {
					background: transparent;
					border: none;
					border-radius: 5px;
				}

				#bd-settingspane-container *:hover::-webkit-scrollbar-track-piece {
					background: #2F3136;
					border-radius: 5px;
				}

				#bd-settingspane-container *::-webkit-scrollbar-thumb {
					background: #1E2124;
					border: none;
					border-radius: 5px;
				}

				#bd-settingspane-container *::-webkit-scrollbar-button {
					display: none;
				}
			</style>
			<h style="color: #ccc;font-size: 30px;font-weight: bold;">${name.replace(/([A-Z])/g, ' $1').trim()} by l0c4lh057</h>`;
	}
	
	createTextField(label, value1, value2, placeholder1, placeholder2, callback1, callback2, options = {}) {
		let element = document.createElement("div");
		element.style.paddingTop = options.spacing || "20px";
		element.insertAdjacentHTML("beforeend", `
			<style>
				.neato-text-field-p {
					color: white;
					font-size: 20px;
					display: inline;
				}
			</style>
			<div class="neato-text-field-p" style="max-width:20%;">${label}</div>
			<input value="${value1}" placeholder="${placeholder1}" type="text" style="${NeatoLib.Settings.Styles.textField}width:30%;margin-left:10px;">
			<input id="accountswitcher-${label.replace(" ", "").toLowerCase()}" value="${value2}" placeholder="${placeholder2}" type="password" style="${NeatoLib.Settings.Styles.textField};width:50%;">
		`);
		element.querySelectorAll("input")[0].addEventListener(options.callbackType || "focusout", e => callback1(e));
		element.querySelectorAll("input")[1].addEventListener(options.callbackType || "focusout", e => callback2(e));
		element.querySelectorAll("input")[1].addEventListener(options.callbackType || "focusin", e => e.target.type = "text");
		element.querySelectorAll("input")[1].addEventListener(options.callbackType || "focusout", e => e.target.type = "password");
		return element;
	}

	createToggleSwitch(label, value, callback, spacing = "20px") {
		var element = document.createElement("div");
		element.style.paddingTop = spacing;
		element.innerHTML =
			`<div class="flex-1xMQg5 flex-1O1GKY horizontal-1ae9ci horizontal-2EEEnY flex-1O1GKY directionRow-3v3tfG justifyStart-2NDFzi alignStart-H-X2h- noWrap-3jynv6" style="flex: 1 1 auto;">
			<h3 class="titleDefault-a8-ZSr title-31JmR4 marginReset-236NPn weightMedium-2iZe9B size16-14cGz5 height24-3XzeJx flexChild-faoVW3" style="flex: 1 1 auto;">${label}</h3>
			<div id="accountswitcher-encrypttokensdiv" class="flexChild-faoVW3 switchEnabled-V2WDBB switch-3wwwcV ${value == true ? "valueChecked-m-4IJZ" : "valueUnchecked-2lU_20"} value-2hFrkk sizeDefault-2YlOZr size-3rFEHg themeDefault-24hCdX" style="flex: 0 0 auto;">
				<input id="accountswitcher-encrypttokenscheckbox" class="checkboxEnabled-CtinEn checkbox-2tyjJg" type="checkbox">
			</div>
		</div>`;
		element.querySelector("input").checked = value;
		element.querySelector("input").addEventListener("click", e => {
			var b = e.currentTarget.parentElement;
			if (b.classList.contains("valueChecked-m-4IJZ")) {
				b.classList.add("valueUnchecked-2lU_20");
				b.classList.remove("valueChecked-m-4IJZ");
			} else {
				b.classList.add("valueChecked-m-4IJZ");
				b.classList.remove("valueUnchecked-2lU_20");
			}
			callback(e);
		});
		return element;
	}
	
	createWarning(){
		let element = document.createElement("div");
		element.insertAdjacentHTML("beforeend", `
			<style>
				.accountswitcher.warning {
					color: #ff1919;
					padding-top: 20px;
				}
			</style>
			<div class="accountswitcher warning">Do <strong>NOT</strong> share any of your tokens with someone else. Otherwise they can use your account with all actions that don't need a password. This can't be prevented by 2fa.<br>If you think someone has your token, enable 2fa and change your password. For both actions your account will get a new token. But don't forget to change the token in this settings!<br><br>PLEASE SET A PASSWORD BY ENABLING ENCRYPTION! If you don't do this, all your tokens will be saved in clear text. Every plugin and every program on your computer can access the file and all your tokens could get plublic at once. If you activate encryption all tokens will be encrypted with your password as key. You will need to enter your password every time you open the settings and every time you want to change your account.</div>
		`);
		return element;
	}


	alertText(e, t, callbackOk, callbackCancel) {
		let a = $(`<div class="bd-modal-wrapper theme-dark" style="z-index:9999;">
						<div class="bd-backdrop backdrop-1wrmKB"></div>
						<div class="bd-modal modal-1UGdnR">
							<div class="bd-modal-inner inner-1JeGVc" style="width:auto;max-width:70%;max-height:100%;">
								<div class="header header-1R_AjF">
									<div class="title">${e}</div>
								</div>
								<div class="bd-modal-body">
									<div class="scroller-wrap fade">
										<div class="scroller">
											${t}
										</div>
									</div>
								</div>
								<div class="footer footer-2yfCgX">
									<button type="button">Okay</button>
								</div>
							</div>
						</div>
					</div>`);
		a.find(".footer button").on("click", () => {
			if(typeof callbackOk === "function") callbackOk();
			a.addClass("closing"), setTimeout(() => {
				a.remove()
			}, 300)
		}), a.find(".bd-backdrop").on("click", () => {
			if(typeof callbackCancel === "function") callbackCancel();
			a.addClass("closing"), setTimeout(() => {
				a.remove()
			}, 300)
		}), a.appendTo("#app-mount");
		if(a.find("#accountswitcher-passwordinput")){
			a.find("#accountswitcher-passwordinput").on("keydown", e => {
				if(e.which == 13) a.find(".footer button").click();
				else if(e.which == 27) a.find(".bd-backdrop").click();
			});
			a.find("#accountswitcher-passwordinput").focus();
		}
		return a.find(".bd-modal-inner")[0];
	}





	encrypt(string, key){
		return CryptoJS.AES.encrypt(string, key).toString();
	}
	decrypt(string, key){
		return CryptoJS.AES.decrypt(string, key).toString(CryptoJS.enc.Utf8);
	}
}
