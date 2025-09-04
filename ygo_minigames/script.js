const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

let currentCard = null;
let score = 0;
let currentAnswer = '';
let currentMode = '';

const gameSelectionDiv = document.getElementById('game-selection');
const gameAreaDiv = document.getElementById('game-area');
const gameTitle = document.getElementById('game-title');
const gamePrompt = document.getElementById('game-prompt');
const cardImage = document.getElementById('card-image');
const optionsContainer = document.getElementById('options-container');
const inputContainer = document.getElementById('input-container');
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const cardInfoDiv = document.getElementById('card-info');
const feedbackDiv = document.getElementById('feedback');
const scoreCounter = document.getElementById('score-counter');
const nextRoundBtn = document.getElementById('next-round-btn');
const mainMenuBtn = document.getElementById('main-menu-btn');

const cardPairContainer = document.getElementById('card-pair-container');
const cardLeft = document.getElementById('card-left');
const cardRight = document.getElementById('card-right');

document.querySelectorAll('.game-button').forEach(button => {
    button.addEventListener('click', (e) => {
        currentMode = e.target.dataset.game;
        startGame();
    });
});

submitBtn.addEventListener('click', () => checkGuess());
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkGuess();
    }
});
nextRoundBtn.addEventListener('click', () => {
    feedbackDiv.textContent = '';
    nextRoundBtn.classList.add('hidden');
    cardInfoDiv.classList.add('hidden');
    startGame();
});
mainMenuBtn.addEventListener('click', () => {
    gameSelectionDiv.classList.remove('hidden');
    gameAreaDiv.classList.add('hidden');
    feedbackDiv.textContent = '';
    score = 0;
    scoreCounter.textContent = `Score: 0`;
});

async function startGame() {
    gameSelectionDiv.classList.add('hidden');
    gameAreaDiv.classList.remove('hidden');
    optionsContainer.classList.add('hidden');
    inputContainer.classList.add('hidden');
    cardImage.classList.add('hidden');
    cardPairContainer.classList.add('hidden');

    try {
        if (currentMode === 'whichCardIsOlder') {
            await setupWhichCardIsOlder();
        } else {
            const card = await getRandomCard();
            currentCard = card;

            switch (currentMode) {
                case 'guessTheCard':
                    setupGuessTheCard(card);
                    break;
                case 'guessTheArt':
                    setupGuessTheArt(card);
                    break;
                case 'guessTheName':
                    setupGuessTheName(card);
                    break;
                case 'productGuessing':
                    setupProductGuessing(card);
                    break;
                case 'smallWorldChallenge':
                    setupSmallWorldChallenge(card);
                    break;
            }
        }
    } catch (error) {
        feedbackDiv.textContent = 'Failed to load card. Please try again.';
        console.error(error);
    }
}

async function getRandomCard() {
    let card = null;
    let validCardFound = false;
    while (!validCardFound) {
        const response = await fetch(`${API_URL}?num=1&offset=${Math.floor(Math.random() * 10000)}`);
        const data = await response.json();
        card = data.data[0];
        if (card.card_sets && card.card_sets.length > 0) {
            const setName = card.card_sets[0].set_name.toLowerCase();
            if (!setName.includes('rush') && !setName.includes('speed')) {
                validCardFound = true;
            }
        }
    }
    return card;
}

async function getMultipleRandomCards(count) {
    const cards = [];
    while (cards.length < count) {
        const card = await getRandomCard();
        if (!cards.find(c => c.id === card.id)) {
            cards.push(card);
        }
    }
    return cards;
}

function displayCardImage(card, element) {
    const imageUrl = (currentMode === 'guessTheArt') ? card.card_images[0].image_url_cropped : card.card_images[0].image_url;
    element.src = imageUrl;
    element.alt = card.name;
    element.classList.remove('hidden');
}

function checkGuess() {
    const userAnswer = userInput.value.toLowerCase().trim();
    const correctAnswer = currentAnswer;

    if (userAnswer === correctAnswer) {
        updateScore(true);
    } else {
        updateScore(false, currentCard.name);
    }
    nextRoundBtn.classList.remove('hidden');
    inputContainer.classList.add('hidden');
}

function updateScore(isCorrect, correctName = null) {
    if (isCorrect) {
        feedbackDiv.textContent = `Correct! It's ${correctName || currentCard.name}!`;
        feedbackDiv.style.color = '#28a745';
        score++;
    } else {
        feedbackDiv.textContent = `Incorrect. The correct answer was ${correctName || currentCard.name}.`;
        feedbackDiv.style.color = '#dc3545';
        score = 0;
    }
    scoreCounter.textContent = `Score: ${score}`;
}

function createOptionButtons(options, correctAnswer) {
    optionsContainer.innerHTML = '';
    optionsContainer.classList.remove('hidden');
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.addEventListener('click', () => {
            checkOption(button, option, correctAnswer);
        });
        optionsContainer.appendChild(button);
    });
}

