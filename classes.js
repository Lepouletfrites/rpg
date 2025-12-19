/* classes.js - Version Roguelite (Sans XP) */

// --- classes.js ---

class Character {
    constructor(name, maxHp, maxMp, str, def, int, magDef, resistances = {}) {
        // ... (tes propriétés classiques: name, hp, mp, str...) ...
        this.name = name;
        this.maxHp = maxHp; this.currentHp = maxHp;
        this.maxMp = maxMp; this.currentMp = maxMp;
        
        this.baseStr = str;     this.str = str;
        this.baseDef = def;     this.def = def;
        this.baseInt = int;     this.int = int;
        this.baseMagDef = magDef; this.magDef = magDef;

        // --- NOUVEAU : GESTION DES RÉSISTANCES ---
        // 1. Définition des valeurs par défaut
        const defaultRes = { physique: 0, feu: 0, eau: 0, electrique: 0, terre: 0, tenebres: 0, lumiere: 0 };
        
        // 2. On stocke la BASE (Permanente)
        this.baseResistances = { ...defaultRes, ...resistances };
        
        // 3. On stocke la COURANTE (Copie modifiable)
        this.resistances = { ...this.baseResistances };
        // -----------------------------------------

        this.statusEffects = [];
        this.skills = [];
        this.cooldowns = {}; 
        this.isDefending = false;
        this.classId = null;
    }

    // --- 1. AJOUTER UN EFFET ---
    applyEffect(name, damage, duration, type) {
        // On vérifie si l'effet existe déjà pour le rafraîchir (optionnel)
        const existing = this.statusEffects.find(e => e.name === name);
        if (existing) {
            existing.duration = duration; // On remet le compteur à zéro
            existing.damage = damage;
        } else {
            this.statusEffects.push({ name, damage, duration, type });
        }
    }

