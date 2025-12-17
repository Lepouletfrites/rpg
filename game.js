class Game {
    constructor() {
        this.turnTimer = null; // Pour gérer les délais et pouvoir les annuler
        this.wave = 1;
        
        // Initialisation du héros
        this.initHero();
        
        // Lancement du jeu
        this.startWave();
    }

    initHero() {
        // On crée le héros (nécessite que data.js et classes.js soient chargés)
        this.hero = Character.createFromId("mage", "hero");
    }

    startWave() {
        this.isPlayerTurn = true;
        
        // 1. Choix aléatoire du monstre
        const monsterKeys = Object.keys(MONSTERS_DATA);
        const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
        
        // 2. Difficulté : +12% par vague (Progression douce)
        const difficulty = 1 + (this.wave - 1) * 0.12;
        
        // 3. Création du monstre
        this.monster = Character.createFromId(randomKey, "monster", difficulty);

        // Reset visuel du sprite monstre
        document.getElementById('enemy-sprite').textContent = "👹"; 

        this.log("--- VAGUE " + this.wave + " ---");
        this.log(`Un ${this.monster.name} apparaît !`);
        
        // On génère les contrôles et l'interface
        this.generateControls();
        this.updateUI();
    }

    generateControls() {
        const container = document.getElementById('actions-container');
        container.innerHTML = "";
        
        this.hero.skills.forEach(skill => {
            const btn = document.createElement("button");
            
            // Vérification du Cooldown
            // hero.cooldowns[skill.name] contient le nombre de tours restants
            const cd = this.hero.cooldowns[skill.name] || 0; 
            
            if (cd > 0) {
                // Si le sort est en recharge
                btn.innerText = `${skill.name} (⏳ ${cd})`;
                btn.disabled = true; 
                btn.style.opacity = "0.6"; // Grisé
                btn.style.cursor = "not-allowed";
            } else {
                // Si le sort est prêt
                btn.innerText = `${skill.name} (${skill.cost} MP)`;
                btn.onclick = () => this.usePlayerSkill(skill);
            }

            container.appendChild(btn);
        });
    }

    usePlayerSkill(skill) {
        if (!this.isPlayerTurn) return;
        
        // Double sécurité : vérifie si le skill est prêt
        if (!this.hero.isSkillReady(skill)) {
            this.log("Compétence en recharge !");
            return;
        }

        // Si on attaque, on perd la posture défensive
        if(skill.name !== "🛡️ Défense") this.hero.isDefending = false;

        // Vérification du Mana
        if (!this.hero.useMana(skill.cost)) { 
            this.log("Manque de Mana !"); 
            return; 
        }

        // --- ACTIVER LE COOLDOWN ---
        this.hero.triggerCooldown(skill);

        // Définir la cible
        const target = (skill.name.includes("Soin") || skill.name.includes("Défense")) ? this.hero : this.monster;
        
        // Appliquer l'effet
        let value = skill.effect(this.hero, target);

        // Gestion du blocage ennemi
        if (target.isDefending && target !== this.hero) {
            value = Math.floor(value / 2);
            this.log("🛡️ L'ennemi bloque !");
            target.currentHp += value; // On "rembourse" la moitié des dégâts
            target.isDefending = false;
        }

        this.logAction(this.hero.name, skill.name, value);
        this.endTurn();
    }

    enemyTurn() {
        // Sécurité si le monstre meurt pendant le délai
        if (this.monster.currentHp <= 0) return;

        this.monster.isDefending = false;

        // IA Simple : Choix aléatoire
        const skill = this.monster.skills[Math.floor(Math.random() * this.monster.skills.length)];
        const target = (skill.name.includes("Soin") || skill.name.includes("Cri")) ? this.monster : this.hero;
        
        let value = skill.effect(this.monster, target);

        // Gestion du blocage héros
        if (this.hero.isDefending && target === this.hero) {
            value = Math.floor(value / 2);
            this.log("🛡️ Vous bloquez !");
            this.hero.currentHp += value;
            this.hero.isDefending = false;
        }

        this.logAction(this.monster.name, skill.name, value);
        
        // --- GESTION DEFAITE ---
        if (this.hero.currentHp <= 0) {
            this.log("💀 GAME OVER... Vague atteinte : " + this.wave);
            document.getElementById('player-sprite').textContent = "💀";
            
            // Bouton Rejouer Propre
            document.getElementById('actions-container').innerHTML = 
                "<button onclick='game.restartGame()' style='background:#c0392b; width:100%'>🔄 Rejouer</button>";
            return;
        }
        
        // C'est la fin du tour ennemi -> Début du tour joueur
        // On réduit les temps de recharge du héros !
        this.hero.updateCooldowns();
        
        this.isPlayerTurn = true;
        this.generateControls(); // On met à jour les boutons (pour afficher/masquer les sabliers)
        this.updateUI();
    }

    endTurn() {
        this.updateUI();
        
        // --- GESTION VICTOIRE ---
        if (this.monster.currentHp <= 0) {
            this.log(`Victoire ! +${this.monster.xpReward} XP`);
            document.getElementById('enemy-sprite').textContent = "💥";
            
            // Gain XP
            const oldLevel = this.hero.level;
            this.hero.gainXp(this.monster.xpReward);
            
            if (this.hero.level > oldLevel) {
                this.log(`🎉 NIVEAU UP ! (Niv ${this.hero.level})`);
                this.log("PV/MP restaurés et stats augmentées !");
            }

            // Petit soin de repos (+20% maxHp)
            const heal = Math.floor(this.hero.maxHp * 0.2);
            this.hero.currentHp = Math.min(this.hero.maxHp, this.hero.currentHp + heal);
            
            this.wave++;
            this.isPlayerTurn = false;
            
            // Délai avant la vague suivante
            this.turnTimer = setTimeout(() => this.startWave(), 2000); 
            return;
        }

        this.isPlayerTurn = false;
        // Délai avant l'attaque du monstre
        this.turnTimer = setTimeout(() => this.enemyTurn(), 1000);
    }

    // --- FONCTION SOFT RESET (Corrige le bug de rechargement) ---
    restartGame() {
        // 1. Annuler les actions en cours
        clearTimeout(this.turnTimer);

        // 2. Reset des données
        this.wave = 1;
        this.initHero();
        document.getElementById('player-sprite').textContent = "🛡️";

        // 3. Reset Interface
        document.getElementById('combat-log').innerHTML = "<p>Nouvelle partie !</p>";

        // 4. Relancer
        this.startWave();
    }

    logAction(name, skillName, value) {
        if(value === "BUFF") this.log(`${name} utilise ${skillName} !`);
        else if(skillName.includes("Soin")) this.log(`${name} se soigne (+${value})`);
        else if(skillName.includes("Défense")) this.log(`${name} se défend.`);
        else this.log(`${name} utilise ${skillName} (-${value} PV)`);
    }

    updateUI() {
        // Infos générales
        document.getElementById('wave-count').innerText = this.wave;
        document.getElementById('level-count').innerText = this.hero.level;
        document.getElementById('xp-count').innerText = this.hero.xp;
        document.getElementById('xp-max').innerText = this.hero.xpToNextLevel;

        // Héros
        document.getElementById('player-hp-text').innerText = `${this.hero.currentHp}/${this.hero.maxHp} PV`;
        document.getElementById('player-mp-text').innerText = `${this.hero.currentMp}/${this.hero.maxMp} MP`;
        document.getElementById('player-hp-bar').style.width = `${(this.hero.currentHp / this.hero.maxHp) * 100}%`;
        document.getElementById('player-mp-bar').style.width = `${(this.hero.currentMp / this.hero.maxMp) * 100}%`;

        // Monstre
        document.getElementById('enemy-name').innerText = this.monster.name + ` (Niv.${this.wave})`;
        document.getElementById('enemy-hp-text').innerText = `${this.monster.currentHp}/${this.monster.maxHp} PV`;
        document.getElementById('enemy-hp-bar').style.width = `${(this.monster.currentHp / this.monster.maxHp) * 100}%`;
    }

    log(msg) {
        const logBox = document.getElementById('combat-log');
        logBox.innerHTML += `<p>${msg}</p>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

// Démarrage du jeu
const game = new Game();
