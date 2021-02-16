import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import IndexCard from './IndexCard';
import './Corkboard.css';


const Corkboard = ({currentStoryId, backToDesk, addSceneCallback}) => {
    const [cards, setCards] = useState([]);
    const [showNewCardModal, setShowNewCardModal] = useState(false);
    const [showChangeCardModal, setShowChangeCardModal] = useState(false);
    const [currentCard, setCurrentCard] = useState({
        id: null,
        card_summary: '',
        location: null,
        content_blocks: '',
        story: null,
        entity_key: '',
    });

    // gets and remembers the scene cards associated with the current story
    useEffect(() => {
        getScenes();
    }, []);
    
    const getScenes = () => {
        axios
            .get(`http://52.32.18.200/api/scenes/?story=${currentStoryId}`)
            .then(response => {
                setCards(response.data);
            })
            .catch(error => console.log(error.response.data));
    }
    

    const popOutCard = (card) => {
        console.log('popoutcard')
        const selectedCard = {
            id: card.id,
            card_summary: card.card_summary,
            location: card.location,
            content_blocks: card.content_blocks,
            story: card.story,
            entity_key: card.entity_key,
        }
        setCurrentCard(selectedCard);
        setShowChangeCardModal(true);
    }
    
    const closeModal = () => {
        setShowNewCardModal(false);
        setShowChangeCardModal(false);
        setCurrentCard({
            id: null,
            card_summary: '',
            location: null,
            content_blocks: [],
            story: null,
            entity_key: '',
        })
    }

    const cardComponents = cards.map((card, i) => {
        card.story = parseInt(card.story)
        return (
            <IndexCard 
                key={card.id} 
                showCard={popOutCard} 
                card={card}/>
        )
    });

    const openNewCard = () => {
        setShowNewCardModal(true);
    }

    const saveNewCard = () => {
        const sceneBreakId = Math.random().toString(36).substring(2,10);

        const newCard = {
            card_summary: currentCard.card_summary,
            location: cards.length,
            story: currentStoryId,
            entity_key: sceneBreakId
        }

        axios
            .post("http://52.32.18.200/api/scenes/", newCard)
            .then(response => console.log(response.data))
            .catch(error => console.log(error.response))

        const expandedCards = [...cards];
        expandedCards.push(newCard);
        setCards(expandedCards);

        closeModal();
        addSceneCallback(newCard);
    };

    const changeCardSummary = (event) => {
        const updatedCard = {
            id: currentCard.id,
            card_summary: event.target.value,
            location: currentCard.location,
            content_blocks: currentCard.content_blocks,
            story: currentStoryId,
            entity_key: currentCard.entity_key,
        };

        setCurrentCard(updatedCard);
    };

    const saveCardChanges = () => {
        axios
            .put(`http://52.32.18.200/api/scenes/${currentCard.id}/`, currentCard)
            .then(response => console.log(response.data))
            .catch(error => console.log(error.response.data))

        const updatedCards = [];
        cards.forEach((card) => {
            if (card.id === currentCard.id) {
                updatedCards.push(currentCard);
            } else {
                updatedCards.push(card);
            }
        });
        setCards(updatedCards);
        closeModal();
    };

    const confirmDelete = () => {
        if (confirm("are you sure you want to delete this scene?")) {
            deleteCard();
        }
    }

    const deleteCard = () => {
        let mod = 0;
        const trimmedCards = [];

        cards.forEach((card, index) => {
            // keeps all cards except deleted one, but updates their locations
            // locally in state and in the database with a put request
            if (card.id !== currentCard.id) {
                const updated = {...card}
                updated.location = index - mod
                trimmedCards.push(updated)

                axios
                .put(`http://52.32.18.200/api/scenes/${updated.id}/`, updated)
                .then(response => console.log(response.data))
                .catch(error => console.log(error.response.data))
            } else {
                // deletes the card we want deleted and tracks whether we've gotten to that card yet in our order
                mod++;
                axios
                    .put(`http://52.32.18.200/api/scenes/${currentCard.id}/`, {...card, location: null})
                    .then(response => console.log(response.data))
                    .catch(error => console.log(error.response.data))
            }
        })
        // saves the reordered scenes with the correctly updated locations in state
        setCards(trimmedCards);
        closeModal();
    }

    const moveCard = (mod) => {
        // prevents card from being moved outside the range of existing scenes
        if ((currentCard.location + mod >= cards.length) || (currentCard.location + mod < 0)) {
            closeModal();
            return;
        }
        
        // saves in case user has made summary changes they haven't saved
        saveCardChanges();
        
        // makes a new array of all scene objects
        // removes the active scene from the array
        // adds teh active scene back in moved one place forward or backward
        const shuffleCards = [...cards];
        shuffleCards.splice(currentCard.location, 1)
        shuffleCards.splice(currentCard.location + mod, 0, currentCard)

        // iterates through the scenes, reassinging each card's location value
        // to its current index in the reordered array
        const updateLocations = shuffleCards.map((card, index) => {
            const updateCard = {...card};
            updateCard.location = index;

            axios
                .put(`http://52.32.18.200/api/scenes/${updateCard.id}/`, updateCard)
                .then(response => console.log(response.data))
                .catch(error => console.log(error.response.data))

            return updateCard;
        });
        // saves the reordered scenes with the correctly updated locations in state
        setCards(updateLocations);

        // updates the currentCard object in state to have the correct location
        setCurrentCard({
            id: currentCard.id,
            card_summary: currentCard.card_summary,
            location: currentCard.location + 1,
            content_blocks: currentCard.content_blocks,
            story: currentCard.story,
            entity_key: currentCard.entity_key,
        });
    }


    const newCardModal = () => {
        return (
            <Modal 
                show={showNewCardModal}
                onHide={closeModal}
                animation={false}
                backdrop='static'
                centered={true}
            >    
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>What's a quick summary of what happens in this scene?</Form.Label>
                            <Form.Control
                                as='textarea'
                                value={currentCard.card_summary}
                                onChange={changeCardSummary}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
            
                <Modal.Footer>
                    <button className="btn btn-yellow" onClick={closeModal}>Close</button>
                    <button className="btn btn-light-green" onClick={saveNewCard}>Save New Scene</button>
                </Modal.Footer>
            </Modal>
        )
    }


    const changeCardModal = () => {
        return (
            <Modal 
                show={showChangeCardModal}
                onHide={closeModal}
                animation={false}
                backdrop='static'
                centered={true}
            >    
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Scene Summary</Form.Label>
                            <Form.Control
                                as='textarea'
                                value={currentCard.card_summary}
                                onChange={changeCardSummary}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
            
                <Modal.Footer>
                    <button className="btn btn-yellow" onClick={closeModal}>Close</button>
                    <button className="btn btn-light-green" onClick={saveCardChanges}>Save Changes</button> 
                    {currentCard.location === 0 ? null : <button className="btn btn-yellow" onClick={() => moveCard(-1)}>Move Scene Earlier</button>}
                    {currentCard.location === cards.length - 1 ? null : <button className="btn btn-yellow" onClick={() => moveCard(1)}>Move Scene Later</button>}
                    <button onClick={confirmDelete} className="btn btn-red">Delete Scene</button>
                </Modal.Footer>
            </Modal>
        )
    }

    return (
        <div className="corkboard__wall rounded">
            {/* <div className="corkboard__frame rounded p-5 d-flex justify-content-center align-items-center"> */}
                <div className="corkboard__board d-flex flex-wrap justify-content-center p-2">{cardComponents}</div>
            {/* </div> */}

            <div className="corkboard__button-bar d-flex justify-content-center">
                <button onClick={openNewCard} className="btn btn-light-green rounded m-1">Add New Scene</button>
            </div>

            {changeCardModal()}
            {newCardModal()}
        </div>
    )
};

export default Corkboard;