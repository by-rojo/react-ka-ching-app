#!/usr/bin/env node
const [, ,] = process.argv;

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questions = {
  name: {
    question: "Project Name",
    answer: "project-name-goes-here",
    required: false,
  },
  repoUrl: {
    question: "Git repo URL for the project",
    answer: "",
    required: false,
  },
  secretKey: {
    question: "Enter the license key",
    answer: "0IJ2LJDPOIJWOIEJF-DEMO",
    required: false,
  },
};

const questionObjectKeys = Object.keys(questions);

const askQuestion = () => {
  const key = questionObjectKeys.shift();
  if (key) {
    const questionObject = questions[key]
    readline.question(`${questionObject.question}: `, (answer) => {
        questions[key].answer = key === "name" ? answer.toLocaleLowerCase().replace(/ /g, "-") : answer;
        askQuestion()
    });
  } else {
    readline.close();
  }
};

askQuestion()