    // --- 2. SUBIR LES EFFETS (Début du tour) ---
    triggerStatusEffects() {
        let logs = []; // On va stocker ce qui s'est passé pour l'afficher

        // On parcourt les effets à l'envers pour pouvoir supprimer sans bug
        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.statusEffects[i];

            // Appliquer les dégâts
            // On utilise receiveDamage pour prendre en compte les résistances (ex: résistance poison)
            const result = this.receiveDamage(effect.damage, effect.type);

            logs.push({
                effectName: effect.name,
                dmg: result.dmg,
                type: effect.type
            });

            // Réduire la durée
            effect.duration--;

            // Si fini, on supprime
            if (effect.duration <= 0) {
                this.statusEffects.splice(i, 1);
                logs.push({ expired: true, effectName: effect.name });
            }
        }
        return logs; // On renvoie la liste des événements au jeu
    }

    // ... (Garde tes méthodes existantes : createFromId, receiveDamage, resetBuffs, etc.) ...


        // --- FACTORY (Mise à jour équilibrage) ---
    static createFromId(id, type, wave = 1) {
        if (typeof HEROES_DATA === 'undefined' || typeof MONSTERS_DATA === 'undefined') return null;

        let data;
        if (type === "hero") data = HEROES_DATA[id];
        else if (type === "monster") data = MONSTERS_DATA[id];

        if (!data) return null;

        // --- FORMULES D'ÉQUILIBRAGE ---
        
        let hp, str, def, int, magDef, xp;

        if (type === "hero") {
            // Le héros n'est pas affecté par la vague à la création (c'est ses objets qui le boostent)
            hp = data.maxHp;
            str = data.str;
            def = data.def;
            int = data.int || 1;
            magDef = data.magDef || 0;
        } else {
            // --- MONSTRES : Évolution différenciée ---
            
            // 1. PV : Augmentation de 10% par vague (Le monstre devient plus résistant)
            const hpMult = 1 + (wave - 1) * 0.10; 
            hp = Math.floor(data.maxHp * hpMult);

            // 2. FORCE/INT : Augmentation lente de 3% par vague (Pour ne pas one-shot le joueur)
            const strMult = 1 + (wave - 1) * 0.03;
            str = Math.floor(data.str * strMult);
            int = Math.floor((data.int || 1) * strMult);

            // 3. DÉFENSE : Augmentation TRES lente (Plate)
            // On ajoute juste +1 point de défense toutes les 5 vagues.
            // Sinon, à la vague 20, le monstre serait invulnérable.
            const bonusDef = Math.floor((wave - 1) / 5); 
            def = data.def + bonusDef;
            magDef = (data.magDef || 0) + bonusDef;

            // 4. XP : Augmente de 10% par vague (pour le score ou futur leveling)
            xp = Math.floor(data.xpReward * (1 + (wave * 0.1)));
        }

        // Création de l'instance
        const newChar = new Character(data.name, hp, data.maxMp, str, def, int, magDef, data.resistances);

        if (type === "hero") {
            newChar.classId = id; 
        }
    
        if (data.skills) {
            data.skills.forEach(s => newChar.learnSkill(s));
        }

        if (type === "monster") {
            newChar.xpReward = xp;
            newChar.minWave = data.minWave;
            newChar.maxWave = data.maxWave;
        } 

        return newChar;
    }


    // --- NOUVELLE FONCTION DE CALCUL DE DÉGÂTS ---
    // Cette fonction remplace "currentHp -= damage"
    receiveDamage(amount, type) {
        // 1. Récupérer la résistance (0 par défaut si type inconnu)
        const resPercent = this.resistances[type] || 0;

        // 2. Calcul du multiplicateur
        // Ex: 20% res -> facteur 0.8 (1 - 0.20)
        // Ex: -50% res -> facteur 1.5 (1 - (-0.50))
        const factor = 1 - (resPercent / 100);

        // 3. Calcul final
        let finalDamage = Math.floor(amount * factor);
        if (finalDamage < 0) finalDamage = 0; // Pas de soin par dégâts négatifs

        // 4. Appliquer les dégâts
        this.currentHp -= finalDamage;
        if (this.currentHp < 0) this.currentHp = 0;

        // 5. Retourner un objet complet pour les logs (Dégâts + Info efficacité)
        return {
            dmg: finalDamage,
            isWeak: resPercent < 0,      // C'était une faiblesse
            isResist: resPercent > 0,    // C'était une résistance
            type: type
        };
    }

    // --- GESTION DES COMPETENCES ---

        // --- GESTION DES COMPETENCES (Corrigé) ---
    learnSkill(skillKey) {
        // 1. Sécurité d'abord : est-ce que la base de données et le sort existent ?
        if (typeof SKILL_DATABASE === 'undefined' || !SKILL_DATABASE[skillKey]) {
            console.warn(`Le sort "${skillKey}" n'existe pas dans la base !`);
            return;
        }

        const newSkill = SKILL_DATABASE[skillKey];

        // 2. Ensuite on vérifie si on l'a déjà
        if (this.skills.find(s => s.name === newSkill.name)) return;

        // 3. Si tout est bon, on l'ajoute
        this.skills.push(newSkill);
    }


    hasSkill(skillKey) {
        const skillName = SKILL_DATABASE[skillKey].name;
        return this.skills.some(s => s.name === skillName);
    }

    // --- BOOST DE STATS (Système de Récompense) ---
    upgradeStat(stat, amount) {
        if (stat === "maxHp") { this.maxHp += amount; this.currentHp += amount; }
        else if (stat === "maxMp") { this.maxMp += amount; this.currentMp += amount; }
        else if (stat === "str") { this.baseStr += amount; this.str += amount; }
        else if (stat === "int") { this.baseInt += amount; this.int += amount; }
        else if (stat === "def") { this.baseDef += amount; this.def += amount; }
        else if (stat === "magDef") { this.baseMagDef += amount; this.magDef += amount; }
        
        // --- NOUVEAU : GESTION DES RECOMPENSES DE RESISTANCE ---
        // Si la clé commence par "res_", c'est une résistance (ex: "res_feu")
        else if (stat.startsWith("res_")) {
            const type = stat.replace("res_", ""); // On enlève le préfixe pour avoir "feu"
            
            // On augmente la base et la courante
            if (this.baseResistances[type] !== undefined) {
                this.baseResistances[type] += amount;
                this.resistances[type] += amount;
            }
        }
    }

    resetBuffs() {
        this.str = this.baseStr;
        this.int = this.baseInt;
        this.def = this.baseDef;
        this.magDef = this.baseMagDef;
        
        // --- NOUVEAU : RESET DES RESISTANCES ---
        // On recrée une copie propre depuis la base
        this.resistances = { ...this.baseResistances };
        // ---------------------------------------
        
        this.isDefending = false;
        this.statusEffects = [];
        this.cooldowns = {}; 
    }

    // --- COMBAT & CD ---
    updateCooldowns() {
        for (let skillName in this.cooldowns) {
            if (this.cooldowns[skillName] > 0) {
                this.cooldowns[skillName]--;
            }
        }
    }

    isSkillReady(skill) {
        if (!this.cooldowns[skill.name]) return true; 
        return this.cooldowns[skill.name] === 0;
    }

    triggerCooldown(skill) {
        if (skill.maxCooldown > 0) {
            this.cooldowns[skill.name] = skill.maxCooldown + 1;
        }
    }

    useMana(amount) {
        if (this.currentMp >= amount) { 
            this.currentMp -= amount; 
            return true; 
        }
        return false;
    }
}

class Skill {
    // Ajout du paramètre TYPE
    constructor(name, cost, cooldown, type, description, effectFunction) {
        this.name = name;
        this.cost = cost; 
        this.maxCooldown = cooldown;
        this.type = type; // "feu", "physique", etc.
        this.description = description;
        this.effect = effectFunction;
    }
}