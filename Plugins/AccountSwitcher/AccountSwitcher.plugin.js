//META{"name":"AccountSwitcher","displayName":"AccountSwitcher","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/AccountSwitcher/AccountSwitcher.plugin.js"}*//

class AccountSwitcher {
	getName(){return "AccountSwitcher";}
	getAuthor(){return "l0c4lh057";}
	getVersion(){return "1.0.8";}
	getDescription(){return this.local.plugin.description;}
	
	
	get defaultSettings(){
		return {
			language: "auto",
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
	
	get local(){
		if(!this.strings) this.strings = JSON.parse(`{
			"en": {
				"plugin": {
					"description": "Switch between multiple accounts with AltLeft+1 up to AltLeft+0"
				},
				"settings": {
					"language": "Language",
					"languages": {
						"en": {"name":"English","translator":"l0c4lh057"},
						"de": {"name":"German","translator":"l0c4lh057"},
						"fr": {"name":"French","translator":"Dark Mood"},
						"ru": {"name":"Russian","translator":"•MGC•Mr_ChAI#7272"},
						"auto": {"name":"Detect automatically"}
					},
					"warning": "Do <strong>NOT</strong> share any of your tokens with someone else. Otherwise they can use your account with all actions that don't need a password. This can't be prevented by 2fa.<br>If you think someone has your token, enable 2fa and change your password. For both actions your account will get a new token. But don't forget to change the token in this settings!<br><br>PLEASE SET A PASSWORD BY ENABLING ENCRYPTION! If you don't do this, all your tokens will be saved in clear text. Every plugin and every program on your computer can access the file and all your tokens could get public at once. If you activate encryption all tokens will be encrypted with your password as key. You will need to enter your password every time you open the settings and every time you want to change your account.",
					"encryption": "Encrypt tokens",
					"account": "Account {0}",
					"password": {
						"set": "Set password",
						"setDescription": "Please set the password you want to use for this plugin here. If you forget it all your tokens can't be restored.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Your password here'>",
						"remove": "Remove password",
						"removeDescription": "Are you sure you want to remove the password? This will save your tokens in clear text!<br>If you really want to risk this click the OKAY button otherwise click outside of this popup."
					},
					"accountNamePlaceholder": "Account name",
					"accountTokenPlaceholder": "Account token",
					"copyToken": "Copy token of current account",
					"copiedToken": "Token copied",
					"support": "Get Support",
					"passwordRequired": {
						"title": "Password required",
						"description": "<input id='accountswitcher-passwordinput' type='password' placeholder='Your password here'>"
					},
					"useCurrent": "Use Current"
				},
				"couldNotDecrypt": "Could not decrypt token {0}.",
				"alreadyUsingAccount": "You are already using this account",
				"invalidToken": "This token is invalid",
				"passwordRequired": {
					"title": "Password required",
					"description": "To change the account you need to type in the password you once set.<br>If you can't remember it you can disable token encryption in the settings but then all your tokens are gone.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Your password here'>"
				}
			},
			"de": {
				"plugin": {
					"description": "Wechsel zwischen mehreren Accounts, indem du AltLeft+1 bis AltLeft+0 drückst"
				},
				"settings": {
					"language": "Sprache",
					"languages": {
						"en": {"name":"Englisch","translator":"l0c4lh057"},
						"de": {"name":"Deutsch","translator":"l0c4lh057"},
						"fr": {"name":"Französisch","translator":"Dark Mood"},
						"ru": {"name":"Russian","translator":"•MGC•Mr_ChAI#7272"},
						"auto": {"name":"Automatisch erkennen"}
					},
					"warning": "Teil deine Account-Tokens <strong>NIEMALS</strong> mit jemand anderem! Dadurch könnten diese deinen Account mit allen Funktionen, die keine Bestätigung per Passwort benötigen, nutzen. Das kann auch nicht mit 2FA verhindert werden.<br>Wenn du denkst, dass jemand deinen Token hat, aktiviere 2FA und änder dein Passwort. Für beide Aktionen sollte dein Account einen neuen Token bekommen. Vergiss aber nicht, den Token in den Einstellungen dieses Plugins zu ändern.<br><br>BITTE SETZ EIN PASSWORT, INDEM DU VERSCHLÜSSELUNG AKTIVIERST! Wenn du das nicht tust, werden alle Tokens in Klartext gespeichert. Jedes Plugin und jedes Programm auf deinem Computer kann auf die Datei und damit auf alle Tokens zugreifen, wodurch diese alle mit einem Mal öffentlich geraten können. Wenn du Verschlüsselung aktivierst, werden alle Tokens mit dem eingegebenen Passwort verschlüsselt. Jedes Mal, wenn auf einen Token zugegriffen wird (Einstellungen öffnen/Account wechseln), musst du dieses Passwort wieder eingeben.",
					"encryption": "Token verschlüsseln",
					"account": "Account {0}",
					"password": {
						"set": "Set password",
						"setDescription": "Setz hier das Passwort, das du in diesem Plugin verwenden willst. Wenn du das Passwort vergisst, kannst du die Tokens nicht mehr wiederherstellen.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Dein Passwort hier'>",
						"remove": "Remove password",
						"removeDescription": "Willst du das Passwort wirklich entfernen? Dadurch werden alle Token in Klartext gespeichert!<br>Wenn du das Passwort wirklich entfernen willst, klick auf den OKAY-Knopf, sonst außerhalb dieses Popups."
					},
					"accountNamePlaceholder": "Account-Name",
					"accountTokenPlaceholder": "Account-Token",
					"copyToken": "Token des aktuellen Accounts kopieren",
					"copiedToken": "Token kopiert",
					"support": "Support",
					"passwordRequired": {
						"title": "Passwort benötigt",
						"description": "<input id='accountswitcher-passwordinput' type='password' placeholder='Dein Passwort hier'>"
					},
					"useCurrent": "Jetziger Account"
				},
				"couldNotDecrypt": "Token {0} konnte nicht entschlüsselt werden.",
				"alreadyUsingAccount": "Du benutzt diesen Account bereits",
				"invalidToken": "Der Token ist ungültig",
				"passwordRequired": {
					"title": "Passwort benötigt",
					"description": "Um deinen Account zu wechseln muss du das Passwort eingeben, dass du gesetzt hast.<br>Wenn du dein Passwort vergessen hast, kannst du die Verschlüsselung in den Einstellungen deaktivieren, aber dann sind all deine Tokens nicht mehr zugreifbar.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Dein Passwort hier'>"
				}
			},
			"fr": {
				"plugin": {
					"description": "Passez d'un compte à l'autre avec AltLeft+1 , AltLeft+2 , etc..."
				},
				"settings": {
					"language": "Langage",
					"languages": {
						"en": {"name":"English","translator":"l0c4lh057"},
						"de": {"name":"German","translator":"l0c4lh057"},
						"fr": {"name":"French","translator":"Dark Mood"},
						"ru": {"name":"Russian","translator":"•MGC•Mr_ChAI#7272"},
						"auto": {"name":"Détection automatique"}
					},
					"warning": "Ne <strong>PAS</strong> partager vos tokens avec quelqu'un d'autre. Sinon, ils peuvent utiliser votre compte/vos tokens avec toutes les actions qui n'ont pas besoin d'un mot de passe. Ceci ne peut être évité par l'a2f.<br>Si vous pensez que quelqu'un a votre token, activez l'a2f et changez votre mot de passe. Pour les deux actions, votre compte recevra un nouveau jeton. Mais n'oubliez pas de changer le token dans les paramètres suivants!<br><br>VEUILLEZ DÉFINIR UN MOT DE PASSE POUR ACTIVER LE CRYPTAGE! Si vous ne le faites pas, tous vos tokens seront sauvegardés en texte clair. Chaque plugin et chaque programme sur votre ordinateur peut accéder au fichier et tous vos jetons peuvent être rendus publics en même temps. Si vous activez le cryptage, tous les jetons seront cryptés avec votre mot de passe comme clé. Vous devrez entrer votre mot de passe chaque fois que vous ouvrirez les paramètres et chaque fois que vous voudrez changer votre compte.",
					"encryption": "Crypter les tokens",
					"account": "Comptes: {0}",
					"password": {
						"set": "Définir un mot de passe",
						"setDescription": "Veuillez définir ici le mot de passe que vous souhaitez utiliser pour ce plugin. Si vous l'oubliez, tous vos jetons ne peuvent pas être restaurés et seront donc supprimés...<br><input id='accountswitcher-passwordinput' type='password' placeholder='Votre mot de passe ici'>",
						"remove": "Supprimer le mot de passe",
						"removeDescription": "Êtes-vous sûr de vouloir supprimer le mot de passe ? Ceci sauvegardera vos tokens en texte clair!<br>ISi vous voulez vraiment prendre ce risque, cliquez sur le bouton OKAY/OK sinon cliquez à l'extérieur de ce popup."
					},
					"accountNamePlaceholder": "Nom de compte",
					"accountTokenPlaceholder": "Token de compte",
					"copyToken": "Copier le token du compte actuel",
					"copiedToken": "Token copié",
					"support": "Avoir le support",
					"passwordRequired": {
						"title": "Mot de passe requis",
						"description": "<input id='accountswitcher-passwordinput' type='password' placeholder='Votre mot de passe ici'>"
					},
					"useCurrent": "Utilisation actuelle"
				},
				"couldNotDecrypt": "Impossible de décrypter les jetons {0}.",
				"alreadyUsingAccount": "Vous utilisez déjà ce compte",
				"invalidToken": "Le token est invalide",
				"passwordRequired": {
					"title": "Mot de passe requis",
					"description": "Pour changer de compte, vous devez saisir le mot de passe que vous avez défini une fois.<br>Si vous ne vous en souvenez pas, vous pouvez désactiver le cryptage des tokens dans les paramètres, mais tous vos tokens auront disparus.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Votre mot de passe ici'>"
				}
			},
			"ru": {
				"plugin": {
					"description": "Переключайтесь между аккаунтами с помощью сочетаний клавиш от AltLeft+1 до AltLeft+0"
				},
				"settings": {
					"language": "Язык",
					"languages": {
						"en": {"name":"Английский","translator":"l0c4lh057"},
						"de": {"name":"Немецкий","translator":"l0c4lh057"},
						"fr": {"name":"Французский","translator":"Dark Mood"},
						"ru": {"name":"Русский","translator":"•MGC•Mr_ChAI#7272"},
						"auto": {"name":"Detect automatically"}
					},
					"warning": "<strong>НЕ</strong> передавайте никому свой токен! Иначе он(а) получит полный доступ к вашему аккаунту. Это не может быть предотвращено с помощью 2FA.<br>Если вы считаете, что у кого-то есть ваш токен, включите/выключите 2FA или поменяйте пароль - каждое из этих действий меняет пароль. Но не забудьте поменять его в настройках!<br><br>ПОЖАЛУЙСТА, УСТАНОВИТЕ ПАРОЛЬ, ВКЛЮЧИВ ШИВРОВАНИЕ! Если этого не сделать, токены будут храниться в виде обычного текста, и любой плагин/программа сможет их прочесть, в результате все ваши токены могут быть переданы кому-то другому. Если вы включите шифрование, все токены будут зашифрованы с паролем в качестве ключа. Вам придется вводить пароль каждый раз, когда вы открываете настройки плагина или меняете аккаунт.",
					"encryption": "Шифрование токенов",
					"account": "Аккаунт {0}",
					"password": {
						"set": "Установите пароль",
						"setDescription": "Пожалуйста, установите пароль. Если вы его забудете, вы не сможете восстановить токены.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Новый пароль'>",
						"remove": "Удаление пароля",
						"removeDescription": "Вы уверены, что хотите убрать пароль? Ваши токены будут храгиться в виде обычного текста!<br>Если вы все же решили рискнуть, нажмите кнопку OKAY, в противном случае кликните снаужи этого окошка."
					},
					"accountNamePlaceholder": "Имя аккаунта",
					"accountTokenPlaceholder": "Токен аккаунта",
					"copyToken": "Скопировать токен текущего аккаунта",
					"copiedToken": "Токен скопирован",
					"support": "Помощь",
					"passwordRequired": {
						"title": "Необходим пароль",
						"description": "<input id='accountswitcher-passwordinput' type='password' placeholder='Пароль'>"
					},
					"useCurrent": "Использовать этот"
				},
				"couldNotDecrypt": "Не удалось расшифровать токен аккаунта {0}.",
				"alreadyUsingAccount": "Вы уже используете этот аккаунт",
				"invalidToken": "Неправильный токен",
				"passwordRequired": {
					"title": "Необходим пароль",
					"description": "Чтобы сменить аккаунт, нужен установленный вами пароль.<br>Если вы его забыли, вы можете отключить шифрование, но тогда все токены пропадут.<br><input id='accountswitcher-passwordinput' type='password' placeholder='Пароль'>"
				}
			}
		}`);
		return this.strings[this.lang] || this.strings["en"];
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
		this.loadLanguage();
		this.registerKeybinds();
		if(this.settings.lastUsedVersion != this.getVersion()){
			this.settings.lastUsedVersion = this.getVersion();
			this.alertText("Changelog", `<ul style="list-style-type:circle;padding-left:20px;">
			<li>Fixed the problem that you could not use the password input when opening the settings</li>
			</ul>`);
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
		for(let i = 1; i < 11; i++){
			if(this.settings["name" + i] != ""){
				let av = this.settings["avatar" + i] == "" ? $(`<img src="https://pixy.org/download/4764586/" class="accountswitcher-menuavatar accountswitcher-unknownavatar">`)[0] : $(`<img src="${this.settings["avatar" + i]}" class="accountswitcher-menuavatar">`)[0];
				av.on("click", ()=>{
					this.login(i);
				});
				menu.appendChild(av);
				NeatoLib.Tooltip.attach(this.settings["name" + i], av);
			}
		}
		document.body.appendChild(menu);
		$(document.body).on("click.accountswitchermenu", e2 => {
			if(!e2.target.hasClass) return;
			if(!e2.target.hasClass("accountswitcher-switchmenu")){
				$(".accountswitcher-switchmenu").remove();
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
			this.alertText(this.local.passwordRequired.title, this.local.passwordRequired.description, e => {
				let pw = document.getElementById("accountswitcher-passwordinput").value;
				try{
					let token = this.decrypt(this.settings["token" + i], pw);
					if(token.length > 0 && token != this.UserInfoStore.getToken()) this.settings.switchedTo = this.settings["token" + i];
					this.saveSettings();
					this.loginWithToken(token);
				}catch(ex){
					NeatoLib.showToast(this.formatString(this.local.couldNotDecrypt, i), "error");
				}
			}, e => {
				// input cancelled
			});
		}
	}
	
	loginWithToken(token){
		if(token == this.UserInfoStore.getToken()){
			NeatoLib.showToast(this.local.alreadyUsingAccount, "error");
		}else if(token.length > 10 && !token.includes(" ")){
			this.AccountManager.loginToken(token);
			if(window.pluginCookie.AccountDetailsPlus){
				this.stopAccountDetailsPlus();
				window.setTimeout(()=>{this.startAccountDetailsPlus();}, 5000);
			}
		}else{
			NeatoLib.showToast(this.local.invalidToken, "error");
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
			NeatoLib.Settings.pushElement(this.createToggleSwitch(this.local.settings.encryption, this.settings.encrypted, e => {
				let enc = e.target.checked;
				if(enc){
					this.alertText(this.local.settings.password.set, this.local.settings.password.setDescription, e => {
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
					this.alertText(this.local.settings.password.remove, this.local.settings.password.removeDescription, e => {
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
				NeatoLib.Settings.pushElement(this.createTextField(this.formatString(this.local.settings.account, i), this.settings["name" + i], this.settings.encrypted ? "" : this.settings["token" + i], this.local.settings.accountNamePlaceholder, this.local.settings.accountTokenPlaceholder,
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
				}, i), this.getName());
			}
			let langs = [];
			for(let lang in this.local.settings.languages){
				langs.push({title:this.local.settings.languages[lang].name, value:lang, description:this.local.settings.languages[lang].translator});
			}
			NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createRadioGroup("accountswitcher-languageselector", this.local.settings.language, langs, this.settings.language, e => {
				this.settings.language = e.getAttribute("data-value");
				this.saveSettings();
				this.loadLanguage();
			}), this.getName());
			NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createButton(this.local.settings.copyToken, e => {
				let tempInput = document.createElement("input");
				document.body.appendChild(tempInput);
				tempInput.setAttribute('value', this.UserInfoStore.getToken())
				tempInput.select();
				document.execCommand('copy');
				document.body.removeChild(tempInput);
				NeatoLib.showToast(this.local.settings.copiedToken, "success");
			}, "margin-top:10px;"), this.getName());
			NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createButton(this.local.settings.support, e => {
				window.open("https://l0c4lh057.github.io/discord.html");
			}, "margin-left:10px;margin-top:10px;"), this.getName());
		}, 0);

		if(this.settings.encrypted){
			this.alertText(this.local.settings.passwordRequired.title, this.local.settings.passwordRequired.description, e => {
				password = document.getElementById("accountswitcher-passwordinput").value;
				for(let i = 1; i < 11; i++){
					try{
						document.getElementById("accountswitcher-account" + i).value = this.decrypt(this.settings["token" + i], password);
					}catch(ex){
						NeatoLib.showToast(this.formatString(this.local.couldNotDecrypt, i), "error");
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
	
	createTextField(label, value1, value2, placeholder1, placeholder2, callback1, callback2, acc, options = {}) {
		let element = document.createElement("div");
		element.style.marginBottom = "15px";
		element.style.position = "relative";
		element.style.height = "40px";
		element.insertAdjacentHTML("beforeend", `
			<style>
				.neato-text-field-p {
					color: white;
					font-size: 20px;
					display: inline;
				}
			</style>
			<div class="neato-text-field-p" style="position:absolute;top:50%;transform:translateY(-50%);">${label}</div>
			<input value="${value1}" placeholder="${placeholder1}" type="text" style="${NeatoLib.Settings.Styles.textField}width:30%;margin-left:10px;position:absolute;right:calc(40% + 5px)">
			<input id="accountswitcher-account${acc}" value="${value2}" placeholder="${placeholder2}" type="password" style="${NeatoLib.Settings.Styles.textField};width:40%;position:absolute;right:0;">
			<button style="position:absolute;right:0;top:0;" class="button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN">${this.local.settings.useCurrent}</button> <!-- because so many people are too retarded to copy their token and paste it in the password field... -->
		`);
		let nameInput = element.querySelectorAll("input")[0];
		let passInput = element.querySelectorAll("input")[1];
		process.nextTick(()=>{
			let txtWid = element.querySelector("div.neato-text-field-p").offsetWidth;
			let btnWid = element.querySelector("button").offsetWidth;
			passInput.style.right = `${btnWid + 5}px`;
			nameInput.style.width = `calc(60% - ${txtWid + btnWid + 20}px)`;
			nameInput.style.right = `calc(40% + ${btnWid + 10}px)`;
		});
		$(element.querySelector("button")).on("click", ()=>{
			nameInput.value = NeatoLib.Modules.get(["getCurrentUser"]).getCurrentUser().username;
			passInput.value = this.UserInfoStore.getToken();
			callback1({target:{value:nameInput.value}});
			callback2({target:{value:passInput.value}});
		});
		nameInput.addEventListener(options.callbackType || "focusout", e => callback1(e));
		passInput.addEventListener(options.callbackType || "focusout", e => callback2(e));
		passInput.addEventListener(options.callbackType || "focusin", e => e.target.type = "text");
		passInput.addEventListener(options.callbackType || "focusout", e => e.target.type = "password");
		return element;
	}

	createToggleSwitch(label, value, callback, spacing = "20px") {
		var element = document.createElement("div");
		element.style.paddingTop = spacing;
		element.style.paddingBottom = spacing;
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
			<div class="accountswitcher warning">${this.local.settings.warning}</div>
		`);
		return element;
	}


	alertText(e, t, callbackOk, callbackCancel) {
		let a = $(`<div class="bd-modal-wrapper theme-dark" style="z-index:9999;" data-no-focus-lock="true">
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

	loadLanguage(){
		this.lang = this.settings.language == "auto" ? document.documentElement.getAttribute("lang").split("-")[0] : this.settings.language;
	}

	formatString(input, ...args){
		for(let i = 0; i < args.length; i++){
			input = input.replace(`{${i}}`, args[i]);
		}
		return input;
	}





	encrypt(string, key){
		return CryptoJS.AES.encrypt(string, key).toString();
	}
	decrypt(string, key){
		return CryptoJS.AES.decrypt(string, key).toString(CryptoJS.enc.Utf8);
	}
}
