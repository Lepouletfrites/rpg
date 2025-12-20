/* classes.js - Version Complète (Buffs + DoTs + Résistances) */

class Character {
    constructor(name, maxHp, maxMp, str, def, int, magDef, resistances = {}) {
        this.name = name;
        this.maxHp = maxHp; this.currentHp = maxHp;
        this.maxMp = maxMp; this.currentMp = maxMp;
        
        this.baseStr = str;     this.str = str;
        this.baseDef = def;     this.def = def;
        this.baseInt = int;     this.int = int;
        this.baseMagDef = magDef; this.magDef = magDef;

        // --- GESTION DES RÉSISTANCES ---
        const defaultRes = { physique: 0, feu: 0, eau: 0, electrique: 0, terre: 0, tenebres: 0, lumiere: 0 };
        this.baseResistances = { ...defaultRes, ...resistances };
        this.resistances = { ...this.baseResistances };

        // --- LISTES D'EFFETS ---
        this.statusEffects = []; // Pour les DoT (Poison, Saignement)
        this.activeBuffs = [];   // Pour les Stats temporaires (Force +5, etc.)

        this.skills = [];
        this.cooldowns = {}; 
        this.isDefending = false;
        this.classId = null;
    }

    // --- 1. GESTION DES BUFFS TEMPORAIRES (Force, Def, etc.) ---
    applyBuff(stat, value, duration, subKey = null) {
        // Appliquer l'effet immédiatement
        if (subKey) {
            this[stat][subKey] += value; // Ex: resistances.feu
        } else {
            this[stat] += value;         // Ex: str
        }

        // Enregistrer pour plus tard
        this.activeBuffs.push({ 
            stat: stat, 
            subKey: subKey, 
            val: value, 
            turns: duration,
            name: subKey ? `${subKey.toUpperCase()}` : stat.toUpperCase()
        });
    }

    // --- 2. GESTION DES DoT (Poison, Saignement) ---
    // C'est cette fonction qui manquait !
    applyEffect(name, damage, duration, type) {
        const existing = this.statusEffects.find(e => e.name === name);
        if (existing) {
            existing.duration = duration;
            existing.damage = damage;
        } else {
            this.statusEffects.push({ name, damage, duration, type });
        }
    }

    // --- 3. DÉBUT DU TOUR : Gérer Buffs ET DoTs ---
    triggerStatusEffects() {
        let logs = [];

        // A. Gérer l'expiration des BUFFS
        for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
            let buff = this.activeBuffs[i];
            buff.turns--;

            if (buff.turns <= 0) {
                // On retire le bonus/malus
                if (buff.subKey) {
                    this[buff.stat][buff.subKey] -= buff.val;
                } else {
                    this[buff.stat] -= buff.val;
                }
                
                let sign = buff.val > 0 ? "bonus" : "malus";
                logs.push({ expired: true, effectName: `L'effet ${sign} de ${buff.name}` });
                this.activeBuffs.splice(i, 1);
            }
        }

        // B. Gérer les Dégâts sur la durée (DoT)
        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.statusEffects[i];
            
            // On utilise receiveDamage pour prendre en compte les résistances
            const result = this.receiveDamage(effect.damage, effect.type);

            logs.push({
                effectName: effect.name,
                dmg: result.dmg,
                type: effect.type
            });

            effect.duration--;
            if (effect.duration <= 0) {
                this.statusEffects.splice(i, 1);
                logs.push({ expired: true, effectName: effect.name });
            }
        }
        
        const mpRegen = Math.floor(this.maxMp * 0.05); 
        if (this.currentMp < this.maxMp) {
            this.currentMp = Math.min(this.maxMp, this.currentMp + mpRegen);
        }

        return logs;
    }

    // --- FACTORY (Création des persos) ---
    static createFromId(id, type, wave = 1) {
        if (typeof HEROES_DATA === 'undefined' || typeof MONSTERS_DATA === 'undefined') return null;

        let data;
        if (type === "hero") data = HEROES_DATA[id];
        else if (type === "monster") data = MONSTERS_DATA[id];

        if (!data) return null;

        let hp, str, def, int, magDef, xp;

        if (type === "hero") {
            hp = data.maxHp; str = data.str; def = data.def; int = data.int || 1; magDef = data.magDef || 0;
        } else {
            // Équilibrage Monstres
            const hpMult = 1 + (wave - 1) * 0.10; 
            hp = Math.floor(data.maxHp * hpMult);

            const strMult = 1 + (wave - 1) * 0.03;
            str = Math.floor(data.str * strMult);
            int = Math.floor((data.int || 1) * strMult);

            const bonusDef = Math.floor((wave - 1) / 5); 
            def = data.def + bonusDef;
            magDef = (data.magDef || 0) + bonusDef;

            xp = Math.floor(data.xpReward * (1 + (wave * 0.1)));
        }

        const newChar = new Character(data.name, hp, data.maxMp, str, def, int, magDef, data.resistances);

        if (type === "hero") newChar.classId = id; 
        if (data.skills) data.skills.forEach(s => newChar.learnSkill(s));

        if (type === "monster") {
            newChar.xpReward = xp;
            newChar.minWave = data.minWave;
            newChar.maxWave = data.maxWave;
        } 

        return newChar;
    }

