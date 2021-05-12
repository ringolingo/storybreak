import React, {useState, useEffect, forceRefresh } from 'react';
import {Editor, EditorState, convertToRaw, convertFromRaw, Modifier, moveSelectionToEnd} from 'draft-js';
// import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import Corkboard from './components/Corkboard';
import Login from './components/Login';
import Logout from './components/Logout';
import './App.css';


function App() {
  const [editorState, setEditorState] = useState(
    () => EditorState.createEmpty(),
  );
  const [allStories, setAllStories] = useState([]);
  const [currentStoryId, setCurrentStoryId] = useState(null);
  const [currentStoryTitle, setCurrentStoryTitle] = useState('');
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [amendedTitle, setAmendedTitle] = useState('');
  const [inBoardView, setInBoardView] = useState(false);
  // TODO do I need two separate title setting modals?
  const [showNewTitleModal, setShowNewTitleModal] = useState(false);
  const [showNewSceneModal, setShowNewSceneModal] = useState(false);
  const [newSceneSummary, setNewSceneSummary] = useState('');
  const [user, setUser] = useState({
    id: null,
    email: '',
    first_name: '',
    last_name: '',
  });


  // app gets and remembers all of a user's stories on login
  useEffect(() => {
    getStories();
  }, [user]);

  const getStories = () => {
    if (user.id) {
      axios
        .get(`/api/stories/?user=${user.id}`)
        .then(response => {
          setAllStories(response.data);
        })
        .catch(error => console.log(error.response));
    }
  }


  // app gets user login through google
  const userCallbackLogIn = (user) => {
    setUser(user);
    getStories();
  }

  const userCallbackLogOut = (user) => {
    setUser(user);
    setCurrentStoryId(null);
    setCurrentStoryTitle('');
    setInBoardView(false);
    setAllStories([]);
  }

  // app gets and remembers user's choice for current story
  // and sets it up in the editor state
  const selectStory = (event) => {
    setCurrentStoryId(event.target.id);
    setCurrentStoryTitle(event.target.title);
    getCurrentStory(event.target.id);
  };

  const getCurrentStory = (story) => {
    axios
    .get(`/api/stories/${story}`)
    .then(response => {
      loadWork(response.data.draft_raw)
    })
    .catch(error => {
      console.log(error.response);
      setCurrentStoryId(null);
      setCurrentStoryTitle(null);
    })
  }

  const loadWork = (rawJson) => {
    const destringed = JSON.parse(rawJson);
    const newContentState = convertFromRaw(destringed);
    const newEditor = EditorState.createWithContent(newContentState);
    setEditorState(newEditor);
  }


  // app lets user pick a different story or start a new story
  const unselectStory = () => {
    setEditorState(
      () => EditorState.createEmpty(),
    )
    setCurrentStoryId(null);
    setCurrentStoryTitle('');
    // getStories();
  }

  const changeStory = () => {
    return (
      <div>
        <button className="btn btn-block story-list__title-change" onClick={unselectStory}>Choose A Different Story</button>
      </div>
    )
  }

   // app lets user change the title of a story
  const openNewTitle = () => {
    setShowNewTitleModal(true);
  }

  const closeNewTitle = () => {
    setAmendedTitle('');
    setShowNewTitleModal(false);
  }

  const newTitleInProgress = (event) => {
    setAmendedTitle(event.target.value);
  }

  const newTitleModal = () => {
    return (
        <Modal show={showNewTitleModal} onHide={closeNewTitle} animation={false} backdrop='static' centered={true} >    
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>What do you want the title of your story to be?</Form.Label>
                        <Form.Control as='textarea' value={amendedTitle} onChange={newTitleInProgress} />
                    </Form.Group>
                </Form>
            </Modal.Body>
        
            <Modal.Footer>
                <button className="btn btn-light-green" onClick={createNew}>
                    Set Title
                </button>
            </Modal.Footer>
        </Modal>
    )
  }

  // app lets user create a new story
  const createNew = () => {
    setEditorState(
      () => EditorState.createEmpty(),
    )

    if (amendedTitle === '') {
      closeNewTitle();
      return
    }

    axios
      .post('/api/stories/', {title: amendedTitle, draft_raw: "{\"blocks\":[],\"entityMap\":{}}", user: user.id})
      .then(response => {
        setCurrentStoryId(response.data.id)
        setCurrentStoryTitle(response.data.title)
        const expandedStories = [...allStories]
        expandedStories.push(response.data);
        setAllStories(expandedStories);
      })
      .catch(error => console.log(error));

    closeNewTitle();
    setAmendedTitle('');
    openNewScene();
  }


  // app shows user links to all of their stories
  const generateTitles = allStories.map((story, i) => {
    return <div className="d-flex justify-content-center">
      <button className="btn story-list__title" key={i} id={story.id} onClick={selectStory} title={story.title}>
        {story.title}
      </button>
    </div>
  });

  const noStorySelectedView = () => {
    if (user.id) {  
      return (
        <div className="story-list">
          <h4 className="story-list__header">hello, {user.first_name}, what would you like to write today?</h4>
          {generateTitles}
          <div className="d-flex justify-content-center">
            <button className="btn story-list__title-new btn-light-green" onClick={openNewTitle}>Start A New Story</button>
          </div>
        </div>
      )
    } else {
      return (
        <div className="no-user-page__box d-flex flex-column justify-content-around">
          <div className="p-5">
            <h3 className="story-list__header no-user-page__title p-2">welcome to storybreak</h3>
            <p className="text-center story-list__header-subhead p-2">write and outline your stories in one simple, clean interface</p>
          </div>
          
          <div class="container p-5">
            <div class="row">
              <div class="col text-center">
                <Login className="btn btn-block no-user-page__btn" setUser={userCallbackLogIn} />
              </div>
            </div>
          </div>
        </div>
      )
    }
  }


  // app lets user delete a story
  const confirmDelete = () => {
    if (window.confirm("are you sure you want to delete this story?")) {
        deleteWork();
    }
  }

  const deleteWork = () => {
    const trimmedStories = allStories.map((story) => {
      if (story.id !== currentStoryId) {
        return story;
      }
    })
    setAllStories(trimmedStories)

    axios
      .delete(`/api/stories/${currentStoryId}/`)
      .then(response => console.log(response.data))
      .catch(error => console.log(error))

    unselectStory();
  }


  // app updates story in state as user writes, and in database when saved
  const onEditorChange = (editorState) => {
    setEditorState(editorState);
  };

  const saveWork = (title, es) => {
    const contentState = es.getCurrentContent();
    const raw = convertToRaw(contentState);
    const updatedWork = {
        title: title,
        draft_raw: JSON.stringify(raw),
        user: user.id,
    }

    console.log('savework')
    axios
        .put(`/api/stories/${currentStoryId}/`, updatedWork)
        .then(response => console.log(response.data))
        .catch(error => console.log(error.response));
  };

  const saveExistingWork = () => {
    saveWork(currentStoryTitle, editorState)
  }


  // writer can create new scenes from either view
  const addSceneBlocks = (newScene) => {
    // create new content block for scene break, unless first line in story
    let currentContent = editorState.getCurrentContent();
    let editorToUse = editorState;
    let selection = editorToUse.getSelection();

    if (convertToRaw(currentContent)['blocks'].length > 1) {
      editorToUse = splitLine();
      currentContent = editorToUse.getCurrentContent();
      selection = editorToUse.getSelection();
    }
    
    // create an id to mark the beginning of a scene
    const sceneBreakId = newScene.entity_key;
    currentContent.createEntity('SCENE', 'IMMUTABLE', sceneBreakId);
    const entityKey = currentContent.getLastCreatedEntityKey();
    
    // create a content block and attach the scene break id to it
    const textToUse = '***'
    const textWithEntity = Modifier.insertText(currentContent, selection, textToUse, null, entityKey);
    const updatedEditorState = EditorState.push(editorToUse, textWithEntity, 'insert-characters')
    setEditorState(updatedEditorState);
    
    // create new content block for user's next input
    const editorWithSceneBlocks = splitLine(updatedEditorState);
    return editorWithSceneBlocks;
  };

  const splitLine = (es=editorState) => {
    // function makes a separate content blocks to go around scene break
    // so it isn't attached to a preexisting content block or to the next thing the user writes
    const currentContent = es.getCurrentContent();
    const selection = es.getSelection();
    const newLine = Modifier.splitBlock(currentContent, selection)
    const editorWithBreak = EditorState.push(es, newLine, "split-block")
    setEditorState(editorWithBreak)
    return editorWithBreak
  }

  const openNewScene = () => {
    setNewSceneSummary('');
    setShowNewSceneModal(true);
  }

  const closeNewScene = () => {
    setShowNewSceneModal(false);
  }

  const newSceneInProgress = (event) => {
    setNewSceneSummary(event.target.value);
  }

  const saveNewScene = () => {
    const sceneBreakId = Math.random().toString(36).substring(2,10)

    const newScene = {
      card_summary: newSceneSummary,
      story: currentStoryId,
      entity_key: sceneBreakId
    }

    axios
      .post("/api/scenes/", newScene)
      .then(response => console.log(response.data))
      .catch(error => console.log(error.response))
      
    closeNewScene();
    chainSaveFunction(newScene);
  }

  const chainSaveFunction = newScene => {
    const editorWithSceneBlocks = addSceneBlocks(newScene);
    const savedWork = saveWork(currentStoryTitle, editorWithSceneBlocks);
  }
  
  const newSceneModal = () => {
    return (
        <Modal show={showNewSceneModal} onHide={closeNewScene} animation={false} backdrop='static' centered={true} >    
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>What's a quick summary of what happens in this scene?</Form.Label>
                        <Form.Control as='textarea' value={newSceneSummary} onChange={newSceneInProgress} />
                    </Form.Group>
                </Form>
            </Modal.Body>
        
            <Modal.Footer>
                <button className="btn btn-light-green" onClick={saveNewScene}>
                    Make New Scene
                </button>
            </Modal.Footer>
        </Modal>
    )
  }


  // app lets user change story title
  const openTitleChange = () => {
    setShowTitleModal(true);
  }

  const closeTitleModal = () => {
    setShowTitleModal(false);
    setAmendedTitle('');
  }

  const titleChangeInProgress = (event) => {
    setAmendedTitle(event.target.value);
  }

  const saveTitleChange = () => {
    saveWork(amendedTitle, editorState);
    setCurrentStoryTitle(amendedTitle);
    const storiesPlusUpdate = allStories.map((story) => {
      if (story.id == currentStoryId) {
        const updatedStory = {...story}
        story.title = amendedTitle;
        return updatedStory;
      } else {
        return story
      }
    })
    setAllStories(storiesPlusUpdate);
    closeTitleModal();
  }

  const changeTitleModal = () => {
    return (
        <Modal show={showTitleModal} onHide={closeTitleModal} animation={false} backdrop='static' centered={true} >    
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>New Title</Form.Label>
                        <Form.Control as='textarea' value={amendedTitle} onChange={titleChangeInProgress} />
                    </Form.Group>
                </Form>
            </Modal.Body>
        
            <Modal.Footer>
                <button className="btn btn-yellow" onClick={closeTitleModal}>
                    Close
                </button>
                <button className="btn btn-light-green" onClick={saveTitleChange}>
                    Save New Title
                </button>
            </Modal.Footer>
        </Modal>
    )
  }


  // app lets user switch between the writing view and the planning view
  const goToStoryBoard = () => {
    // moves selection to end of state so new scenes made in corkboard will spawn at end of text
    const moveScenePoint = EditorState.moveSelectionToEnd(editorState);
    setEditorState(moveScenePoint);
    saveWork(currentStoryTitle, moveScenePoint)
    setInBoardView(true);
  }

  const goToWritingDesk = () => {
    getCurrentStory(currentStoryId);
    setInBoardView(false);
  }

  const switchViewButton = () => {
    if (inBoardView) {
      return (
        <button className="btn btn-block" onClick={goToWritingDesk}>Go To Writing Desk</button>
      )
    } else {
      return (
        <button className="btn btn-block" onClick={goToStoryBoard}>Go To Story Board</button>
      )
    }
  }


  // app displays the story the user wants to work on
  // either as a writing desk, or as a corkboard
  const storyInProgressView = () => {
      if (inBoardView) {
        return (
          <Corkboard currentStoryId={currentStoryId} backToDesk={goToWritingDesk} addSceneCallback={chainSaveFunction} />
        )
      } else {
        return (
          <div className="writing-desk__desk">
            
            <div className="writing-desk__editor container border border-dark rounded rounded w-85 h-85">
              <Editor
                editorState={editorState}
                onChange={onEditorChange}
                spellCheck={true}
              />
            </div>

            <div className="writing-desk__button-bar d-flex flex-row justify-content-center">
                <button onClick={saveExistingWork} className="btn btn-light-green rounded m-1">Save</button>
                <button onClick={openNewScene} className="btn btn-yellow rounded m-1">Add New Scene</button>
                <button onClick={openTitleChange} className="btn btn-yellow rounded m-1">Change Title</button>
                <button onClick={confirmDelete} className="btn btn-red rounded m-1">Delete Story</button>
            </div>
    
            {changeTitleModal()}
            </div>
        )
      }
  }
  

  return (
    <div className="site-body">
      <div className="sticky-top header__site-name spring-green">
        <h1>STORYBREAK</h1>
      </div>

      <div className="body-site">
        <div className="d-flex justify-content-end main-options-nav">
          { currentStoryId ?  <div className="d-flex justify-content-center"><button className="btn btn-block story-list__title-change">{currentStoryTitle}</button></div> : null }
          { currentStoryId ? switchViewButton() : null }
          { currentStoryId ? changeStory() : null }
          { user.email ? <Logout setUser={userCallbackLogOut} /> : null }
        </div>

        {currentStoryId ? storyInProgressView() : noStorySelectedView()}
        {newTitleModal()}
        {newSceneModal()}
      </div>

      {/* <div className="sticky-bottom spring-green ada-footer">
        <p>storybreak is a student project by Ringo Alcock, Ada Developers Academy, Cohort 14</p>
      </div> */}
      <footer className="sticky-bottom spring-green ada-footer">
        <p>storybreak is a student project by Ringo Alcock, Ada Developers Academy, Cohort 14</p>
      </footer>

    </div>
  );
}

export default App;