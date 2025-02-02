import { fetchJSON } from "https://js.sabae.cc/fetchJSON.js";
import { removeElement, getElement, getSessionId } from "./utils/util.js";

const FINAL_QUIZ_ID = 99999;

let state = new Map();

const setQuizList = (data) => {
  console.log("setQuiz", data)
  data.map((a, i) => {
    if (i !== data.length - 1) {
      a.nextId = data[i + 1]["quizId"];
    }
    if (a.lastQuestion){
      a.nextId = FINAL_QUIZ_ID;
    }
    return a;
  });
  state.set("quizList", data);
};
getElement("submitButton").disabled = true;

const getQuizList = () => state.get("quizList");
const setCurrentChoice = (data) => state.set("currentChoice", data);
const getCurrentChoice = () => state.get("currentChoice");
const setCurrentQuiz = (data) => state.set("currentQuiz", data);
const getCurrentQuiz = () => state.get("currentQuiz");
const setAnswers = ({ id, currAns }) => {
  const newAnswers = getAnswers().map((d) => {
    return d.quizId === id ? { quizId: d.quizId, amswer: currAns } : d;
  });
  state.set("answers", newAnswers);
};
const getAnswers = () => state.get("answers");
const initAnsList = () =>
  state.set(
    "answers",
    getQuizList().map(({ quizId }) => ({ quizId, answer: 999 }))
  );

const createChoices = ({ choices }) => {
  choices.map(({ text, id }) => {
    const container = document.createElement("div");
    const choiceBtn = document.createElement("button");
    const crrElId = `choices_${id}`;

    choiceBtn.setAttribute("id", crrElId);
    choiceBtn.setAttribute("class", "main-choice-button button_unclick");
    choiceBtn.innerText = text;
    container.appendChild(choiceBtn);
    getElement("choicesContainer").appendChild(container);

    getElement(crrElId).onclick = () => {
      getElement("submitButton").disabled = false;
      setCurrentChoice(id);
    };
  });

  return;
};

const end = async () => {
  const nowSession = getSessionId();
  const answers = getAnswers();
  const a = await fetchJSON("/api/saveAnswer", {
    session: nowSession,
    answers: answers,
  });
};

window.onload = async () => {
  const nowSession = getSessionId();
  if (!nowSession) {
    location.href = "/";
  }
  getElement("exit").onclick = () => {
    location.href = "/";
  };
  const quizList = await fetchJSON("/api/getQuestion", { session: nowSession })

  setQuizList(quizList);
  initAnsList(initAnsList);
  setCurrentQuiz(getQuizList()[0]);
  loopQuiz(getCurrentQuiz());
};

const loopQuiz = async (nowQuiz) => {
  getElement("quizStatement").innerText = nowQuiz.statement;
  createChoices(nowQuiz);

  visibility("answerContainer", false);
  visibility("choicesContainer", true);
  visibility("submitButton", true);
  visibility("nextButton", false);
  visibility("resultButton", false);

  getElement("submitButton").onclick = async () => {
    const { nextId, lastQuestion } = nowQuiz;
    visibility("answerContainer", true);
    visibility("choicesContainer", false);
    visibility("submitButton", false);

    if (nowQuiz.lastQuestion) {
      visibility("resultButton", true);
    } else {
      visibility("nextButton", true);
    }

    setAnswers({
      id: nowQuiz.quizId,
      currAns: getCurrentChoice(),
    });

    const { explanation, answerId } = await fetchJSON("/api/getAnswer", {
      quizId: nowQuiz.quizId,
    });

    if(answerId===getCurrentChoice()){
      getElement("correct").innerText="正解";
    }else{
      getElement("correct").innerText="不正解";
    }

    const choiceText = nowQuiz.choices.find((a) => a.id === answerId).text;
    getElement("explanation").innerText = explanation;
    getElement("answer").innerText = choiceText;
  };

  getElement("nextButton").onclick = async () => {
    const nextId = nowQuiz.nextId;
    const nextQuiz = getQuizList().find((a) => a.quizId === nextId);

    removeElement("#choicesContainer");
    visibility("submitButton", false);
    visibility("nextButton", true);

    getElement("quizStatement").innerText = "";
    getElement("explanation").innerText = "";
    getElement("answer").innerText = "";
    loopQuiz(nextQuiz);
    getElement("submitButton").disabled = true;
  };

  getElement("resultButton").onclick = () => {
    end()
    location.href = "/result.html";
  };
};

const visibility = (el, isVisible) => {
  isVisible
    ? (getElement(el).style.display = "block")
    : (getElement(el).style.display = "none");
};
