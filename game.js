class Game {
    constructor() {
        this.turnTimer = null; // Pour gérer les délais et pouvoir les annuler
        this.wave = 1;
        document.getElementById('close-modal-btn').onclick = () => {
            document.getElementById('skill-modal').classList.add('hidden');
        };
        // AJOUT : Initialiser le clic long sur le héros
        this.setupHeroStatsListener();
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
        
        // --- NOUVEAU SYSTEME DE SELECTION ---
        
        // 1. Récupérer tous les monstres
        const allKeys = Object.keys(MONSTERS_DATA);
        
        // 2. Filtrer ceux qui correspondent à la vague actuelle
        const candidates = allKeys.filter(key => {
            const data = MONSTERS_DATA[key];
            const min = data.minWave || 1; 
            const max = data.maxWave || 9999;
            return this.wave >= min && this.wave <= max;
        });

        let randomKey;

        // 3. Sécurité : Si aucun monstre ne correspond
        if (candidates.length === 0) {
            console.warn("Aucun monstre pour cette vague !");
            randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        } else {
            // Sinon, on choisit parmi les candidats valides
            randomKey = candidates[Math.floor(Math.random() * candidates.length)];
        }
        
        // (Le 11 a été supprimé ici)
        
        // Difficulté : +12% par vague
        const difficulty = 1 + (this.wave - 1) * 0.05;
        
        this.monster = Character.createFromId(randomKey, "monster", difficulty);

        document.getElementById('enemy-sprite').textContent = "👹"; 

        this.log("--- VAGUE " + this.wave + " ---");
        this.log(`Un ${this.monster.name} apparaît !`);
        
        this.generateControls();
        this.updateUI();
    }



    generateControls() {
        const container = document.getElementById('actions-container');
        container.innerHTML = "";
        
        // 1. Bouton ATTAQUE
        const basicAttack = this.hero.skills.find(s => s.name.includes("Attaque"));
        if (basicAttack) this.createSkillButton(basicAttack, container, "⚔️ Attaque");

        // 2. Bouton DÉFENSE
        const defenseSkill = this.hero.skills.find(s => s.name.includes("Défense"));
        if (defenseSkill) this.createSkillButton(defenseSkill, container, "🛡️ Défense");

        // 3. Bouton ANALYSE (Nouveau !)
        const analyzeSkill = this.hero.skills.find(s => s.name.includes("Analyse"));
        if (analyzeSkill) {
            // On crée un bouton manuel pour gérer l'action spécifique
            const btn = document.createElement("button");
            btn.innerText = "👁️ Analyse";
            btn.style.border = "1px solid #e67e22"; // Orange
            btn.onclick = () => this.triggerAnalysis(); // Action spéciale
            container.appendChild(btn);
        }

        // 4. Bouton GRIMOIRE (Sorts)
        // IMPORTANT : On exclut maintenant "Analyse" du grimoire
        const otherSkills = this.hero.skills.filter(s => 
            !s.name.includes("Attaque") && 
            !s.name.includes("Défense") && 
            !s.name.includes("Analyse") // <-- Exclure Analyse
        );
        
        if (otherSkills.length > 0) {
            const spellBtn = document.createElement("button");
            spellBtn.innerHTML = "🔮 Sorts";
            spellBtn.style.background = "linear-gradient(180deg, #6a0dad, #4b0082)";
            spellBtn.style.border = "1px solid #9932cc";
            spellBtn.onclick = () => this.openSkillModal(otherSkills);
            container.appendChild(spellBtn);
        }
    }

        triggerAnalysis() {
        const modal = document.getElementById('analysis-modal');
        const body = document.getElementById('analysis-body');
        const m = this.monster;
        
        // Création du HTML pour les résistances
        // On ne montre que celles qui ne sont pas à 0 pour alléger l'affichage
        let resHtml = "";
        const types = ["physique", "feu", "eau", "electrique", "terre", "tenebres", "lumiere"];
        
        types.forEach(t => {
            const val = m.resistances[t] || 0;
            if (val !== 0) {
                let color = val > 0 ? "#2ecc71" : "#e74c3c"; // Vert si résistant, Rouge si vulnérable
                let signe = val > 0 ? "+" : "";
                // On ajoute une icône pour faire joli
                let icon = this.getTypeIcon(t);
                resHtml += `<div style="display:inline-block; margin-right:10px; color:${color}; border:1px solid ${color}; padding:2px 6px; border-radius:4px; font-size:0.75rem;">
                                ${icon} ${t.toUpperCase()} ${signe}${val}%
                            </div>`;
            }
        });

        if (resHtml === "") resHtml = "<span style='color:#777;'>Aucune résistance particulière.</span>";

        body.innerHTML = `
            <div class="stat-row"><span class="stat-name">Nom</span> <span class="stat-val">${m.name}</span></div>
            <div class="stat-row"><span class="stat-name">❤️ PV</span> <span class="stat-val">${m.currentHp}/${m.maxHp}</span></div>
            <div class="stat-row"><span class="stat-name">🛡️ Défense</span> <span class="stat-val">${m.def} (Phy) | ${m.magDef} (Mag)</span></div>
            
            <div style="margin: 15px 0 5px 0; font-weight:bold; color:#ecf0f1; font-size:0.9rem;">Affinités Élémentaires :</div>
            <div style="margin-bottom: 15px;">${resHtml}</div>
            
            <div style="margin-top:15px; color:#aaa; font-size:0.8rem;">
                ⚠️ Compétences : ${m.skills.map(s => s.name).join(", ")}
            </div>
        `;

        // ... le reste de la fonction (bouton fermer) reste identique ...
        const closeBtn = document.getElementById('close-analysis-btn');
        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.onclick = () => {
            modal.classList.add('hidden');
            this.log(`${this.hero.name} analyse les points faibles...`);
            this.endTurn(); 
        };
        modal.classList.remove('hidden');
    }

    // Petit helper pour les icônes de type
    getTypeIcon(type) {
        const icons = {
            physique: "⚔️", feu: "🔥", eau: "💧", electrique: "⚡", 
            terre: "🌿", tenebres: "💀", lumiere: "✨"
        };
        return icons[type] || "❓";
    }


    // --- Fonction mise à jour pour gérer le CLIC LONG ---
    createSkillButton(skill, targetContainer, customLabel = null) {
        const btn = document.createElement("button");
        
        // Gestion de l'affichage (Label + Cooldown)
        const cd = this.hero.cooldowns[skill.name] || 0;
        if (cd > 0) {
            btn.innerText = `${customLabel || skill.name} (⏳ ${cd})`;
            btn.disabled = true; // Note: Un bouton disabled ne reçoit pas les événements de souris par défaut
            btn.style.opacity = "0.6";
            btn.style.cursor = "not-allowed";
            // Pour voir les infos d'un sort en recharge, on peut vouloir enlever le 'disabled' 
            // et gérer le blocage dans le onclick, mais gardons simple pour l'instant.
        } else {
            let label = customLabel || skill.name;
            if (skill.cost > 0) label += ` (${skill.cost} MP)`;
            btn.innerText = label;
        }

        // --- LOGIQUE DU CLIC LONG ---
        let pressTimer;
        let isLongPress = false;

        const startPress = (e) => {
            // Empêche le menu contextuel sur mobile
            if(e.type === 'touchstart') e.preventDefault(); 
            
            isLongPress = false;
            // On lance un chrono de 600ms
            pressTimer = setTimeout(() => {
                isLongPress = true;
                this.showSkillDetails(skill); // Ouvre le modal info
                // Optionnel : petite vibration sur mobile
                if (navigator.vibrate) navigator.vibrate(50); 
            }, 600);
        };

        const cancelPress = () => {
            clearTimeout(pressTimer); // Si on relâche avant 600ms, on annule le modal
        };

        const handleAction = (e) => {
            clearTimeout(pressTimer);
            
            // Si c'était un clic long, on arrête tout ici (on ne lance pas le sort)
            if (isLongPress) {
                isLongPress = false;
                return;
            }

            // Si le bouton est désactivé (cooldown), on ne fait rien
            if (btn.disabled) return;

            // Sinon, c'est un clic normal -> On lance le sort
            document.getElementById('skill-modal').classList.add('hidden');
            this.usePlayerSkill(skill);
        };

        // Ajout des écouteurs d'événements (Souris + Tactile)
        btn.addEventListener('mousedown', startPress);
        btn.addEventListener('touchstart', startPress);

        btn.addEventListener('mouseup', handleAction);
        btn.addEventListener('touchend', handleAction);

        btn.addEventListener('mouseleave', cancelPress); // Si on sort du bouton avec la souris

        // Désactive le menu contextuel (clic droit) sur le bouton
        btn.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        targetContainer.appendChild(btn);
    }

    // --- Nouvelle fonction pour afficher les détails ---
        // --- Nouvelle fonction pour afficher les détails (Mise à jour) ---
    showSkillDetails(skill) {
        const modal = document.getElementById('detail-modal');
        const title = document.getElementById('detail-title');
        const body = document.getElementById('detail-body');

        title.innerText = skill.name;
        
        // 1. On récupère l'icône et on met la première lettre en majuscule
        const icon = this.getTypeIcon(skill.type); 
        const typeLabel = skill.type.charAt(0).toUpperCase() + skill.type.slice(1);

        // 2. On ajoute la ligne "Type" dans le HTML
        let html = `
            <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value">${icon} ${typeLabel}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Coût en Mana</span>
                <span class="detail-value" style="color: #3498db;">${skill.cost} MP</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Temps de Recharge</span>
                <span class="detail-value" style="color: #e74c3c;">${skill.maxCooldown} tours</span>
            </div>
            <div class="detail-desc">
                "${skill.description}"
            </div>
        `;

        html += `<div style="margin-top:20px; font-size:0.8rem; color:#888;">
                    ℹ️ Maintenez pour voir les détails.<br>
                    Relâchez rapidement pour lancer.
                 </div>`;

        body.innerHTML = html;
        modal.classList.remove('hidden');
    }



    // Nouvelle fonction pour remplir et afficher le modal
    openSkillModal(skillsList) {
        const modal = document.getElementById('skill-modal');
        const container = document.getElementById('modal-skills-container');
        
        // On vide le conteneur précédent
        container.innerHTML = "";

        // On génère les boutons pour chaque sort spécial
        skillsList.forEach(skill => {
            this.createSkillButton(skill, container);
        });

        // On affiche le modal
        modal.classList.remove('hidden');
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
        const target = (skill.type === "lumiere" || skill.name.includes("Défense") || skill.name.includes("Analyse")) ? this.hero : this.monster;
        
        let result = skill.effect(this.hero, target);

        // --- Adaptation pour le nouvel objet result ---
        
        // Gestion du blocage ennemi (si result est un objet dégâts)
        if (typeof result === 'object' && target.isDefending && target !== this.hero) {
            result.dmg = Math.floor(result.dmg / 2);
            this.log("🛡️ L'ennemi bloque une partie des dégâts !");
            // On remet des PV au monstre car la formule a déjà enlevé les PV
            // C'est une petite rustine : l'idéal serait de gérer isDefending DANS receiveDamage
            target.currentHp += result.dmg; 
            target.isDefending = false;
        }

        this.logAction(this.hero.name, skill.name, result);
        
        // ... updateCooldowns, endTurn ...
        this.monster.updateCooldowns(); 
        this.endTurn();
    }

    enemyTurn() {
        // Sécurité si le monstre meurt pendant le délai
        if (this.monster.currentHp <= 0) return;

        this.monster.isDefending = false;

        // --- INTELLIGENCE ARTIFICIELLE AMÉLIORÉE ---
        
        // 1. On filtre : On ne garde que les skills qui sont PRÊTS (CD à 0)
        // La méthode isSkillReady est déjà dans ta classe Character (classes.js)
        const availableSkills = this.monster.skills.filter(skill => this.monster.isSkillReady(skill));

        // 2. Sélection du sort
        let skill;
        if (availableSkills.length > 0) {
            // Choix aléatoire parmi les sorts disponibles
            skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        } else {
            // Sécurité : Si TOUT est en recharge (ne devrait pas arriver si le monstre a une attaque de base CD:0)
            // On force l'utilisation du premier skill (souvent l'attaque de base)
            skill = this.monster.skills[0];
        }

        // 3. Activer le Cooldown du monstre ! (IMPORTANT)
        this.monster.triggerCooldown(skill);

        // --- FIN IA ---

        const target = (skill.name.includes("Soin") || skill.name.includes("Cri")) ? this.monster : this.hero;
        
        let result = skill.effect(this.monster, target);

        // Gestion blocage héros
        if (typeof result === 'object' && this.hero.isDefending && target === this.hero) {
            result.dmg = Math.floor(result.dmg / 2);
            this.log("🛡️ Vous bloquez l'attaque !");
            this.hero.currentHp += result.dmg;
            this.hero.isDefending = false;
        }

        this.logAction(this.monster.name, skill.name, result);
        
        // --- GESTION DEFAITE ---
        if (this.hero.currentHp <= 0) {
            this.log("💀 GAME OVER... Vague atteinte : " + this.wave);
            document.getElementById('player-sprite').textContent = "💀";
            
            document.getElementById('actions-container').innerHTML = 
                "<button onclick='game.restartGame()' style='background:#c0392b; width:100%'>🔄 Rejouer</button>";
            return;
        }
        
        // Fin du tour ennemi -> Début du tour joueur
        this.hero.updateCooldowns();
        
        this.isPlayerTurn = true;
        this.generateControls(); 
        this.updateUI();
    }


        // Dans endTurn(), remplace le bloc "VICTOIRE" par ceci :
    endTurn() {
        this.updateUI();
        
        // --- GESTION VICTOIRE ---
        if (this.monster.currentHp <= 0) {
            this.log(`Victoire !`);
            document.getElementById('enemy-sprite').textContent = "💥";
            
            this.isPlayerTurn = false;
            
            // Au lieu de relancer direct, on ouvre le menu de récompense après 1 seconde
            setTimeout(() => this.showRewards(), 1000); 
            return;
        }

        this.isPlayerTurn = false;
        this.turnTimer = setTimeout(() => this.enemyTurn(), 1000);
    }

    // --- NOUVEAU SYSTÈME DE RÉCOMPENSE ---
    
        // --- game.js ---

    // Fonction utilitaire pour choisir une rareté selon les probas
        pickRarity() {
        // 1. Calcul du "Facteur de Chance" basé sur la vague actuelle
        // Exemple : Vague 1 = 0 bonus, Vague 11 = 10 de bonus multiplicateur
        const bonus = Math.max(0, this.wave - 1);

        // 2. Définition de la montée en puissance (Tuning)
        // A chaque vague :
        // +0.15% de chance Légendaire
        // +0.4% de chance Epique
        // +0.5% de chance Rare
        // Total retiré au Commun : ~1.05% par vague
        
        let legChance = BASE_RARITY_CHANCE.legendary + (bonus * 0.15);
        let epicChance = BASE_RARITY_CHANCE.epic + (bonus * 0.4);
        let rareChance = BASE_RARITY_CHANCE.rare + (bonus * 0.5);
        
        // Plafonds (pour ne pas casser les maths si on va vague 500)
        // On s'assure que le total ne dépasse pas 100% (le commun absorbera le reste)
        if (legChance > 50) legChance = 50; 
        if (epicChance > 60) epicChance = 60;
        
        // 3. Tirage au sort
        const rand = Math.random() * 100; // Nombre entre 0 et 100
        
        // On vérifie les seuils du plus rare au moins rare
        
        // Seuil Légendaire (ex: 0 à 2 au début, 0 à 5 à la vague 20)
        if (rand < legChance) return "legendary";
        
        // Seuil Epique (on cumule les chances précédentes)
        if (rand < legChance + epicChance) return "epic";
        
        // Seuil Rare
        if (rand < legChance + epicChance + rareChance) return "rare";
        
        // Sinon, c'est Commun
        return "common";
    }


    generateRandomReward() {
        // 1. On détermine la rareté du tirage
        const rarity = this.pickRarity();
        
        // 2. On décide : Sort ou Stat ? (30% chance d'avoir un sort)
        const isSkill = Math.random() < 0.3;

        if (isSkill) {
            // On cherche les sorts de cette rareté que le joueur N'A PAS encore
            const availableSkills = SKILL_POOL.filter(s => 
                s.rarity === rarity && !this.hero.hasSkill(s.key)
            );

            // S'il y en a au moins un, on le prend
            if (availableSkills.length > 0) {
                const choice = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                const skillData = SKILL_DATABASE[choice.key];
                
                return {
                    type: "skill",
                    key: choice.key,
                    rarity: rarity,
                    icon: "📜",
                    label: "Nouv. Sort", // On pourra afficher le nom du sort dans la desc
                    desc: skillData.name,
                    subDesc: skillData.description // Petit ajout pour voir ce que fait le sort
                };
            }
            // Sinon (pas de sort dispo dans cette rareté), on tombe automatiquement sur une STAT
        }

        // 3. Gestion des STATS
        // On récupère la liste des stats pour cette rareté
        const pool = STAT_POOL[rarity];
        // On en prend une au hasard
        const stat = pool[Math.floor(Math.random() * pool.length)];

        return {
            type: "stat",
            key: stat.key,
            val: stat.val,
            rarity: rarity,
            icon: this.getIconForStat(stat.key), // Petite fonction helper plus bas
            label: stat.label,
            desc: `+${stat.val} (Permanent)`
        };
    }

    // Petit helper pour les icônes
    getIconForStat(key) {
        const icons = { str: "💪", int: "🧠", def: "🛡️", maxHp: "❤️", maxMp: "💧", magDef: "🔮" };
        return icons[key] || "✨";
    }

    // Mise à jour de l'affichage pour inclure les classes CSS
    showRewards() {
        const modal = document.getElementById('reward-modal');
        const container = document.getElementById('reward-container');
        container.innerHTML = ""; 

        // On génère 3 choix
        for (let i = 0; i < 3; i++) {
            const reward = this.generateRandomReward();
            
            const card = document.createElement("div");
            // AJOUT : on ajoute la classe de rareté (ex: "reward-card epic")
            card.className = `reward-card ${reward.rarity}`;
            
            // On affiche le tag de rareté
            const rarityLabel = reward.rarity === 'legendary' ? 'LÉGENDAIRE' : reward.rarity.toUpperCase();

            card.innerHTML = `
                <div class="rarity-tag">${rarityLabel}</div>
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-title">${reward.label}</div>
                <div class="reward-desc">${reward.desc}</div>
                ${reward.subDesc ? `<div style="font-size:0.65rem; color:#aaa; margin-top:5px;">${reward.subDesc}</div>` : ''}
            `;
            
            card.onclick = () => {
                this.applyReward(reward);
                modal.classList.add('hidden');
                this.nextWave();
            };

            container.appendChild(card);
        }

        modal.classList.remove('hidden');
    }


    applyReward(reward) {
        if (reward.type === "skill") {
            this.hero.learnSkill(reward.key);
            this.log(`Nouveau sort appris : ${reward.desc}`);
        } else if (reward.type === "stat") {
            this.hero.upgradeStat(reward.key, reward.val);
            this.log(`Stat augmentée : ${reward.label} +${reward.val}`);
        }
    }

    nextWave() {
        // Soin partiel entre les vagues
        const heal = Math.floor(this.hero.maxHp * 0.3);
        this.hero.currentHp = Math.min(this.hero.maxHp, this.hero.currentHp + heal);
        this.log(`Repos : +${heal} PV.`);

        this.wave++;
        this.startWave();
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

        logAction(name, skillName, result) {
        // Cas spéciaux (Soin, Buff, etc.) qui renvoient autre chose qu'un objet
        if (result === "BUFF") {
            this.log(`${name} utilise ${skillName} !`);
            return;
        }
        if (result === "DEFENSE") {
            this.log(`${name} se met en posture défensive.`);
            return;
        }
        if (result === "ANALYSE") {
            return; // Déjà géré ailleurs
        }
        if (typeof result === 'number') {
            // C'est probablement un soin
            this.log(`${name} utilise ${skillName} (+${result} PV)`);
            return;
        }

        // Cas standard : Dégâts avec gestion des types
        let msg = `${name} lance ${skillName} : <b>${result.dmg}</b> dégâts.`;
        
        if (result.isWeak) {
            msg += ` <span style="color:#e74c3c; font-weight:bold;">(VULNÉRABLE !)</span>`;
        } else if (result.isResist) {
            msg += ` <span style="color:#bdc3c7; font-size:0.8em;">(Résistance...)</span>`;
        }

        this.log(msg);
    }

    
        // --- GESTION FICHE PERSONNAGE (Clic Long) ---

        // Dans game.js

    setupHeroStatsListener() {
        const playerArea = document.getElementById('player-area');
        let pressTimer;

        const startPress = (e) => {
            // --- CORRECTION ICI ---
            // Si l'élément cliqué est un BOUTON (ou est dans un bouton), on arrête tout.
            // Cela empêche la fiche perso de s'ouvrir quand on veut juste attaquer.
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }

            if(e.type === 'touchstart') {
                // On preventDefault uniquement si ce n'est PAS un bouton
                // Sinon on risque de bloquer le clic sur mobile
                if (e.cancelable) e.preventDefault(); 
            }
            
            // On lance le chrono
            pressTimer = setTimeout(() => {
                this.showHeroStats();
                if (navigator.vibrate) navigator.vibrate(50);
            }, 600);
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        // Écouteurs Souris
        playerArea.addEventListener('mousedown', startPress);
        playerArea.addEventListener('mouseup', cancelPress);
        playerArea.addEventListener('mouseleave', cancelPress);

        // Écouteurs Tactiles
        playerArea.addEventListener('touchstart', startPress, { passive: false }); // 'passive: false' permet d'utiliser preventDefault
        playerArea.addEventListener('touchend', cancelPress);
    }


    showHeroStats() {
        const modal = document.getElementById('stats-modal');
        const body = document.getElementById('stats-body');
        const h = this.hero;

        // Construction de l'affichage des stats
        body.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">❤️ PV Max</span>
                <span class="stat-val">${h.maxHp}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">💧 Mana Max</span>
                <span class="stat-val">${h.maxMp}</span>
            </div>
            <div class="stat-row" style="margin-top:10px; border-top: 2px solid #444;"></div>
            <div class="stat-row">
                <span class="stat-name">💪 Force (Dégâts Phys.)</span>
                <span class="stat-val">${h.str}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">🧠 Intelligence (Magie)</span>
                <span class="stat-val">${h.int}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">🛡️ Défense Physique</span>
                <span class="stat-val">${h.def}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">🔮 Défense Magique</span>
                <span class="stat-val">${h.magDef}</span>
            </div>
        `;

        modal.classList.remove('hidden');
    }


    updateUI() {
        // --- MISE A JOUR DES INFOS GENERALES ---
        // On ne met à jour que la vague, car l'XP et le Level n'existent plus dans le HTML
        const waveSpan = document.getElementById('wave-count');
        if (waveSpan) waveSpan.innerText = this.wave;

        // --- MISE A JOUR HEROS ---
        document.getElementById('player-hp-text').innerText = `${this.hero.currentHp}/${this.hero.maxHp} PV`;
        // ... (le reste de la fonction reste identique pour les barres de vie/mana) ...
        document.getElementById('player-mp-text').innerText = `${this.hero.currentMp}/${this.hero.maxMp} MP`;
        document.getElementById('player-hp-bar').style.width = `${(this.hero.currentHp / this.hero.maxHp) * 100}%`;
        document.getElementById('player-mp-bar').style.width = `${(this.hero.currentMp / this.hero.maxMp) * 100}%`;

        // --- MISE A JOUR MONSTRE ---
        document.getElementById('enemy-name').innerText = this.monster.name; // J'ai retiré le "Niv.X" ici aussi pour faire propre
        document.getElementById('enemy-hp-text').innerText = `${this.monster.currentHp}/${this.monster.maxHp} PV`;
        document.getElementById('enemy-hp-bar').style.width = `${(this.monster.currentHp / this.monster.maxHp) * 100}%`;
    }


    log(msg) {
        const logBox = document.getElementById('combat-log');
        logBox.innerHTML += `<p>${msg}</p>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

// --- FIN DE LA CLASSE GAME ---
// Vérifie bien qu'il y a une accolade '}' juste au-dessus de cette ligne !

// --- DÉMARRAGE SÉCURISÉ ---

function safeStart() {
    console.log("🚀 Tentative de lancement...");

    // 1. Vérification des données
    if (typeof HEROES_DATA === 'undefined' || typeof MONSTERS_DATA === 'undefined') {
        console.warn("⚠️ Données non prêtes, nouvel essai dans 0.5s...");
        setTimeout(safeStart, 500); // On réessaie dans 500ms
        return;
    }

    // 2. Lancement du jeu si pas déjà lancé
    if (!window.game) {
        try {
            window.game = new Game();
            console.log("✅ Jeu lancé avec succès !");
        } catch (e) {
            console.error("❌ ERREUR DANS LE JEU :", e);
            alert("Erreur dans le code du jeu : " + e.message);
        }
    }
}

// On gère les deux cas : page déjà chargée OU page en cours de chargement
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Cas 1 : La page était déjà prête (le téléphone a été vite)
    setTimeout(safeStart, 100);
} else {
    // Cas 2 : La page charge encore
    window.addEventListener('load', safeStart);
}
