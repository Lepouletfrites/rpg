// CLASSE DE BASE : Modèle pour créer n'importe quel personnage
class Character {
    constructor(name, maxHp, maxMp, str, def) {
        this.name = name;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.maxMp = maxMp;
        this.currentMp = maxMp;
        this.str = str; // Force
        this.def = def; // Défense
    }

    // Méthode pour attaquer une cible
    attack(target) {
        // Formule de dégâts : (Force de l'attaquant) - (Défense de la cible / 2)
        // Math.max(1, ...) assure qu'on fait au moins 1 dégât
        let damage = Math.max(1, this.str - Math.floor(target.def / 2));
        
        // Ajout d'un peu d'aléatoire (+/- 20%)
        const variance = Math.floor(damage * 0.2);
        damage += Math.floor(Math.random() * variance * 2) - variance;

        target.currentHp -= damage;
        if (target.currentHp < 0) target.currentHp = 0;
        
        return damage;
    }

    // Méthode pour dépenser du mana
    useMana(amount) {
        if (this.currentMp >= amount) {
            this.currentMp -= amount;
            return true;
        }
        return false;
    }
}
class Skill {
    constructor(name, cost, description, effectFunction) {
        this.name = name;
        this.cost = cost; // Coût en Mana
        this.description = description;
        this.effect = effectFunction; // C'est ici qu'on stocke la logique du sort !
    }
}

// CLASSE DU JEU : Gère l'interface et les tours
class Game {
    constructor() {
        // Création des personnages avec des stats (Nom, PV, MP, Force, Défense)
        this.hero = new Character("Héros", 100, 50, 15, 5);
        this.monster = new Character("Orc Enragé", 120, 0, 12, 3);
        
        this.isPlayerTurn = true;
        this.updateUI();
    }

    // Fonction appelée quand le joueur clique sur un bouton
    playerAction(actionType) {
        if (!this.isPlayerTurn) return; // Empêche de jouer si ce n'est pas ton tour

        let message = "";
        let turnOver = true;

        if (actionType === 'attack') {
            const dmg = this.hero.attack(this.monster);
            message = `${this.hero.name} attaque et inflige ${dmg} dégâts !`;
        } 
        else if (actionType === 'fireball') {
            if (this.hero.useMana(10)) {
                // La magie ignore la défense !
                const dmg = 25; 
                this.monster.currentHp -= dmg;
                message = `${this.hero.name} lance Boule de Feu ! ${dmg} dégâts !`;
            } else {
                this.log("Pas assez de Mana !");
                turnOver = false; // Le tour ne passe pas, on peut rechoisir
            }
        }
        else if (actionType === 'heal') {
            if (this.hero.useMana(15)) {
                const healAmount = 30;
                this.hero.currentHp = Math.min(this.hero.maxHp, this.hero.currentHp + healAmount);
                message = `${this.hero.name} se soigne de ${healAmount} PV.`;
            } else {
                this.log("Pas assez de Mana !");
                turnOver = false;
            }
        }

        if (turnOver) {
            this.log(message);
            this.updateUI();
            this.checkWinCondition();
            
            if (this.monster.currentHp > 0) {
                this.isPlayerTurn = false;
                // Petit délai pour que l'ennemi ne joue pas instantanément
                setTimeout(() => this.enemyTurn(), 1000); 
            }
        }
    }

    enemyTurn() {
        const dmg = this.monster.attack(this.hero);
        this.log(`${this.monster.name} attaque violemment et inflige ${dmg} dégâts !`);
        this.isPlayerTurn = true;
        this.updateUI();
        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.monster.currentHp <= 0) {
            this.log("Victoire ! L'ennemi est vaincu !");
            this.isPlayerTurn = false; // Fin du jeu
            document.getElementById('enemy-sprite').textContent = "💀";
        } else if (this.hero.currentHp <= 0) {
            this.log("Défaite... Vous êtes mort.");
            this.isPlayerTurn = false;
        }
    }

    // Mise à jour de l'affichage HTML
    updateUI() {
        // Héro
        document.getElementById('player-hp-text').innerText = `${this.hero.currentHp}/${this.hero.maxHp} PV`;
        document.getElementById('player-mp-text').innerText = `${this.hero.currentMp}/${this.hero.maxMp} MP`;
        document.getElementById('player-hp-bar').style.width = `${(this.hero.currentHp / this.hero.maxHp) * 100}%`;
        document.getElementById('player-mp-bar').style.width = `${(this.hero.currentMp / this.hero.maxMp) * 100}%`;

        // Monstre
        document.getElementById('enemy-name').innerText = this.monster.name;
        document.getElementById('enemy-hp-text').innerText = `${this.monster.currentHp}/${this.monster.maxHp} PV`;
        document.getElementById('enemy-hp-bar').style.width = `${(this.monster.currentHp / this.monster.maxHp) * 100}%`;
    }

    log(message) {
        const logBox = document.getElementById('combat-log');
        logBox.innerHTML += `<p>${message}</p>`;
        logBox.scrollTop = logBox.scrollHeight; // Scrolle auto vers le bas
    }
}

// Lancer le jeu
const game = new Game();
