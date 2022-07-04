#!/usr/bin/env node
const [, ,] = process.argv;
const fs = require("fs");
const path = require("path");
const colors = require("ansi-colors")
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

const loadingIndicator = (message) => {
    let step = 1;
    console.log(message)
    return setInterval(() => {
        process.stdout.clearLine()
        process.stdout.cursorTo(0)

        switch(step) {
            case (1):
                process.stdout.write(colors.magenta('°°°'))
                break;
            case (2):
                process.stdout.write(colors.magenta('•°°'))
                break;
            case (3):
                process.stdout.write(colors.magenta('°•°'))
     
                break;
            default:
                process.stdout.write(colors.magenta('°°•'))
                break;
        }
        step = step === 4 ? 1 : step + 1;
    }, 200)
}


const projectPath = () => path.join(process.cwd(), questions.name.answer);
const projectClientPath = () => path.join(projectPath(), 'client');
const projectServerPath = () => path.join(projectPath(), 'server');

const askQuestion = () => {
  return new Promise((resolve) => {
    const key = questionObjectKeys.shift();
    if (key) {
      const questionObject = questions[key];
      readline.question(`${questionObject.question}: `, (answer) => {
        const finalAnswer = (answer || questions[key].answer)
        questions[key].answer =
          key === "name"
            ? finalAnswer.toLocaleLowerCase().replace(/ /g, "-")
            : finalAnswer;
        resolve(askQuestion());
      });
    } else resolve();
  });
};

const generateProject = () => {
  return new Promise((resolve, reject) => {
    fs.mkdir(projectPath(), (err) => {
        if (err) return reject(err);
        fs.mkdir(projectClientPath(), (err) => {
            if (err) return reject(err);
            fs.mkdir(projectServerPath(), (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
  });
};

const stopLoadingIndicator = (loadingInstance, message) => {
    clearInterval(loadingInstance)
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    if(message) console.log(colors.green(message))
}

const downloadWebFE = () => {
  const loadingInstance = loadingIndicator("Downloading the frontend...")
  return new Promise((resolve, reject) => {
    exec(
      `curl -sL https://github.com/by-rojo/iagnmft-nodejs/zipball/main/ | tar zx --strip-components 1 -C ${projectClientPath()}`,
      (error, output) => {
        stopLoadingIndicator(loadingInstance, "Successfully downloaded the frontend!")
        if (error) reject(error);
        else resolve();
      }
    );
  });
};

const installWebFE = () => {
  const loadingInstance = loadingIndicator("Installing the frontend...")
  return new Promise((resolve, reject) => {
    exec(`cd ${projectClientPath()} && npm i`, (err) => {
      stopLoadingIndicator(loadingInstance, "Successfully installed the frontend!")
      if (err) reject(err);
      else resolve();
    });
  })
};

const downloadWordPressBE = () => {
  const loadingInstance = loadingIndicator("Downloading WordPress backend application...")
  return new Promise((resolve, reject) => {
    exec(
      `curl -sL https://github.com/by-rojo/react-ka-ching-wp/zipball/main/ | tar zx --strip-components 1 -C ${projectServerPath()}`,
      (error) => {
        stopLoadingIndicator(loadingInstance, "Successfully downloaded the WordPress backend!")
        if (error) reject(error);
        else resolve();
      }
    );
  });
  };

const exit = () => {
  readline.close();
};

askQuestion()
  .then(() => generateProject())
  .then(() => downloadWebFE())
  .then(() => installWebFE())
  .then(() => downloadWordPressBE())
  .then(exit)
  .catch((err) => {
    console.error(err)
    exit()
  })
