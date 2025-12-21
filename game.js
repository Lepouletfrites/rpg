class Game {
        constructor() {
        this.turnTimer = null;
        
        // --- Listeners existants ---
        const closeModal = document.getElementById('close-modal-btn');
        if (closeModal) closeModal.onclick = () => document.getElementById('skill-modal').classList.add('hidden');
        
        const resetBtn = document.getElementById('restart-btn');
        if (resetBtn) resetBtn.onclick = () => this.hardReset();
        
        this.setupHeroStatsListener();
        
        
        // --- AJOUT : FERMETURE DES MODALES AU CLIC EXTÉRIEUR ---
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                // 'e.target' est l'élément cliqué. 'modal' est le fond gris.
                // Si on clique pile sur le fond gris (et pas sur le contenu à l'intérieur) :
                if (e.target === modal) {
                    
                    // SÉCURITÉ : On empêche de fermer certaines fenêtres critiques en cliquant à côté
                    // 1. Analysis : Car fermer doit finir le tour (logique spéciale)
                    // 2. Class Selection : Car on doit choisir une classe
                    // 3. Reward : Car on doit choisir une récompense
                    const protectedModals = ['analysis-modal', 'class-selection-modal', 'reward-modal'];
                    
                    if (!protectedModals.includes(modal.id)) {
                        modal.classList.add('hidden');
                    }
                }
            });
        });
        
        
        // --- NOUVELLE LOGIQUE DE DÉMARRAGE ---
        
        // 1. On essaie de charger une partie existante
        if (this.loadGame()) {
            this.startWave(); // Si sauvegarde trouvée, on continue direct
        } else {
            // 2. Si c'est une NOUVELLE partie, on demande la classe
            console.log("Nouvelle partie : En attente du choix de classe...");
            this.showClassSelection();
        }
    }

    // --- Fonction d'affichage du menu de classe ---
        // Dans game.js

    showClassSelection() {
        const modal = document.getElementById('class-selection-modal');
        const container = document.getElementById('class-list-container');
        container.innerHTML = ""; 

        for (const [key, data] of Object.entries(HEROES_DATA)) {
            
            // --- MODIFICATION ICI : Plus de if, on prend l'icône direct ! ---
            const icon = data.icon || "❓"; // Fallback si oubli dans entities.js

            const card = document.createElement("div");
            card.className = "class-card-btn";
            card.innerHTML = `
                <div class="class-icon">${icon}</div>
                <div class="class-name">${data.name}</div>
                <div class="class-desc">
                    PV: ${data.maxHp} | MP: ${data.maxMp}<br>
                    Force: ${data.str} | Int: ${data.int}
                </div>
            `;
            
            card.onclick = () => {
                this.startGameWithClass(key);
                modal.classList.add('hidden');
            };

            container.appendChild(card);
        }
        modal.classList.remove('hidden');
    }


    // --- Fonction de démarrage après choix ---
        // Dans game.js

    startGameWithClass(classId) {
        this.wave = 1;
        this.hero = Character.createFromId(classId, "hero");
        
        // --- MODIFICATION ICI : On charge l'icône depuis les données ---
        // On vérifie que HEROES_DATA[classId] existe pour éviter les bugs
        const heroData = HEROES_DATA[classId];
        const sprite = heroData ? heroData.icon : "😐";
        
        document.getElementById('player-sprite').textContent = sprite;
        // -------------------------------------------------------------

        this.log(`Vous commencez l'aventure en tant que ${this.hero.name} !`);
        this.startWave();
    }


    // Dans game.js, à l'intérieur de la classe Game
    
    startWave() {
        this.saveGame();
        this.isPlayerTurn = true;
        
        // --- 1. Filtrer les monstres éligibles par Vague ---
        const allKeys = Object.keys(MONSTERS_DATA);
        
        const candidates = allKeys.filter(key => {
            const data = MONSTERS_DATA[key];
            const min = data.minWave || 1; 
            const max = data.maxWave || 9999;
            return this.wave >= min && this.wave <= max;
        });

        // Sécurité si aucun monstre ne correspond
        if (candidates.length === 0) {
            console.warn("Aucun monstre pour cette vague !");
            // On prend un au pif pour éviter le crash
            candidates.push("gobelin"); 
        }

        // --- 2. Tirage au sort pondéré (Rareté) ---
        
        // A. Calculer le poids total de tous les candidats
        // Ex: Orc (40) + Dragon (5) = Total 45
        let totalWeight = 0;
        candidates.forEach(key => {
            totalWeight += (MONSTERS_DATA[key].spawnWeight || 1); // 1 par défaut si oubli
        });

        // B. Choisir un nombre aléatoire entre 0 et Total
        let randomValue = Math.random() * totalWeight;
        let selectedKey = candidates[0]; // Valeur par défaut

        // C. Trouver quel monstre correspond au nombre tiré
        for (const key of candidates) {
            const weight = MONSTERS_DATA[key].spawnWeight || 1;
            randomValue -= weight;
            if (randomValue <= 0) {
                selectedKey = key;
                break;
            }
        }

        // --- Fin de la sélection ---

        // Création du monstre
        this.monster = Character.createFromId(selectedKey, "monster", this.wave);
        
        // La suite reste identique...
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

        this.hero.triggerCooldown(skill);

        // --- SIMPLIFICATION MAXIMALE ---
        // On cible toujours le monstre.
        // Si le sort est un soin (comme modifié dans skills.js), il ignorera cette cible
        // et utilisera 'user' (toi) pour se soigner.
        const target = this.monster; 
        
        // Exécution du sort
        // Le Châtiment ira sur le monstre (car il utilise 'target')
        // Le Soin ira sur toi (car il utilise 'user')
        let result = skill.effect(this.hero, target);
                // Animation d'attaque du Héros sur son image (player-sprite)
        this.triggerAttackAnim('player-sprite', true);
        // --- GESTION VISUELLE ---
        if (typeof result === 'object' && result.dmg !== undefined) {
            setTimeout(() => {
                // On passe result.isCrit en 4ème argument !
                this.spawnFloatingText('enemy-sprite', `-${result.dmg}`, result.type || "physique", result.isCrit);
                
                if (result.type !== "miss") { // On ne tremble pas si on a esquivé
                    this.triggerHitEffect('enemy-sprite');
                }
            }, 200); 
        } 

        else if (skill.name.includes("Soin") || skill.name.includes("Lumière")) {
             // C'est un soin (sur le joueur)
             // Note : Il faut récupérer le montant soigné si possible, ou mettre un texte générique
             // Dans ton skills.js, 'soin_leger' renvoie le montant heal.
             if (typeof result === 'number') {
                 this.spawnFloatingText('player-sprite', `+${result}`, "soin");
             } else if (result.customMsg && result.dmg) {
                 // Cas vampirisme ou soin + dégats
             }
        }
        // ------------------------
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
      
        const isAlive = this.processDoT(this.monster);
        if (!isAlive) {
            this.endTurn(); // Le monstre est mort du poison, fin du combat !
            return;
        }
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
        
                // Animation d'attaque du Monstre
        this.triggerAttackAnim('enemy-sprite', false);

        let result = skill.effect(this.monster, target);

        // --- GESTION VISUELLE ---
        if (typeof result === 'object' && result.dmg !== undefined) {
            setTimeout(() => {
                // Pareil ici, on passe result.isCrit
                this.loatingText('player-sprite', `-${result.dmg}`, result.type || "physique", result.isCrit);
                
                if (result.type !== "miss") {
                    this.triggerHitEffect('player-sprite');
                }
            }, 200);
        }

        // ------------------------

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
        // Le joueur subit ses dégâts au début de son tour
        const playerAlive = this.processDoT(this.hero);
        if (!playerAlive) {
            this.log("☠️ Vous avez succombé à vos blessures...");
            // Gérer le Game Over ici si nécessaire, ou laisser le prochain clic le faire
            // Mais comme updateUI est appelé dans processDoT, la barre sera à 0
        }
        
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

    pickRarity() {
        // 1. Calcul du "Facteur de Chance" basé sur la vague actuelle
        const bonus = Math.max(0, this.wave - 1);

        // 2. Définition de la montée en puissance
        let legChance = BASE_RARITY_CHANCE.legendary + (bonus * 0.15);
        let epicChance = BASE_RARITY_CHANCE.epic + (bonus * 0.4);
        let rareChance = BASE_RARITY_CHANCE.rare + (bonus * 0.5);
        
        // Plafonds
        if (legChance > 50) legChance = 50; 
        if (epicChance > 60) epicChance = 60;
        
        // 3. Tirage au sort
        const rand = Math.random() * 100; 
        
        if (rand < legChance) return "legendary";
        if (rand < legChance + epicChance) return "epic";
        if (rand < legChance + epicChance + rareChance) return "rare";
        
        return "common";
    }

    generateRandomReward() {
        const rarity = this.pickRarity();
        const isSkill = Math.random() < 0.3;

        if (isSkill) {
            // --- FILTRE DE CLASSE ---
            const availableSkills = SKILL_POOL.filter(s => {
                const goodRarity = s.rarity === rarity;
                const notLearned = !this.hero.hasSkill(s.key);
                const classAllowed = !s.classes || s.classes.includes(this.hero.classId);
                return goodRarity && notLearned && classAllowed;
            });

            if (availableSkills.length > 0) {
                const choice = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                const skillData = SKILL_DATABASE[choice.key];
                
                return {
                    type: "skill",
                    key: choice.key,
                    rarity: rarity,
                    icon: "📜",
                    label: "Nouv. Sort",
                    desc: skillData.name,
                    subDesc: skillData.description
                };
            }
        }

        // Gestion des STATS
        const pool = STAT_POOL[rarity];
        const stat = pool[Math.floor(Math.random() * pool.length)];

        return {
            type: "stat",
            key: stat.key,
            val: stat.val,
            rarity: rarity,
            icon: this.getIconForStat(stat.key),
            label: stat.label,
            desc: `${stat.desc}`
        };
    }

    getIconForStat(key) {
        // Si c'est une stat classique
        const icons = { str: "💪", int: "🧠", def: "🛡️", maxHp: "❤️", maxMp: "💧", magDef: "🔮" };
        if (icons[key]) return icons[key];

        // Si c'est une résistance (ex: res_feu)
        if (key.startsWith("res_")) {
            const type = key.replace("res_", "");
            return this.getTypeIcon(type); // Réutilise ta fonction existante (🔥, etc.)
        }

        return "✨";
    }

    // --- Dans game.js ---

    showRewards(count = 3) { // Par défaut, on commence à 3
        const modal = document.getElementById('reward-modal');
        const container = document.getElementById('reward-container');
        
        // 1. Nettoyage
        container.innerHTML = ""; 
        
        // On supprime l'ancien bouton reroll s'il existe déjà pour éviter les doublons
        const oldBtn = document.getElementById('reroll-btn-container');
        if (oldBtn) oldBtn.remove();

        // 2. Génération des récompenses uniques
        const choices = [];
        let attempts = 0;

        // On génère autant de choix que le paramètre 'count' demande
        while (choices.length < count && attempts < 50) {
            attempts++;
            const candidate = this.generateRandomReward();
            // On évite les doublons
            const alreadySelected = choices.some(c => c.type === candidate.type && c.key === candidate.key);

            if (!alreadySelected) {
                choices.push(candidate);
            }
        }

        // 3. Affichage des cartes
        choices.forEach(reward => {
            const card = document.createElement("div");
            card.className = `reward-card ${reward.rarity}`;
            
            // Gestion de l'affichage du titre de rareté
            let rarityLabel = reward.rarity.toUpperCase();
            if (reward.rarity === 'legendary') rarityLabel = 'LÉGENDAIRE';

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
                
                // Nettoyage du bouton reroll à la fermeture
                const btnContainer = document.getElementById('reroll-btn-container');
                if (btnContainer) btnContainer.remove();
                
                this.nextWave();
            };

            container.appendChild(card);
        });

        // 4. Logique du REROLL (Le bouton)
        // On ne l'affiche que s'il reste plus d'1 choix possible
        if (count > 1) {
            const btnContainer = document.createElement("div");
            btnContainer.id = "reroll-btn-container";
            btnContainer.style.marginTop = "20px";
            btnContainer.style.textAlign = "center";

            const rerollBtn = document.createElement("button");
            rerollBtn.className = "reroll-btn";
            rerollBtn.innerHTML = `🎲 Relancer les dés <small>(Reste : ${count - 1} choix)</small>`;
            
            rerollBtn.onclick = () => {
                // On relance avec UN choix de moins
                this.showRewards(count - 1);
            };

            btnContainer.appendChild(rerollBtn);
            
            // On ajoute le bouton APRÈS la grille de récompenses (dans le modal-content)
            // container.parentNode est .modal-content
            container.parentNode.appendChild(btnContainer);
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
        this.saveGame();
    }

        // Dans game.js

    nextWave() {
        // --- 1. RESET DES BUFFS ---
        this.hero.resetBuffs(); // <--- AJOUTE CETTE LIGNE ICI
        // Cela remettra la Force à la normale avant de sauvegarder ou de continuer
        
        // 2. Soin PV (30% du Max)
        const healHp = Math.floor(this.hero.maxHp * 0.5);
        this.hero.currentHp = Math.min(this.hero.maxHp, this.hero.currentHp + healHp);

        // 3. Récupération MP (30% du Max)
        const healMp = Math.floor(this.hero.maxMp * 0.4);
        this.hero.currentMp = Math.min(this.hero.maxMp, this.hero.currentMp + healMp);

        // 4. Logs et suite
        this.log(`Repos : +${healHp} PV, +${healMp} MP. Les bonus de combat se dissipent.`); // Petit update texte

        this.wave++;
        this.startWave();
    }


    restartGame() {
        clearTimeout(this.turnTimer);
        this.wave = 1;
        // Reset via hard reload ou réaffichage du menu
        this.hardReset(); 
    }

        logAction(name, skillName, result) {
        if (typeof result === 'object' && result.type === "miss") {
             this.log(`${name} attaque... mais la cible <b>ESQUIVE</b> ! 💨`);
             return;
        }
        
        // ... (Garde tes codes pour customMsg ici) ...
        if (typeof result === 'object' && result.customMsg) {
             // ... ton code existant ...
        }
        
        // ... (Garde les autres codes BUFF/DEFENSE) ...

        // Mise à jour du message de dégâts
        if (typeof result === 'object' && result.dmg !== undefined) {
            let msg = `${name} lance ${skillName} : `;
            
            if (result.isCrit) {
                msg += `<b style="color:#ffeb3b; font-size:1.1em;">CRITIQUE ! -${result.dmg}</b>`;
            } else {
                msg += `<b>${result.dmg}</b> dégâts.`;
            }

            if (result.isWeak) msg += ` <span style="color:#e74c3c;">(VULNÉRABLE !)</span>`;
            else if (result.isResist) msg += ` <span style="color:#bdc3c7;">(Résistance...)</span>`;
            
            this.log(msg);
            return;
        }
        
        // Fallback
        this.log(`${name} utilise ${skillName}.`);
    }


    setupHeroStatsListener() {
        const playerArea = document.getElementById('player-area');
        let pressTimer;

        const startPress = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            if(e.type === 'touchstart' && e.cancelable) e.preventDefault(); 
            
            pressTimer = setTimeout(() => {
                this.showHeroStats();
                if (navigator.vibrate) navigator.vibrate(50);
            }, 600);
        };

        const cancelPress = () => clearTimeout(pressTimer);

        playerArea.addEventListener('mousedown', startPress);
        playerArea.addEventListener('mouseup', cancelPress);
        playerArea.addEventListener('mouseleave', cancelPress);
        playerArea.addEventListener('touchstart', startPress, { passive: false });
        playerArea.addEventListener('touchend', cancelPress);
    }

    showHeroStats() {
        const modal = document.getElementById('stats-modal');
        const body = document.getElementById('stats-body');
        const h = this.hero;

        let resHtml = "";
        const types = ["physique", "feu", "eau", "electrique", "terre", "tenebres", "lumiere"];

        types.forEach(t => {
            const val = h.resistances[t] || 0;
            if (val !== 0) {
                let color = val > 0 ? "#2ecc71" : "#e74c3c";
                let signe = val > 0 ? "+" : "";
                let icon = this.getTypeIcon(t);

                resHtml += `
                    <div style="display:inline-block; margin: 3px; padding: 4px 8px; border: 1px solid ${color}; color: ${color}; border-radius: 6px; font-size: 0.75rem; background: rgba(0,0,0,0.2);">
                        ${icon} ${t.charAt(0).toUpperCase() + t.slice(1)} ${signe}${val}%
                    </div>`;
            }
        });

        if (resHtml === "") resHtml = "<span style='color:#777; font-style:italic; font-size:0.8rem;'>Aucune affinité particulière.</span>";

        body.innerHTML = `
            <div class="stat-row"><span class="stat-name">❤️ PV Max</span><span class="stat-val">${h.maxHp}</span></div>
            <div class="stat-row"><span class="stat-name">💧 Mana Max</span><span class="stat-val">${h.maxMp}</span></div>
            <div class="stat-row" style="margin-top:10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top:10px;"></div>
            <div class="stat-row"><span class="stat-name">💪 Force (Phy)</span><span class="stat-val">${h.str}</span></div>
            <div class="stat-row"><span class="stat-name">🧠 Intelligence (Mag)</span><span class="stat-val">${h.int}</span></div>
            <div class="stat-row"><span class="stat-name">🛡️ Défense Physique</span><span class="stat-val">${h.def}</span></div>
            <div class="stat-row"><span class="stat-name">🔮 Défense Magique</span><span class="stat-val">${h.magDef}</span></div>
            <div style="margin-top: 20px; text-align: left;">
                <div style="color: #gold; font-size: 0.85rem; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">🛡️ Résistances & Faiblesses</div>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">${resHtml}</div>
            </div>
        `;
        modal.classList.remove('hidden');
    }
    
    renderStatusEffects(char, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = ""; // On nettoie

        // 1. Afficher les Buffs de stats (ex: Force +)
        char.activeBuffs.forEach(buff => {
            const el = document.createElement("div");
            // Si la valeur est positive = Buff, négative = Debuff
            const type = buff.val > 0 ? "buff" : "debuff";
            const symbol = buff.val > 0 ? "▲" : "▼";
            
            el.className = `status-icon ${type}`;
            // Affiche : "STR ▲ (2)" pour dire Force augmenté, reste 2 tours
            el.innerText = `${buff.stat.toUpperCase().slice(0,3)} ${symbol} (${buff.turns})`;
            el.title = `${buff.name}: ${buff.val > 0 ? '+' : ''}${buff.val} (${buff.turns} tours)`;
            container.appendChild(el);
        });

        // 2. Afficher les DoT (Poison, Saignement)
        char.statusEffects.forEach(eff => {
            const el = document.createElement("div");
            el.className = "status-icon debuff"; // Souvent des debuffs
            el.style.borderColor = "#9b59b6"; // Violet pour les DoT
            el.style.color = "#9b59b6";
            
            // Icône selon le nom (rapide)
            let icon = "💀";
            if(eff.name.includes("Saignement")) icon = "🩸";
            if(eff.name.includes("Brûlure")) icon = "🔥";
            
            el.innerText = `${icon} (${eff.duration})`;
            el.title = `${eff.name}: -${eff.damage} PV/tour`;
            container.appendChild(el);
        });
    }
    
    
    updateUI() {
        const waveSpan = document.getElementById('wave-count');
        if (waveSpan) waveSpan.innerText = this.wave;
        document.getElementById('player-hp-text').innerText = `${this.hero.currentHp}/${this.hero.maxHp} PV`;
        document.getElementById('player-mp-text').innerText = `${this.hero.currentMp}/${this.hero.maxMp} MP`;
        document.getElementById('player-hp-bar').style.width = `${(this.hero.currentHp / this.hero.maxHp) * 100}%`;
        document.getElementById('player-mp-bar').style.width = `${(this.hero.currentMp / this.hero.maxMp) * 100}%`;
        document.getElementById('enemy-name').innerText = this.monster.name;
        document.getElementById('enemy-hp-text').innerText = `${this.monster.currentHp}/${this.monster.maxHp} PV`;
        document.getElementById('enemy-hp-bar').style.width = `${(this.monster.currentHp / this.monster.maxHp) * 100}%`;
        this.renderStatusEffects(this.hero, 'player-effects');
        this.renderStatusEffects(this.monster, 'enemy-effects');
        
    }

    log(msg) {
        const logBox = document.getElementById('combat-log');
        logBox.innerHTML += `<p>${msg}</p>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
    
        // --- NOUVELLES FONCTIONS VISUELLES ---

// --- Dans game.js ---

    spawnFloatingText(targetId, text, type = "physique", isCrit = false) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        const el = document.createElement("div");
        el.innerText = text;
        
        let colorClass = `color-${type}`;
        
        // --- GESTION VISUELLE CRITIQUE & ESQUIVE ---
        if (type === "miss") {
            el.innerText = "ESQUIVE !";
            el.style.color = "#bdc3c7"; // Gris clair
            el.style.fontSize = "1rem";
            el.style.fontStyle = "italic";
        } 
        else if (isCrit) {
            el.innerText = text + " 💥"; // Ajout d'une icône
            el.style.color = "#ffeb3b"; // Jaune vif
            el.style.fontSize = "2.5rem"; // Beaucoup plus gros !
            el.style.textShadow = "0 0 10px #e67e22"; // Effet "Glow"
            el.style.zIndex = "10000";
        } 
        else {
            // Cas normal
            el.className = `floating-text ${colorClass}`;
        }

        // On garde la classe de base pour l'animation, mais on ajoute 'crit' si besoin
        el.className = "floating-text " + (isCrit ? "" : colorClass);

        // Positionnement (identique à avant)
        const rect = targetEl.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        el.style.left = (rect.left + scrollX + rect.width / 2 - 20) + "px"; 
        el.style.top = (rect.top + scrollY) + "px";

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }


    // 2. Fait trembler une cible (quand elle prend des dégâts)
    triggerHitEffect(targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;
        
        // Astuce pour relancer l'animation si elle est déjà jouée
        el.classList.remove("shake-anim");
        el.classList.remove("flash-red");
        void el.offsetWidth; // Force le navigateur à recalculer (Reflow)
        
        el.classList.add("shake-anim");
        el.classList.add("flash-red");
    }

    // 3. Fait bondir l'attaquant
    triggerAttackAnim(attackerId, isHero) {
        const el = document.getElementById(attackerId);
        if(!el) return;
        
        const animClass = isHero ? "attack-hero" : "attack-enemy";
        
        el.classList.remove(animClass);
        void el.offsetWidth; 
        el.classList.add(animClass);
    }

    
    
    saveGame() {
        if (!this.hero) return;
        const saveData = {
            wave: this.wave,
            hero: {
                classId: this.hero.classId,
                currentHp: this.hero.currentHp, maxHp: this.hero.maxHp,
                currentMp: this.hero.currentMp, maxMp: this.hero.maxMp,
                
                baseStr: this.hero.baseStr,
                baseDef: this.hero.baseDef,
                baseInt: this.hero.baseInt,
                baseMagDef: this.hero.baseMagDef,

                // --- ON SAUVEGARDE LES RESISTANCES DE BASE ---
                baseResistances: this.hero.baseResistances, 
                // ---------------------------------------------

                skillNames: this.hero.skills.map(s => s.name)
            }
        };
        localStorage.setItem('rpg_save_v1', JSON.stringify(saveData));
    }

    // 3. Mise à jour du CHARGEMENT
    loadGame() {
        try {
            const json = localStorage.getItem('rpg_save_v1');
            if (!json) return false;
            const data = JSON.parse(json);
            
            // ... (Partie création héros identique) ...
            this.wave = data.wave || 1;
            const loadedClassId = data.hero.classId || "mage";
            this.hero = Character.createFromId(loadedClassId, "hero");
            
            // ... (Restauration PV/MP/Stats identique) ...
            this.hero.currentHp = data.hero.currentHp;
            // ... etc ...

            this.hero.baseStr = data.hero.baseStr || data.hero.str; this.hero.str = this.hero.baseStr;
            this.hero.baseDef = data.hero.baseDef || data.hero.def; this.hero.def = this.hero.baseDef;
            this.hero.baseInt = data.hero.baseInt || data.hero.int; this.hero.int = this.hero.baseInt;
            this.hero.baseMagDef = data.hero.baseMagDef || data.hero.magDef; this.hero.magDef = this.hero.baseMagDef;

            // --- RESTAURATION DES RESISTANCES ---
            if (data.hero.baseResistances) {
                this.hero.baseResistances = data.hero.baseResistances;
                // On applique la base à la courante
                this.hero.resistances = { ...this.hero.baseResistances };
            }
            // ------------------------------------
            if (data.hero.skillNames) {
                data.hero.skillNames.forEach(savedName => {
                    for (const [key, skillObj] of Object.entries(SKILL_DATABASE)) {
                        if (skillObj.name === savedName) {
                            this.hero.learnSkill(key);
                            break;
                        }
                    }
                });
            }

            this.log(`💾 Partie chargée : Vague ${this.wave}`);
            return true;

        } catch (e) {
            console.error("Sauvegarde corrompue...", e);
            localStorage.removeItem('rpg_save_v1');
            return false;
        }
    }

    hardReset() {
        if(confirm("Voulez-vous vraiment effacer votre progression et recommencer ?")) {
            if (this.turnTimer) clearTimeout(this.turnTimer);
            localStorage.removeItem('rpg_save_v1');
            location.reload();
        }
    }
    
        // Dans game.js

        processDoT(character) {
        // 1. Calcul des effets (dégâts/expiration)
        const reports = character.triggerStatusEffects();

        // 2. Identification de la cible pour les effets visuels
        // Si le personnage est le héros, on vise 'player-sprite', sinon 'enemy-sprite'
        const spriteId = (character === this.hero) ? 'player-sprite' : 'enemy-sprite';

        // 3. Boucle sur les rapports d'effets
        reports.forEach(report => {
            if (report.expired) {
                this.log(`${character.name} n'est plus affecté par ${report.effectName}.`);
            } else {
                // Cas où l'effet inflige des dégâts (Poison, Saignement, etc.)
                if (report.dmg > 0) {
                    this.log(`${character.name} subit ${report.effectName} : <b>${report.dmg}</b> dégâts.`);
                    
                    // --- EFFETS VISUELS ---
                    // Affiche "-10" au-dessus de la tête avec la couleur du type (ex: vert/violet)
                    this.spawnFloatingText(spriteId, `-${report.dmg}`, report.type);
                    
                    // Fait trembler le sprite pour montrer la douleur
                    this.triggerHitEffect(spriteId);
                }
            }
        });
        
        // 4. Mise à jour de l'interface (Barres de vie)
        this.updateUI();

        // 5. Renvoie 'true' si le perso est vivant, 'false' s'il est mort
        return character.currentHp > 0;
    }


} // --- FIN DE LA CLASSE GAME ---

// --- DÉMARRAGE SÉCURISÉ ---

function safeStart() {
    console.log("🚀 Tentative de lancement...");
    if (typeof HEROES_DATA === 'undefined' || typeof MONSTERS_DATA === 'undefined') {
        setTimeout(safeStart, 500); 
        return;
    }
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

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(safeStart, 100);
} else {
    window.addEventListener('load', safeStart);
}
