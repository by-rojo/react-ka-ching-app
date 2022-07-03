#!/usr/bin/env node
const [, ,] = process.argv;
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

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

const projectPath = () => path.join(process.cwd(), questions.name.answer);

const askQuestion = () => {
  return new Promise((resolve) => {
    const key = questionObjectKeys.shift();
    if (key) {
      const questionObject = questions[key];
      readline.question(`${questionObject.question}: `, (answer) => {
        questions[key].answer =
          key === "name"
            ? answer.toLocaleLowerCase().replace(/ /g, "-")
            : answer;
        resolve(askQuestion());
      });
    } else resolve();
  });
};

const generateProject = () => {
  return new Promise((resolve, reject) => {
    fs.mkdir(projectPath(), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const downloadWebFE = () => {
  return new Promise((resolve, reject) => {
    console.log("Downloading the frontend");
    exec(
      `curl -sL https://github.com/by-rojo/iagnmft-nodejs/zipball/main/ | tar zx --strip-components 1 -C ${projectPath()}`,
      (error, output) => {
        console.log(error || output);
        if (error) reject(error);
        else resolve();
      }
    );
  });
};

const installWebFE = () => {
  console.log("Installing the frontend");
  return new Promise((resolve, reject) => {
    exec(`cd ${projectPath()} && npm i`, (err, output) => {
      console.log(err || output || "Installed the frontend");
      if (err) reject(err);
      else resolve();
    });
  });
};

const exit = () => {
  readline.close();
};

askQuestion()
  .then(() => generateProject())
  .then(() => downloadWebFE())
  .then(() => installWebFE())
  .then(exit);