function checkOption(button, option, correctAnswer) {
    document.querySelectorAll('.option-button').forEach(btn => btn.disabled = true);
    if (option === correctAnswer) {
        button.classList.add('correct');
        updateScore(true, correctAnswer);
    } else {
        button.classList.add('incorrect');
        updateScore(false, correctAnswer);
    }
    nextRoundBtn.classList.remove('hidden');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function setupGuessTheCard(card) {
    gameTitle.textContent = "Guess the Card";
    gamePrompt.textContent = "What is the name of this card?";
    displayCardImage(card, cardImage);
    inputContainer.classList.remove('hidden');
    userInput.value = '';
    currentAnswer = card.name.toLowerCase();
}

async function setupGuessTheArt(card) {
    gameTitle.textContent = "Guess the Art";
    gamePrompt.textContent = "Which card does this artwork belong to?";
    displayCardImage(card, cardImage);

    const correctOption = card.name;
    const otherCards = (await getMultipleRandomCards(3)).map(c => c.name);
    const options = shuffleArray([correctOption, ...otherCards]);
    createOptionButtons(options, correctOption);
}

function setupGuessTheName(card) {
    gameTitle.textContent = "Guess the Name";
    gamePrompt.textContent = "What card has these details?";
    cardInfoDiv.innerHTML = `
        <h3>Card Details</h3>
        <p><strong>Type:</strong> ${card.type}</p>
        <p><strong>Attribute:</strong> ${card.attribute || 'N/A'}</p>
        <p><strong>Level:</strong> ${card.level || 'N/A'}</p>
        <p><strong>ATK/DEF:</strong> ${card.atk || 'N/A'} / ${card.def || 'N/A'}</p>
        <p><strong>Description:</strong> ${card.desc}</p>
    `;
    cardInfoDiv.classList.remove('hidden');
    inputContainer.classList.remove('hidden');
    userInput.value = '';
    currentAnswer = card.name.toLowerCase();
}

async function setupProductGuessing(card) {
    gameTitle.textContent = "Product Guessing";
    gamePrompt.textContent = "Which booster pack or set is this card from?";
    displayCardImage(card, cardImage);

    if (!card.card_sets || card.card_sets.length === 0) {
        feedbackDiv.textContent = 'Product information not available for this card. Try another one.';
        nextRoundBtn.classList.remove('hidden');
        return;
    }

    const correctSet = card.card_sets[0].set_name;
    const otherSets = (await getMultipleRandomCards(3)).filter(c => c.card_sets && c.card_sets.length > 0).map(c => c.card_sets[0].set_name);
    const options = shuffleArray([correctSet, ...otherSets]);
    createOptionButtons(options, correctSet);
}

async function setupSmallWorldChallenge(card) {
    gameTitle.textContent = "Small World Challenge";
    gamePrompt.textContent = "Find a card that shares a property (Type, Attribute, Level/Rank/Link) with this card, but not its name. The new card must then share a property with another random card, but not its name.";
    
    displayCardImage(card, cardImage);
    cardInfoDiv.innerHTML = `
        <h3>Current Card: ${card.name}</h3>
        <p><strong>Type:</strong> ${card.type}</p>
        <p><strong>Attribute:</strong> ${card.attribute || 'N/A'}</p>
        <p><strong>Level/Rank:</strong> ${card.level || card.rank || card.linkval || 'N/A'}</p>
    `;
    cardInfoDiv.classList.remove('hidden');
    inputContainer.classList.remove('hidden');
    userInput.value = '';
    
    currentAnswer = card.name.toLowerCase();
    const randomCard = await getRandomCard();
    
    const sharedProperties = [];
    if (card.type === randomCard.type) sharedProperties.push('Type');
    if (card.attribute === randomCard.attribute) sharedProperties.push('Attribute');
    if ( (card.level || card.rank || card.linkval) === (randomCard.level || randomCard.rank || randomCard.linkval) ) sharedProperties.push('Level/Rank/Link');
    
    gamePrompt.textContent = `Find a card that shares a property (Type, Attribute, Level/Rank/Link) with this card: "${card.name}". (You can type its name to check)`;
}

async function setupWhichCardIsOlder() {
    gameTitle.textContent = "Which Card Is Older?";
    gamePrompt.textContent = "Click on the card that was released earlier.";
    
    const [card1, card2] = await getTwoDifferentCards();
    
    if (!card1.card_sets || card1.card_sets.length === 0 || !card2.card_sets || card2.card_sets.length === 0) {
        feedbackDiv.textContent = 'Could not find release date information for one or both cards. Retrying...';
        nextRoundBtn.classList.remove('hidden');
        return;
    }
    
    displayCardImage(card1, document.getElementById('card-image-left'));
    displayCardImage(card2, document.getElementById('card-image-right'));
    cardPairContainer.classList.remove('hidden');

    cardLeft.onclick = () => checkOlderCard(card1, card2);
    cardRight.onclick = () => checkOlderCard(card2, card1);
}

async function getTwoDifferentCards() {
    let card1 = await getRandomCard();
    let card2 = await getRandomCard();
    while (card1.id === card2.id || (card1.card_sets && card2.card_sets && card1.card_sets[0].set_name === card2.card_sets[0].set_name)) {
        card2 = await getRandomCard();
    }
    return [card1, card2];
}

function getCardReleaseDate(card) {
    const set = card.card_sets[0];
    return new Date(set.set_release_date);
}

function checkOlderCard(selectedCard, otherCard) {
    const date1 = getCardReleaseDate(selectedCard);
    const date2 = getCardReleaseDate(otherCard);

    const selectedName = selectedCard.name;
    const otherName = otherCard.name;

    let isCorrect = false;
    let correctCardName = '';
    
    if (date1 < date2) {
        isCorrect = true;
        correctCardName = selectedName;
    } else if (date2 < date1) {
        isCorrect = false;
        correctCardName = otherName;
    } else {
        feedbackDiv.textContent = `It's a tie! Both cards were released at the same time.`;
        score++;
    }
    
    if (isCorrect) {
        updateScore(true, selectedName);
    } else if (date1 !== date2) {
        updateScore(false, otherName);
    }

    nextRoundBtn.classList.remove('hidden');
    cardLeft.onclick = null;
    cardRight.onclick = null;
}
