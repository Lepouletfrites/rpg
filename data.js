const SKILL_DATABASE = {
    // Skill(Nom, Coût Mana, COOLDOWN, Description, Effet)
    
    "coup_basique": new Skill("⚔️ Attaque", 0, 0, "Attaque normale", (user, target) => {
        let dmg = Math.max(2, user.str - Math.floor(target.def / 2));
        target.currentHp -= dmg; if(target.currentHp < 0) target.currentHp = 0;
        return dmg;
    }),

    "posture_defensive": new Skill("🛡️ Défense", 0, 0, "Réduit dégâts -50%", (user, target) => {
        user.isDefending = true; 
        user.currentMp += 5;
        return 0;
    }),

    "boule_feu": new Skill("🔥 Feu", 8, 2, "Magie (CD: 2 tours)", (user, target) => {
        let dmg = 20 + Math.floor(user.str * 0.5);
        target.currentHp -= dmg; if(target.currentHp < 0) target.currentHp = 0;
        return dmg;
    }),

    "soin_leger": new Skill("✨ Soin", 12, 3, "Soin (CD: 3 tours)", (user, target) => {
        let heal = 35 + Math.floor(user.str * 0.3);
        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
        return heal;
    }),

    "frappe_lourde": new Skill("🔨 Marteau", 20, 2, "Gros Dégâts (CD: 2)", (user, target) => {
        let dmg = Math.floor(user.str * 2.2);
        target.currentHp -= dmg; return dmg;
    }),

    // --- Skills Monstre (Cooldown à 0 pour simplifier l'IA pour l'instant) ---
    "morsure": new Skill("Morsure", 0, 0, "Attaque physique", (user, target) => {
        let dmg = Math.floor(user.str * 1.0);
        target.currentHp -= dmg; return dmg;
    }),
    "cri": new Skill("Cri", 0, 3, "Boost Force", (user, target) => {
        user.str += 2; return "BUFF";
    })
};

const HEROES_DATA = {
    "mage": {
        name: "Sorcier", 
        maxHp: 110,  // Buff : 80 -> 110 PV pour survivre au début
        maxMp: 60,   // Buff : 50 -> 60 MP
        str: 12,     // Buff : 10 -> 12 Force
        def: 3,      // Buff : 2 -> 3 Défense
        unlocks: {
            1: ["coup_basique", "posture_defensive"], 
            2: ["soin_leger"], // CHANGEMENT : On débloque le soin au niveau 2 !
            3: ["boule_feu"],  // On décale le feu au niveau 3
            5: ["frappe_lourde"]
        }
    }
};

const MONSTERS_DATA = {
    "gobelin": {
        name: "Gobelin", maxHp: 35, maxMp: 0, str: 7, def: 0, 
        xpReward: 50, // Buff XP : 35 -> 50 (Pour passer niveau 2 dès le premier kill)
        skills: ["morsure"]
    },
    "orc": {
        name: "Orc", maxHp: 70, maxMp: 0, str: 10, def: 1, 
        xpReward: 100,
        skills: ["morsure", "cri"]
    },
    "dragon": {
        name: "Dragonnet", maxHp: 100, maxMp: 20, str: 16, def: 3, 
        xpReward: 150,
        skills: ["morsure", "boule_feu"]
    }
};
