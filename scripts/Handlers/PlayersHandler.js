import { SpellSlots } from './SpellSlots.js';

class Player {
  constructor(
    posX,
    posY,
    id,
    nickname,
    guildName1,
    currentHealth,
    initialHealth,
    items,
    flagId,
    spells
  ) {
    this.posX = posX;
    this.posY = posY;
    this.oldPosX = posX;
    this.oldPosY = posY;
    this.id = id;
    this.nickname = nickname;
    this.guildName = guildName1;
    this.hX = 0;
    this.hY = 0;
    this.currentHealth = currentHealth;
    this.initialHealth = initialHealth;
    this.items = items;
    this.flagId = flagId;
    this.mounted = false; // Initialize mounted status as false
    if (Array.isArray(spells) && spells.length >= 6) {
      this.spells = new SpellSlots (spells[0], spells[1], spells[2], spells[4], spells[3], spells[5]);
  } else {
      this.spells = new SpellSlots ();
  }
  }

  setMounted(mounted) {
    this.mounted = mounted;
  }
}

export class PlayersHandler {
  constructor(settings, spellsInfo) {
    this.playersInRange = [];
    this.localPlayer = new Player();
    this.invalidate = false;

    this.settings = settings;

    this.ignorePlayers = [];
    this.ignoreGuilds = [];
    this.ignoreAlliances = [];

    this.alreadyIgnoredPlayers = [];

    this.spellInfo = spellsInfo;
    this.castedSpells = {};

    this.settings.ignoreList.forEach((element) => {
      const name = element["Name"];

      switch (element["Type"]) {
        case "Player":
          this.ignorePlayers.push(name);
          break;

        case "Guild":
          this.ignoreGuilds.push(name);
          break;

        case "Alliance":
          this.ignoreAlliances.push(name);
          break;

        default: // Default is player
          this.ignorePlayers.push(name);
          break;
      }
    });
  }

  getPlayersInRange() {
    try {
      return [...this.playersInRange]; // Create a copy of the array
    } finally {}
  }

  updateItems(id, Parameters) {
    let items = null;

    try {
      items = Parameters[2];
    } catch {
      items = null;
    }

    if (items != null) {
      this.playersInRange.forEach((playerOne) => {
        if (playerOne.id === id) {
          playerOne.items = items;
        }
      });
    }
  }

  handleNewPlayerEvent(Parameters) {
    if (!this.settings.settingOnOff) return;

    /* General */
    const id = Parameters[0];
    const nickname = Parameters[1];

    if (this.alreadyIgnoredPlayers.find((name) => name === nickname.toUpperCase())) return;

    if (this.ignorePlayers.find((name) => name === nickname.toUpperCase())) {
      this.alreadyIgnoredPlayers.push(nickname.toUpperCase());
      return;
    }

    const guildName = String(Parameters[8]);

    if (this.ignoreGuilds.find((name) => name === guildName.toUpperCase())) {
      this.alreadyIgnoredPlayers.push(nickname.toUpperCase());
      return;
    }

    const alliance = String(Parameters[49]);

    if (this.ignoreAlliances.find((name) => name === alliance.toUpperCase())) {
      this.alreadyIgnoredPlayers.push(nickname.toUpperCase());
      return;
    }

    /* Position */
    var positionArray = Parameters[14];
    const posX = positionArray[0];
    const posY = positionArray[1];

    /* Health */
    const currentHealth = Parameters[20];
    const initialHealth = Parameters[21];

    /* Items & flag */
    const items = Parameters[38];
    const flagId = Parameters[51];

    /* Spells */
    const spells = Parameters[41];

    this.addPlayer(
      posX,
      posY,
      id,
      nickname,
      guildName,
      currentHealth,
      initialHealth,
      items,
      this.settings.settingSound,
      flagId,
      spells
    );
  }

  handleMountedPlayerEvent(id, parameters) {
    let ten = parameters[10];

    let mounted = parameters[11];

    if (mounted == "true" || mounted == true) {
      this.updatePlayerMounted(id, true);
    } else if (ten == "-1") {
      this.updatePlayerMounted(id, true);
    } else {
      this.updatePlayerMounted(id, false);
    }
  }

  addPlayer(
    posX,
    posY,
    id,
    nickname,
    guildName,
    currentHealth,
    initialHealth,
    items,
    sound,
    flagId,
    spells
  ) {
    const existingPlayer = this.playersInRange.find((player) => player.id === id);

    if (existingPlayer) return;

    const player = new Player(
      posX,
      posY,
      id,
      nickname,
      guildName,
      currentHealth,
      initialHealth,
      items,
      flagId,
      spells
    );
    this.playersInRange.push(player);

    if (!sound) return;

    const audio = new Audio("/sounds/player.mp3");

    // Get volume from the player volume slider (converted from 0-100 to 0.0-1.0 range)
    const volume = document.getElementById("playerVolumeSlider").value / 100;
    audio.volume = volume;

    audio.play();
  }

  updateLocalPlayerNextPosition(posX, posY) {
    // TODO: Implement update local player next position
    throw new Error("Not implemented");
  }

  updatePlayerMounted(id, mounted) {
    for (const player of this.playersInRange) {
      if (player.id === id) {
        player.setMounted(mounted);
        break;
      }
    }
  }

  removePlayer(id) {
    this.playersInRange = this.playersInRange.filter((player) => player.id !== id);
  }

  updateLocalPlayerPosition(posX, posY) {
    // Implement a local player lock mechanism
    this.localPlayer.posX = posX;
    this.localPlayer.posY = posY;
  }

  localPlayerPosX() {
    // Implement a local player lock mechanism
    return this.localPlayer.posX;
  }

  localPlayerPosY() {
    // Implement a local player lock mechanism
    return this.localPlayer.posY;
  }

  updatePlayerPosition(id, posX, posY) {
    for (const player of this.playersInRange) {
      if (player.id === id) {
        player.posX = posX;
        player.posY = posY;
      }
    }
  }

  UpdatePlayerHealth(Parameters) {
    var uPlayer = this.playersInRange.find((player) => player.id === Parameters[0]);

    if (!uPlayer) return;

    uPlayer.currentHealth = Parameters[2];
    uPlayer.initialHealth = Parameters[3];
  }

  updateSpells(playerId, Parameters) {
    let spells = new SpellSlots(65535, 65535, 65535, 65535, 65535, 65535);
    try {
        spellData = Parameters[6];
        spells = new SpellSlots(spellData[0], spellData[1], spellData[2], spellData[4], spellData[3], spellData[5]);
    } catch (error) {
        spells = new SpellSlots(65535, 65535, 65535, 65535, 65535, 65535);
    }
    this.playersInRange.forEach(player => {
        if (player.id === playerId) {
            player.spells = spells;
        }
    });
}

handleCastSpell(Parameters) {
    const { playerId, spellId } = Parameters;
    if (spellId in this.spellInfo.spellList) {
        const spell = this.spellInfo.spellList[spellId];
        const expirationTime = new Date();
        expirationTime.setSeconds(expirationTime.getSeconds() + spell.cooldown);
        this.castedSpells[`${playerId}_${spell.parentId ? spell.parentId : spell.id}`] = expirationTime;
    }
}

removeSpellsWithoutCooldown() {
    const now = new Date();
    for (const key in this.castedSpells) {
        if (this.castedSpells[key] < now) {
            delete this.castedSpells[key];
        }
    }
}


  clear() {
    this.playersInRange = [];
  }
}