// --- Dans classes.js, remplace la méthode receiveDamage par celle-ci ---

    receiveDamage(rawAmount, type) {
        // 1. Déterminer quel type de défense utiliser
        // Si c'est physique => Def. Si c'est magique (feu, eau, etc.) => MagDef
        const isPhysical = (type === "physique");
        const armor = isPhysical ? this.def : this.magDef;

        // 2. Calcul de la Réduction par l'Armure (Formule MOBA/MMO)
        // Facteur de réduction = K / (K + Armure). Ici K = 50.
        // Exemple : 50 Def => 50 / (50 + 50) = 0.5 (50% dégâts reçus)
        const ARMOR_CONSTANT = 50;
        const mitigationFactor = ARMOR_CONSTANT / (ARMOR_CONSTANT + armor);

        let damageAfterArmor = Math.floor(rawAmount * mitigationFactor);

        // 3. Gestion des Résistances Élémentaires (Pourcentage)
        const resPercent = this.resistances[type] || 0;
        const elementFactor = 1 - (resPercent / 100);
        
        let finalDamage = Math.floor(damageAfterArmor * elementFactor);
        
        // Sécurité : On s'assure qu'il y a toujours au moins 1 dégât (chip damage)
        // Sauf si l'immunité élémentaire est totale (100% res)
        if (finalDamage < 1 && resPercent < 100) finalDamage = 1; 
        
        this.currentHp -= finalDamage;
        if (this.currentHp < 0) this.currentHp = 0;

        return {
            dmg: finalDamage,
            isWeak: resPercent < 0,
            isResist: resPercent > 0 || mitigationFactor < 0.5, // On considère "résistant" si l'armure réduit de >50%
            type: type
        };
    }

    // --- UTILS ---
    learnSkill(skillKey) {
        if (typeof SKILL_DATABASE === 'undefined' || !SKILL_DATABASE[skillKey]) return;
        const newSkill = SKILL_DATABASE[skillKey];
        if (this.skills.find(s => s.name === newSkill.name)) return;
        this.skills.push(newSkill);
    }

    hasSkill(skillKey) {
        const skillName = SKILL_DATABASE[skillKey].name;
        return this.skills.some(s => s.name === skillName);
    }

    upgradeStat(stat, amount) {
        if (stat === "maxHp") { this.maxHp += amount; this.currentHp += amount; }
        else if (stat === "maxMp") { this.maxMp += amount; this.currentMp += amount; }
        else if (stat === "str") { this.baseStr += amount; this.str += amount; }
        else if (stat === "int") { this.baseInt += amount; this.int += amount; }
        else if (stat === "def") { this.baseDef += amount; this.def += amount; }
        else if (stat === "magDef") { this.baseMagDef += amount; this.magDef += amount; }
        else if (stat.startsWith("res_")) {
            const type = stat.replace("res_", "");
            if (this.baseResistances[type] !== undefined) {
                this.baseResistances[type] += amount;
                this.resistances[type] += amount;
            }
        }
    }

    resetBuffs() {
        // On remet les stats de base
        this.str = this.baseStr;
        this.int = this.baseInt;
        this.def = this.baseDef;
        this.magDef = this.baseMagDef;
        
        // On remet les résistances de base
        this.resistances = { ...this.baseResistances };
        
        this.isDefending = false;
        this.statusEffects = []; // On purge les DoT
        this.activeBuffs = [];   // On purge les Buffs
        this.cooldowns = {}; 
    }

    updateCooldowns() {
        for (let skillName in this.cooldowns) {
            if (this.cooldowns[skillName] > 0) this.cooldowns[skillName]--;
        }
    }

    isSkillReady(skill) {
        if (!this.cooldowns[skill.name]) return true; 
        return this.cooldowns[skill.name] === 0;
    }

    triggerCooldown(skill) {
        if (skill.maxCooldown > 0) this.cooldowns[skill.name] = skill.maxCooldown + 1;
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
    constructor(name, cost, cooldown, type, description, effectFunction) {
        this.name = name;
        this.cost = cost; 
        this.maxCooldown = cooldown;
        this.type = type; 
        this.description = description;
        this.effect = effectFunction;
    }
}
