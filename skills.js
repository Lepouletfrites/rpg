// --- skills.js ---
// Version mise à jour pour le système de "Mitigation en %"

const SKILL_DATABASE = {
    
    // --- PHYSIQUE ---
    
    "coup_basique": new Skill("⚔️ Attaque", 0, 0, "physique", "Attaque normale", (user,target) => {
        // On prend la meilleure stat entre Force et Intell pour l'attaque de base
        // Note : On envoie la valeur BRUTE. receiveDamage s'occupe de la défense.
        let rawPower = (user.str > user.int) ? user.str : user.int;
        return target.receiveDamage(rawPower, "physique");
    }),

    "frappe_lourde": new Skill("Frappe Lourde", 10, 2, "physique", "Gros Dégâts Physiques", (user, target) => {
        // Multiplicateur x2.5 (remplace l'ancienne formule)
        let rawPower = Math.floor(user.str * 2.5);
        return target.receiveDamage(rawPower, "physique");
    }),

    "morsure": new Skill("Morsure", 0, 0, "physique", "Attaque sauvage", (user, target) => {
        let rawPower = Math.floor(user.str * 1.2);
        return target.receiveDamage(rawPower, "physique");
    }),

    // --- MAGIE (Élémentaire) ---
    // Note : Les sorts magiques ont souvent des multiplicateurs élevés car la MagDef réduit aussi les dégâts

    "boule_feu": new Skill("🔥 Feu", 5, 0, "feu", "Magie de Feu (Rapide)", (user, target) => {
        // Coût réduit (8->5) et CD réduit (2->0) pour rendre le mage plus dynamique
        let rawPower = Math.floor(user.int * 1.8); 
        return target.receiveDamage(rawPower, "feu");
    }),

    "torent_feu": new Skill("🔥 Torrent", 25, 4, "feu", "Explosion de Feu", (user, target) => {
        // Coût réduit (35->25)
        let rawPower =  Math.floor(user.int * 4.5); 
        return target.receiveDamage(rawPower, "feu");
    }),

    "jet_eau": new Skill("💧 Eau", 6, 1, "eau", "Jet d'eau sous pression", (user, target) => {
        let rawPower = Math.floor(user.int * 2.0); 
        return target.receiveDamage(rawPower, "eau");
    }),

    "souffle_feu": new Skill("Souffle", 0, 3, "feu", "Feu de zone", (user, target) => {
        let rawPower = Math.floor(user.int * 2.2);
        return target.receiveDamage(rawPower, "feu");
    }),

    // --- SUPPORT & BUFFS (Maintenant dynamiques en %) ---

    "soin_leger": new Skill("✨ Soin", 12, 3, "lumiere", "Restaure des PV", (user, target) => {
        let heal = 20 + Math.floor(user.int * 1.5);
        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
        return heal; 
    }),

    "posture_defensive": new Skill("🛡️ Défense", 0, 0, "physique", "-50% Dégâts reçus (Active)", (user, target) => {
        // Celui-ci reste spécial (géré dans game.js pour diviser les dégâts par 2)
        user.isDefending = true; 
        return "DEFENSE";
    }),

    "analyse": new Skill("👁️ Analyse", 0, 0, "physique", "Info Ennemi", (user, target) => {
        return "ANALYSE";
    }),
    
    "cri": new Skill("Cri", 8, 3, "physique", "+30% Force", (user, target) => {
        // Calcul dynamique : 30% de la Force actuelle
        let boost = Math.floor(user.str * 0.30);
        user.applyBuff("str", boost, 3);
        return { customMsg: ` hurle et gagne +${boost} Force (3 tours)` };
    }),
    
    "bouclier_lave": new Skill("🛡️ Bouclier Lave", 15, 4, "feu", "+50% Res. Feu", (user, target) => {
        user.applyBuff("resistances", 50, 3, "feu");
        return { customMsg: " s'entoure de lave (+50% Res Feu)" };
    }),
    
    "hurlement": new Skill("Hurlement", 5, 3, "physique", "Baisse la Défense", (user, target) => {
        // Réduit la défense de la cible de 25%
        let debuff = Math.floor(target.def * 0.25);
        target.applyBuff("def", -debuff, 3);
        return { customMsg: ` effraie la cible (-${debuff} Def)` };
    }),

    "peau_de_pierre": new Skill("Peau de Pierre", 10, 3, "terre", "+50% Défense", (user, target) => {
        // Augmente la défense de 50%
        let boost = Math.floor(user.def * 0.50);
        user.applyBuff("def", boost, 3);
        return { customMsg: ` durcit sa peau (+${boost} Def)` };
    }),

    // --- DOT & STATUS (Calculés sur la stat brute) ---

    "orbe_de_poison": new Skill("☠️ Poison", 10, 3, "tenebres", "Dégâts + Poison", (user, target) => {
        // 1. Impact initial
        let impactDmg = Math.floor(user.int * 1.5);
        let dmgResult = target.receiveDamage(impactDmg, "tenebres");
        
        // 2. DoT (Damage over Time)
        // On stocke la puissance brute (ex: 40% de l'Int). 
        // receiveDamage sera appelé à chaque tour par triggerStatusEffects, donc l'armure s'appliquera à chaque tick.
        let dotPower = Math.floor(user.int * 0.4); 
        target.applyEffect("Poison", dotPower, 3, "tenebres");
        
        return { 
            dmg: dmgResult.dmg, 
            customMsg: ` et infecte la cible !` 
        };
    }),
    
    "coup_vampire": new Skill("🧛 Vampirisme", 12, 3, "tenebres", "Vole de la vie", (user, target) => {
        let rawPower = Math.floor(user.str * 1.5); 
        let result = target.receiveDamage(rawPower, "tenebres");
        
        let healAmount = Math.floor(result.dmg / 2); // Soin = 50% des dégâts réels infligés
        user.currentHp = Math.min(user.maxHp, user.currentHp + healAmount);
        
        return { 
            dmg: result.dmg, 
            customMsg: ` et récupère ${healAmount} PV !` 
        };
    }),

    "saignement": new Skill("🩸 Entaille", 8, 3, "physique", "Saignement", (user, target) => {
        let rawPower = Math.floor(user.str * 1.0);
        let result = target.receiveDamage(rawPower, "physique");
        
        // Saignement basé sur 30% de la Force
        let bleedPower = Math.floor(user.str * 0.3);
        target.applyEffect("Saignement", bleedPower, 3, "physique");
        
        return {
            dmg: result.dmg,
            customMsg: " et ouvre une plaie profonde !"
        };
    }),

    "execution": new Skill("💀 Exécution", 20, 5, "physique", "Dégâts x3 si PV bas", (user, target) => {
        let multiplier = 2.0;
        // Si la cible a moins de 30% PV
        if (target.currentHp < (target.maxHp * 0.3)) {
            multiplier = 4.0; // Critique garanti
        }
        
        let rawPower = Math.floor(user.str * multiplier);
        return target.receiveDamage(rawPower, "physique");
    }),

    "berserk": new Skill("😡 Berserk", 10, 5, "physique", "Sacrifice Def pour Atk", (user, target) => {
        // +50% Force / -30% Défense
        let boostStr = Math.floor(user.str * 0.5);
        let malusDef = Math.floor(user.def * 0.3);
        
        user.applyBuff("str", boostStr, 3);
        user.applyBuff("def", -malusDef, 3);
        
        return { customMsg: ` entre en rage (+${boostStr} Str / -${malusDef} Def)` };
    }),

    // --- SORTILÈGES AVANCÉS ---

    "eclair": new Skill("⚡ Éclair", 15, 3, "electrique", "Perce l'Armure", (user, target) => {
        // Astuce : On envoie une grosse puissance, et comme c'est "electrique", 
        // si le monstre n'a pas de résistance spécifique, il prend cher.
        // Mais pour simuler la "pénétration", on tape fort.
        let rawPower = Math.floor(user.int * 2.8);
        return target.receiveDamage(rawPower, "electrique");
    }),

    "seisme": new Skill("🌍 Séisme", 20, 4, "terre", "Gros dégâts Terre", (user, target) => {
        let rawPower = Math.floor(user.int * 3.0);
        return target.receiveDamage(rawPower, "terre");
    }),

    "mur_de_glace": new Skill("❄️ Mur de Glace", 15, 4, "eau", "Boost Défenses", (user, target) => {
        // +40% aux deux défenses
        let boostDef = Math.floor(user.def * 0.4);
        let boostMag = Math.floor(user.magDef * 0.4);
        
        user.applyBuff("def", boostDef, 3);
        user.applyBuff("magDef", boostMag, 3);
        return { customMsg: ` s'entoure de glace (+${boostDef} Def / +${boostMag} M.Def)` };
    }),

    "meditation": new Skill("🧘 Méditation", 0, 4, "lumiere", "Récupère du Mana", (user, target) => {
        // Récupère 20 MP + 20% de l'Intel
        let manaGain = 20 + Math.floor(user.int * 0.2);
        user.currentMp = Math.min(user.maxMp, user.currentMp + manaGain);
        return { 
            customMsg: ` se concentre et récupère ${manaGain} MP` 
        };
    }),

    "lumiere_sacree": new Skill("✨ Lumière Sacrée", 25, 4, "lumiere", "Dégâts + Soin", (user, target) => {
        let rawPower = Math.floor(user.int * 2.5);
        let result = target.receiveDamage(rawPower, "lumiere");
        
        let heal = Math.floor(user.int * 0.5);
        user.currentHp = Math.min(user.maxHp, user.currentHp + heal);

        return {
            dmg: result.dmg,
            customMsg: ` et une aura vous soigne de ${heal} PV.`
        };
    }),

    "choc_mental": new Skill("🧠 Choc Mental", 10, 3, "tenebres", "Dégâts + Debuff Int", (user, target) => {
        let rawPower = Math.floor(user.int * 1.5);
        
        // Debuff d'intelligence (30%)
        let debuff = Math.floor(target.int * 0.3);
        target.applyBuff("int", -debuff, 3);
        
        let result = target.receiveDamage(rawPower, "tenebres");
        return {
            dmg: result.dmg,
            customMsg: ` et trouble l'esprit (-${debuff} Int)`
        };
    }),
    
    "attaque_sournoise": new Skill("🗡️ Sournoise", 8, 2, "physique", "Dégâts élevés", (user, target) => {
        // Ignore une partie de l'armure (simulé par un gros multiplicateur)
        let rawPower = Math.floor(user.str * 2.2);
        return target.receiveDamage(rawPower, "physique");
    }),

    "dague_poison": new Skill("☠️ Dague Poison", 6, 3, "terre", "Faible dégât + DoT", (user, target) => {
        let dmg = Math.floor(user.str * 0.8);
        target.applyEffect("Poison Mortel", Math.floor(user.str * 0.5), 4, "terre");
        return target.receiveDamage(dmg, "physique"); // Le coup initial est physique
    }),

    "vol_de_mana": new Skill("💧 Vol de Mana", 0, 4, "tenebres", "Vole 15 MP", (user, target) => {
        let stolen = 15;
        // On ne peut pas voler plus que ce que la cible a (optionnel, ici on simplifie)
        user.currentMp = Math.min(user.maxMp, user.currentMp + stolen);
        let dmg = Math.floor(user.str * 1.0);
        let res = target.receiveDamage(dmg, "physique");
        res.customMsg = ` et vole ${stolen} MP !`;
        return res;
    }),

    "pluie_lames": new Skill("⚔️ Pluie de Lames", 15, 3, "physique", "Dégâts brutaux", (user, target) => {
        let rawPower = Math.floor(user.str * 2.5); 
        return target.receiveDamage(rawPower, "physique");
    }),

    "camouflage": new Skill("👻 Camouflage", 10, 5, "physique", "Boost esquive (Def)", (user, target) => {
        // On simule l'esquive par une défense massive temporaire
        let buff = 50;
        user.applyBuff("def", buff, 2);
        return { customMsg: " devient difficile à toucher (+50 Def)" };
    }),
    
    "choc_bouclier": new Skill("🛡️ Coup Bouclier", 8, 2, "physique", "Dégâts basés sur la Def", (user, target) => {
        // Utilise la DÉFENSE au lieu de la Force pour les dégâts !
        let rawPower = Math.floor(user.def * 1.8);
        return target.receiveDamage(rawPower, "physique");
    }),

    "imposition_mains": new Skill("🙌 Imposition", 20, 5, "lumiere", "Soin majeur", (user, target) => {
        // Gros soin personnel
        let heal = Math.floor(user.maxHp * 0.4); // 40% des PV max
        user.currentHp = Math.min(user.maxHp, user.currentHp + heal);
        return { customMsg: ` récupère ${heal} PV grâce à la foi.` };
    }),

    "chatiment": new Skill("⚡ Châtiment", 12, 2, "lumiere", "Dégâts mixtes (Str + Int)", (user, target) => {
        let rawPower = Math.floor(user.str) + Math.floor(user.int);
        return target.receiveDamage(rawPower, "lumiere");
    }),

    "aura_devotion": new Skill("✨ Aura Dévotion", 15, 5, "lumiere", "Buff global Def/M.Def", (user, target) => {
        user.applyBuff("def", 10, 4);
        user.applyBuff("magDef", 10, 4);
        return { customMsg: " brille d'une aura protectrice (+10 Def/M.Def)" };
    }),

    "martyr": new Skill("🩸 Martyr", 0, 3, "physique", "Sacrifie PV pour Mana", (user, target) => {
        let hpCost = Math.floor(user.maxHp * 0.15);
        if (user.currentHp > hpCost) {
            user.currentHp -= hpCost;
            user.currentMp = Math.min(user.maxMp, user.currentMp + 40);
            return { customMsg: ` sacrifie ${hpCost} PV pour 40 MP` };
        } else {
            return { customMsg: " est trop faible pour utiliser Martyr !" };
        }
    }),
    
    "stalactite": new Skill("❄️ Stalactite", 12, 2, "eau", "Perce Armure Magique", (user, target) => {
        // Simule la pénétration magique par de gros dégâts
        let rawPower = Math.floor(user.int * 2.3);
        return target.receiveDamage(rawPower, "eau");
    }),

    "blizzard": new Skill("🌨️ Blizzard", 25, 5, "eau", "Gros dégâts + Debuff Force", (user, target) => {
        let rawPower = Math.floor(user.int * 2.5);
        let debuff = Math.floor(target.str * 0.2); // -20% force
        target.applyBuff("str", -debuff, 3);
        let res = target.receiveDamage(rawPower, "eau");
        res.customMsg = ` et gèle les muscles (-${debuff} Str)`;
        return res;
    }),

    "boule_magma": new Skill("☄️ Météore", 30, 6, "feu", "Dégâts ultimes", (user, target) => {
        let rawPower = Math.floor(user.int * 5.0); // Très puissant
        return target.receiveDamage(rawPower, "feu");
    }),

    "tornade": new Skill("🌪️ Tornade", 14, 3, "physique", "Vent tranchant", (user, target) => {
        // Dégâts basés sur l'Int mais type Physique (vent)
        let rawPower = Math.floor(user.int * 2.0);
        return target.receiveDamage(rawPower, "physique"); // Le vent tape en physique
    }),
    
    "racines": new Skill("🌿 Racines", 10, 3, "terre", "Dégâts + Baisse Def", (user, target) => {
        let rawPower = Math.floor(user.int * 1.5);
        target.applyBuff("def", -5, 3);
        return target.receiveDamage(rawPower, "terre");
    }),
    
    "coup_pommeau": new Skill("😵 Coup Pommeau", 5, 2, "physique", "Interrompt (Baisse Int)", (user, target) => {
        let dmg = Math.floor(user.str * 0.8);
        target.applyBuff("int", -10, 2); // "Silence" partiel
        return target.receiveDamage(dmg, "physique");
    }),

    "transpercement": new Skill("🏹 Transpercer", 15, 4, "physique", "Efficace contre haute Def", (user, target) => {
        // Formule spéciale : Dégâts fixes + % Str, ignore en partie la mitigation via un haut montant brut
        let rawPower = Math.floor(user.str * 3.0);
        return target.receiveDamage(rawPower, "physique");
    }),

    "rage_sanglante": new Skill("💢 Rage", 0, 5, "physique", "Soin si dégâts reçus (DoT)", (user, target) => {
        // Donne un HoT (Heal over Time)
        user.applyEffect("Régénération", -15, 3, "lumiere"); // Dégâts négatifs = Soin dans ton système ?
        // ATTENTION : Ton système de DoT actuel fait des dégâts. 
        // Si tu veux un HoT, il faut modifier receiveDamage ou applyEffect.
        // Pour l'instant, faisons un simple buff de Force :
        user.applyBuff("str", 10, 3);
        return { customMsg: " s'énerve (+10 Str)" };
    }),

    "brise_armure": new Skill("🔨 Brise-Armure", 12, 3, "physique", "Gros Debuff Def", (user, target) => {
        let dmg = Math.floor(user.str * 1.2);
        target.applyBuff("def", -15, 4);
        let res = target.receiveDamage(dmg, "physique");
        res.customMsg = " et fracasse l'armure (-15 Def)";
        return res;
    }),
    
    "ombre_liquide": new Skill("🌑 Ombre", 10, 3, "tenebres", "Augmente Def Magique", (user, target) => {
        user.applyBuff("magDef", 20, 3);
        return { customMsg: " se fond dans l'ombre (+20 M.Def)" };
    }),

    "vapeur_acide": new Skill("🧪 Acide", 15, 4, "eau", "Gros DoT Physique", (user, target) => {
        // L'acide ronge (Physique)
        target.applyEffect("Corrosion", Math.floor(user.int * 0.6), 4, "physique");
        return { customMsg: " projette un nuage corrosif !" };
    }),

    "regard_petrifiant": new Skill("🗿 Pétrification", 15, 5, "terre", "Baisse Def et M.Def", (user, target) => {
        target.applyBuff("def", -5, 3);
        target.applyBuff("magDef", -5, 3);
        let rawPower = Math.floor(user.int * 1.5);
        return target.receiveDamage(rawPower, "terre");
    }),
    
    "drain_vie": new Skill("🕸️ Drain", 12, 2, "tenebres", "Dégât + Soin", (user, target) => {
        let dmg = Math.floor(user.int * 1.5);
        let res = target.receiveDamage(dmg, "tenebres");
        let heal = Math.floor(res.dmg * 0.5);
        user.currentHp = Math.min(user.maxHp, user.currentHp + heal);
        res.customMsg = ` et absorbe ${heal} PV`;
        return res;
    }),

     "flamme_noire": new Skill("⚫ Flamme Noire", 20, 4, "feu", "Feu + Ténèbres", (user, target) => {
        // Un sort hybride thématique
        let rawPower = Math.floor(user.int * 2.5);
        let res = target.receiveDamage(rawPower, "tenebres"); // Tape en ténèbres
        // Ajoute un DoT de feu
        target.applyEffect("Brûlure Maudite", Math.floor(user.int * 0.3), 3, "feu");
        res.customMsg = " et brûle l'âme !";
        return res;
    }),
    
    "jugement_dernier": new Skill("⚖️ Jugement", 40, 8, "lumiere", "Dégâts immenses", (user, target) => {
        let rawPower = Math.floor(user.int * 6.0);
        return target.receiveDamage(rawPower, "lumiere");
    }),

    "assassinat": new Skill("🗡️ Assassinat", 30, 8, "physique", "Tue si PV bas", (user, target) => {
        let rawPower = Math.floor(user.str * 3.0);
        if(target.currentHp < target.maxHp * 0.25) {
            rawPower = rawPower * 3; // x9 total si < 25% PV
        }
        return target.receiveDamage(rawPower, "physique");
    }),

    "avatar_titan": new Skill("🗿 Avatar", 40, 10, "terre", "Devient invincible (presque)", (user, target) => {
        user.applyBuff("def", 100, 3);
        user.applyBuff("magDef", 100, 3);
        user.applyBuff("str", 20, 3);
        return { customMsg: " se transforme en TITAN !" };
    }),
    
    "supernova": new Skill("🌟 Supernova", 50, 10, "feu", "L'ultime du Mage Feu", (user, target) => {
        let rawPower = Math.floor(user.int * 7.0); 
        // Coût en mana énorme, dégâts énormes
        return target.receiveDamage(rawPower, "feu");
    }),
    
    "paix_interieure": new Skill("🧘 Paix", 0, 6, "lumiere", "Regen Full Mana", (user, target) => {
        // Soin complet du mana, mais passe le tour (pas de dégâts)
        user.currentMp = user.maxMp;
        return { customMsg: " médite profondément et restaure tout son Mana." };
    })

};
