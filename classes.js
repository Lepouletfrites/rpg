/* classes.js - Version Corrigée et Complète */

class Character {
    constructor(name, maxHp, maxMp, str, def) {
        this.name = name;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.maxMp = maxMp;
        this.currentMp = maxMp;
        this.str = str;
        this.def = def;
        
        this.skills = [];
        this.isDefending = false;

        // Gestion XP
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;

        // Gestion des Cooldowns (Temps de recharge)
        // Format : { "NomDuSort": nombre_tours_restants }
        this.cooldowns = {}; 
    }

    // --- FACTORY ---
    static createFromId(id, type, waveMultiplier = 1) {
        let data;
        // On suppose que HEROES_DATA et MONSTERS_DATA sont chargés via data.js
        // S'ils ne sont pas encore définis (ordre de chargement), on renvoie null
        if (typeof HEROES_DATA === 'undefined' || typeof MONSTERS_DATA === 'undefined') return null;

        if (type === "hero") data = HEROES_DATA[id];
        else if (type === "monster") data = MONSTERS_DATA[id];

        if (!data) return null;

        const hp = Math.floor(data.maxHp * waveMultiplier);
        const str = Math.floor(data.str * waveMultiplier);
        
        const newChar = new Character(data.name, hp, data.maxMp, str, data.def);

        if (type === "monster") {
            newChar.xpReward = data.xpReward * waveMultiplier;
            data.skills.forEach(s => newChar.learnSkill(s));
        } 
        else {
            newChar.unlocks = data.unlocks;
            newChar.checkLevelUp();
        }

        return newChar;
    }

    // --- GESTION DES COMPETENCES ---

    learnSkill(skillKey) {
        // Vérifie si SKILL_DATABASE est accessible
        if (typeof SKILL_DATABASE !== 'undefined' && SKILL_DATABASE[skillKey]) {
            this.skills.push(SKILL_DATABASE[skillKey]);
        }
    }

    updateCooldowns() {
        for (let skillName in this.cooldowns) {
            if (this.cooldowns[skillName] > 0) {
                this.cooldowns[skillName]--;
            }
        }
    }

    isSkillReady(skill) {
        // Si pas de cooldown enregistré, c'est prêt
        if (!this.cooldowns[skill.name]) return true; 
        return this.cooldowns[skill.name] === 0;
    }

    triggerCooldown(skill) {
        if (skill.maxCooldown > 0) {
            this.cooldowns[skill.name] = skill.maxCooldown;
        }
    }

    // --- GESTION MANA & XP ---

    useMana(amount) {
        if (this.currentMp >= amount) { 
            this.currentMp -= amount; 
            return true; 
        }
        return false;
    }

    gainXp(amount) {
        this.xp += Math.floor(amount);
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        
        // Bonus de stats
        this.maxHp += 20;
        this.currentHp = this.maxHp; 
        this.str += 3;
        this.maxMp += 10;
        
        console.log("Niveau Supérieur !");
        this.checkLevelUp();
        return true;
    }

    checkLevelUp() {
        if (this.unlocks && this.unlocks[this.level]) {
            this.unlocks[this.level].forEach(skillKey => {
                this.learnSkill(skillKey);
            });
        }
    }
}

// Classe Skill mise à jour avec le paramètre cooldown
class Skill {
    constructor(name, cost, cooldown, description, effectFunction) {
        this.name = name;
        this.cost = cost; 
        this.maxCooldown = cooldown; // Temps d'attente max
        this.description = description;
        this.effect = effectFunction;
    }
}
