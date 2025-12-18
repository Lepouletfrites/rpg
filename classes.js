/* classes.js - Version Roguelite (Sans XP) */

class Character {
    // 1. Mise à jour du constructeur pour inclure les résistances
    constructor(name, maxHp, maxMp, str, def, int, magDef, resistances = {}) {
        this.name = name;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.maxMp = maxMp;
        this.currentMp = maxMp;
        
        this.str = str;
        this.def = def;
        this.int = int || 1; 
        this.magDef = magDef || 0; 
        
        // --- NOUVEAU : SYSTÈME DE RÉSISTANCES ---
        // Par défaut, tout est à 0 (Neutre)
        const defaultRes = {
            physique: 0,
            feu: 0,
            eau: 0,
            electrique: 0,
            terre: 0,
            tenebres: 0,
            lumiere: 0
        };
        // On fusionne les valeurs par défaut avec celles données
        this.resistances = { ...defaultRes, ...resistances };

        this.skills = [];
        this.cooldowns = {}; 
        this.isDefending = false;
    }

    // --- FACTORY (Mise à jour) ---
    static createFromId(id, type, waveMultiplier = 1) {
        if (typeof HEROES_DATA === 'undefined' || typeof MONSTERS_DATA === 'undefined') return null;

        let data;
        if (type === "hero") data = HEROES_DATA[id];
        else if (type === "monster") data = MONSTERS_DATA[id];

        if (!data) return null;

        const hp = Math.floor(data.maxHp * waveMultiplier);
        const str = Math.floor(data.str * waveMultiplier);
        const def = Math.floor(data.def * waveMultiplier);
        const int = Math.floor((data.int || 1) * waveMultiplier);
        const magDef = Math.floor((data.magDef || 0) * waveMultiplier);
        
        // On passe les résistances définies dans data.js
        const newChar = new Character(data.name, hp, data.maxMp, str, def, int, magDef, data.resistances);

        if (data.skills) {
            data.skills.forEach(s => newChar.learnSkill(s));
        }

        if (type === "monster") {
            newChar.xpReward = data.xpReward * waveMultiplier;
             // Ajout des stats "secrètes" pour l'analyse (minWave, maxWave...)
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
        if (stat === "hp") {
            this.maxHp += amount;
            this.currentHp += amount; // Le boost soigne aussi du montant gagné
        } else if (stat === "mp") {
            this.maxMp += amount;
            this.currentMp += amount;
        } else if (this[stat] !== undefined) {
            this[stat] += amount;
        }
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