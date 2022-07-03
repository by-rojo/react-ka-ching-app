#!/usr/bin/env node
const [, ,] = process.argv;

const projectConfig = {
  name: "project-name-goes-here",
  repository: {
    type: "git",
    url: "",
  },
  license: "0IJ2LJDPOIJWOIEJF-DEMO",
};

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questions = {
  name: {
    question: "Project Name",
    answer: "",
    required: false,
  },
  repoUrl: {
    question: "Git repo URL for the project",
    answer: "",
    required: false,
  },
  secretKey: {
    question: "Enter the license key",
    answer: "",
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